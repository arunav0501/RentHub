const prisma = require('../utils/prisma');
const asyncHandler = require('../utils/asyncHandler');
const { z } = require('zod');

const bookingSchema = z.object({
  productId: z.string(),
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().transform((str) => new Date(str)),
  paymentMethod: z
    .enum(['CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'WALLET', 'CASH_ON_DELIVERY'])
    .default('WALLET'),
  paymentDetails: z.any().optional(),
});

// Create a booking
exports.createBooking = asyncHandler(async (req, res) => {
  const { productId, startDate, endDate, paymentMethod, paymentDetails } =
    bookingSchema.parse(req.body);

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return res.status(404).json({ message: 'Product not found' });
  if (product.ownerId === req.user.id) {
    return res.status(400).json({ message: 'You cannot rent your own product' });
  }

  const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  if (days <= 0) return res.status(400).json({ message: 'End date must be after start date' });

  // Compute total price (dailyRent * days + 12% protection fee + refundable deposit)
  const baseRental = days * product.dailyRent;
  const protectionFee = Math.round(baseRental * 0.12);
  const deposit = Math.round(product.dailyRent * 1.5);
  const totalPrice = baseRental + protectionFee + deposit;

  let paymentStatus = 'PENDING';
  let paymentRef = null;
  let initialStatus = 'PENDING';

  // Process payment based on method
  if (paymentMethod === 'WALLET') {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { walletBalance: true },
    });

    if (!user || user.walletBalance < totalPrice) {
      return res.status(400).json({
        message: `Insufficient RentHub Wallet balance. Total needed: ₹${totalPrice}, Available: ₹${
          user?.walletBalance ?? 0
        }. Please add funds to your wallet.`,
      });
    }

    const refSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    paymentRef = `TXN-RH-WLT-${Date.now()}-${refSuffix}`;

    // Deduct from wallet & create transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: req.user.id },
        data: { walletBalance: { decrement: totalPrice } },
      }),
      prisma.walletTransaction.create({
        data: {
          userId: req.user.id,
          amount: totalPrice,
          type: 'DEBIT',
          category: 'RENTAL_PAYMENT',
          description: `Rental payment for ${product.title} (${days} days)`,
          paymentMethod: 'WALLET',
          referenceId: paymentRef,
          status: 'COMPLETED',
        },
      }),
    ]);

    paymentStatus = 'PAID';
    initialStatus = 'APPROVED';
  } else if (paymentMethod === 'CREDIT_CARD' || paymentMethod === 'DEBIT_CARD') {
    const cardLast4 = paymentDetails?.cardNumber ? paymentDetails.cardNumber.slice(-4) : '••••';
    const refSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    paymentRef = `TXN-RH-CRD-${Date.now()}-${refSuffix}`;
    paymentStatus = 'PAID';
    initialStatus = 'APPROVED';
  } else if (paymentMethod === 'UPI') {
    const refSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    paymentRef = `TXN-RH-UPI-${Date.now()}-${refSuffix}`;
    paymentStatus = 'PAID';
    initialStatus = 'APPROVED';
  } else if (paymentMethod === 'CASH_ON_DELIVERY') {
    paymentRef = `COD-RH-${Date.now().toString(36).toUpperCase()}`;
    paymentStatus = 'CASH_ON_DELIVERY';
    initialStatus = 'PENDING';
  }

  const booking = await prisma.booking.create({
    data: {
      productId,
      userId: req.user.id,
      startDate,
      endDate,
      totalPrice,
      status: initialStatus,
      paymentMethod,
      paymentStatus,
      paymentRef,
    },
    include: {
      product: true,
    },
  });

  res.status(201).json(booking);
});

// Get user's outgoing booking requests
exports.getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await prisma.booking.findMany({
    where: { userId: req.user.id },
    include: {
      product: {
        include: { owner: { select: { name: true, email: true, phone: true } } }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json(bookings);
});

// Get owner's incoming booking requests
exports.getOwnerRequests = asyncHandler(async (req, res) => {
  const bookings = await prisma.booking.findMany({
    where: {
      product: { ownerId: req.user.id }
    },
    include: {
      product: true,
      user: { select: { id: true, name: true, email: true, phone: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json(bookings);
});

// Update booking status (Owner only)
exports.updateBookingStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { product: true }
  });

  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  if (booking.product.ownerId !== req.user.id && req.user.id !== booking.userId) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: { status }
  });

  res.json(updated);
});
