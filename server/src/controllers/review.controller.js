const prisma = require('../utils/prisma');
const asyncHandler = require('../utils/asyncHandler');
const { z } = require('zod');

const createReviewSchema = z.object({
  productId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(3, 'Review comment must be at least 3 characters long'),
  bookingId: z.string().optional(),
});

// GET /api/reviews/product/:productId
exports.getProductReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const reviews = await prisma.review.findMany({
    where: { productId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const totalReviews = reviews.length;
  let averageRating = 0;
  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  if (totalReviews > 0) {
    const sum = reviews.reduce((acc, r) => {
      counts[r.rating] = (counts[r.rating] || 0) + 1;
      return acc + r.rating;
    }, 0);
    averageRating = Number((sum / totalReviews).toFixed(1));
  }

  const breakdown = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: counts[stars] || 0,
    percentage: totalReviews > 0 ? Math.round(((counts[stars] || 0) / totalReviews) * 100) : 0,
  }));

  res.json({
    reviews,
    stats: {
      totalReviews,
      averageRating,
      breakdown,
    },
  });
});

// GET /api/reviews/can-review/:productId (Protected)
exports.checkCanReview = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const userId = req.user.id;

  // Check if product exists
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  // Prevent owner from reviewing own product
  if (product.ownerId === userId) {
    return res.json({
      canReview: false,
      reason: 'Owner cannot review their own product',
      eligibleBookingId: null,
      alreadyReviewed: false,
    });
  }

  // Find a qualifying booking (COMPLETED or APPROVED)
  const qualifyingBooking = await prisma.booking.findFirst({
    where: {
      productId,
      userId,
      status: { in: ['COMPLETED', 'APPROVED'] },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!qualifyingBooking) {
    return res.json({
      canReview: false,
      reason: 'Only verified renters with a completed or active booking can review this item',
      eligibleBookingId: null,
      alreadyReviewed: false,
    });
  }

  // Check if user already reviewed this product
  const existingReview = await prisma.review.findFirst({
    where: {
      productId,
      userId,
    },
  });

  return res.json({
    canReview: !existingReview,
    reason: existingReview ? 'You have already reviewed this item' : null,
    eligibleBookingId: qualifyingBooking.id,
    alreadyReviewed: !!existingReview,
    existingReview,
  });
});

// POST /api/reviews (Protected)
exports.createReview = asyncHandler(async (req, res) => {
  const { productId, rating, comment, bookingId } = createReviewSchema.parse(req.body);
  const userId = req.user.id;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  if (product.ownerId === userId) {
    return res.status(400).json({ message: 'You cannot review your own product' });
  }

  // Verify booking eligibility
  let targetBooking = null;
  if (bookingId) {
    targetBooking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        productId,
        userId,
        status: { in: ['COMPLETED', 'APPROVED'] },
      },
    });
  } else {
    targetBooking = await prisma.booking.findFirst({
      where: {
        productId,
        userId,
        status: { in: ['COMPLETED', 'APPROVED'] },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  if (!targetBooking) {
    return res.status(403).json({
      message: 'Verified renter check failed: You must have a completed rental to review this product.',
    });
  }

  // Check for duplicate review
  const existingReview = await prisma.review.findFirst({
    where: {
      productId,
      userId,
    },
  });

  if (existingReview) {
    // Update existing review
    const updated = await prisma.review.update({
      where: { id: existingReview.id },
      data: {
        rating,
        comment,
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });
    return res.json(updated);
  }

  const newReview = await prisma.review.create({
    data: {
      productId,
      userId,
      bookingId: targetBooking.id,
      rating,
      comment,
    },
    include: {
      user: { select: { id: true, name: true } },
    },
  });

  res.status(201).json(newReview);
});
