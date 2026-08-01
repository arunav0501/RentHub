const prisma = require('../utils/prisma');
const asyncHandler = require('../utils/asyncHandler');
const { z } = require('zod');

const bookingSchema = z.object({
  productId: z.string(),
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().transform((str) => new Date(str)),
});

// Create a booking
exports.createBooking = asyncHandler(async (req, res) => {
  const { productId, startDate, endDate } = bookingSchema.parse(req.body);

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return res.status(404).json({ message: 'Product not found' });
  if (product.ownerId === req.user.id) {
    return res.status(400).json({ message: 'You cannot rent your own product' });
  }

  const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  if (days <= 0) return res.status(400).json({ message: 'End date must be after start date' });

  const totalPrice = days * product.dailyRent;

  const booking = await prisma.booking.create({
    data: {
      productId,
      userId: req.user.id,
      startDate,
      endDate,
      totalPrice,
    },
    include: {
      product: true,
    }
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
      user: { select: { name: true, email: true, phone: true } }
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
