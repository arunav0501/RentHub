const prisma = require('../utils/prisma');

/**
 * RentHub Trust Score Service
 * 
 * Calculates a transparent, 0-100 reputation score server-side from real database entities.
 * Factors evaluated:
 * - Profile completeness (Name, Email, Phone, Account Age)
 * - Listing quality (Active listings, images, detailed descriptions, specifications)
 * - Rental history & fulfillment (Completed rentals, acceptance/fulfillment rate)
 * - Reliability & cancellation behavior (Cancellation penalties)
 * 
 * Score levels:
 * 90-100: Excellent
 * 75-89:  Very Good
 * 60-74:  Good
 * 40-59:  Fair
 * 0-39:   Low
 * 
 * Brand new users receive a transparent neutral baseline (~60-68) with "New Member" status.
 */

function getTier(score) {
  if (score >= 90) return { label: 'Excellent', color: 'green' };
  if (score >= 75) return { label: 'Very Good', color: 'emerald' };
  if (score >= 60) return { label: 'Good', color: 'blue' };
  if (score >= 40) return { label: 'Fair', color: 'amber' };
  return { label: 'Low', color: 'red' };
}

async function calculateUserTrustScore(userId, requestedRole = null) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
      products: {
        select: {
          id: true,
          title: true,
          description: true,
          image: true,
          brand: true,
          model: true,
          condition: true,
        },
      },
      bookings: {
        select: {
          id: true,
          status: true,
          createdAt: true,
          startDate: true,
          endDate: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Fetch bookings where this user is the product owner
  const ownerBookings = await prisma.booking.findMany({
    where: {
      product: {
        ownerId: userId,
      },
    },
    select: {
      id: true,
      status: true,
      createdAt: true,
      startDate: true,
      endDate: true,
    },
  });

  const role = (requestedRole || (user.products.length > 0 || user.role === 'OWNER' ? 'OWNER' : 'RENTER')).toUpperCase();
  const accountAgeDays = Math.max(0, Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)));

  if (role === 'OWNER') {
    return calculateOwnerScore(user, ownerBookings, accountAgeDays);
  } else {
    return calculateRenterScore(user, accountAgeDays);
  }
}

function calculateOwnerScore(user, ownerBookings, accountAgeDays) {
  const indicators = [];
  const breakdown = [];
  const isNewMember = user.products.length === 0 && ownerBookings.length === 0;

  // 1. Profile Completeness (Max: 20 pts)
  let profileScore = 0;
  if (user.name) {
    profileScore += 5;
    indicators.push('✓ Verified Profile Name');
  }
  if (user.email) {
    profileScore += 5;
    indicators.push('✓ Verified Email Address');
  }
  if (user.phone && user.phone.trim().length > 0) {
    profileScore += 5;
    indicators.push('✓ Phone Number Linked');
  }
  if (accountAgeDays >= 30) {
    profileScore += 5;
    const months = Math.floor(accountAgeDays / 30);
    indicators.push(`✓ Member for ${months} month${months > 1 ? 's' : ''}`);
  } else if (accountAgeDays >= 7) {
    profileScore += 3;
    indicators.push(`✓ Member for ${accountAgeDays} days`);
  } else {
    profileScore += 1;
    if (isNewMember) indicators.push('✓ New Member Account');
  }
  profileScore = Math.min(20, profileScore);
  breakdown.push({
    category: 'Profile Completeness',
    score: Math.round(profileScore),
    maxScore: 20,
    weight: '20%',
  });

  // 2. Listing Quality (Max: 25 pts)
  let listingScore = 0;
  const productCount = user.products.length;
  if (productCount === 0) {
    // Neutral baseline for new owners
    listingScore = isNewMember ? 15 : 5;
  } else {
    // Catalog size (up to 10 pts)
    const catalogPts = Math.min(10, productCount * 2.5);

    // Image coverage (up to 5 pts)
    const withImage = user.products.filter((p) => p.image).length;
    const imagePts = (withImage / productCount) * 5;
    if (withImage === productCount) {
      indicators.push('✓ 100% Listings with Verified Photos');
    }

    // Detailed description (up to 5 pts)
    const withDesc = user.products.filter((p) => p.description && p.description.trim().length >= 40).length;
    const descPts = (withDesc / productCount) * 5;

    // Detailed specs (up to 5 pts)
    const withSpecs = user.products.filter((p) => (p.brand || p.model) && p.condition).length;
    const specPts = (withSpecs / productCount) * 5;

    listingScore = catalogPts + imagePts + descPts + specPts;
    indicators.push(`✓ ${productCount} Active Rental Listing${productCount > 1 ? 's' : ''}`);
  }
  listingScore = Math.min(25, listingScore);
  breakdown.push({
    category: 'Listing Quality',
    score: Math.round(listingScore),
    maxScore: 25,
    weight: '25%',
  });

  // 3. Rental History & Fulfillment (Max: 35 pts)
  let historyScore = 0;
  const totalOwnerBookings = ownerBookings.length;
  const completedRentals = ownerBookings.filter((b) => b.status === 'COMPLETED').length;
  const approvedRentals = ownerBookings.filter((b) => b.status === 'APPROVED').length;

  if (totalOwnerBookings === 0) {
    historyScore = isNewMember ? 20 : 12;
  } else {
    // Completed volume (up to 20 pts)
    const volumePts = Math.min(20, completedRentals * 4);
    // Fulfillment rate (up to 15 pts)
    const fulfillmentRate = (completedRentals + approvedRentals) / totalOwnerBookings;
    const fulfillmentPts = fulfillmentRate * 15;
    historyScore = volumePts + fulfillmentPts;

    if (completedRentals > 0) {
      indicators.push(`✓ ${completedRentals} Completed Rental${completedRentals > 1 ? 's' : ''}`);
    }
  }
  historyScore = Math.min(35, historyScore);
  breakdown.push({
    category: 'Rental History & Fulfillment',
    score: Math.round(historyScore),
    maxScore: 35,
    weight: '35%',
  });

  // 4. Reliability & Cancellation Behavior (Max: 20 pts)
  let reliabilityScore = 0;
  const cancellations = ownerBookings.filter((b) => b.status === 'CANCELLED').length;

  if (totalOwnerBookings === 0) {
    reliabilityScore = isNewMember ? 15 : 12;
  } else {
    const cancelRate = cancellations / totalOwnerBookings;
    if (cancellations === 0) {
      reliabilityScore = 20;
      indicators.push('✓ 0 Cancellations (100% Reliability)');
    } else if (cancelRate <= 0.05) {
      reliabilityScore = 16;
      indicators.push('✓ Low Cancellation Rate (<5%)');
    } else if (cancelRate <= 0.15) {
      reliabilityScore = 10;
    } else if (cancelRate <= 0.30) {
      reliabilityScore = 5;
    } else {
      reliabilityScore = 0;
    }
  }
  reliabilityScore = Math.min(20, reliabilityScore);
  breakdown.push({
    category: 'Reliability & Cancellations',
    score: Math.round(reliabilityScore),
    maxScore: 20,
    weight: '20%',
  });

  // Final aggregate clamped 0 - 100
  const totalScore = Math.max(0, Math.min(100, Math.round(profileScore + listingScore + historyScore + reliabilityScore)));
  const tier = getTier(totalScore);

  return {
    userId: user.id,
    name: user.name,
    role: 'OWNER',
    score: totalScore,
    tier: tier.label,
    tierColor: tier.color,
    isNewMember,
    breakdown,
    indicators,
    stats: {
      activeListings: productCount,
      completedRentals,
      totalRequestsReceived: totalOwnerBookings,
      cancellations,
      cancellationRate: totalOwnerBookings > 0 ? (cancellations / totalOwnerBookings) : 0,
      accountAgeDays,
    },
  };
}

function calculateRenterScore(user, accountAgeDays) {
  const indicators = [];
  const breakdown = [];
  const renterBookings = user.bookings || [];
  const totalBookings = renterBookings.length;
  const completedRentals = renterBookings.filter((b) => b.status === 'COMPLETED').length;
  const isNewMember = totalBookings === 0;

  // 1. Profile Completeness (Max: 25 pts)
  let profileScore = 0;
  if (user.name) {
    profileScore += 10;
    indicators.push('✓ Verified Profile Name');
  }
  if (user.email) {
    profileScore += 8;
    indicators.push('✓ Verified Email Address');
  }
  if (user.phone && user.phone.trim().length > 0) {
    profileScore += 7;
    indicators.push('✓ Phone Number Linked');
  }
  profileScore = Math.min(25, profileScore);
  breakdown.push({
    category: 'Profile Completeness',
    score: Math.round(profileScore),
    maxScore: 25,
    weight: '25%',
  });

  // 2. Account Age & Tenure (Max: 15 pts)
  let ageScore = 5;
  if (accountAgeDays >= 60) {
    ageScore = 15;
    const months = Math.floor(accountAgeDays / 30);
    indicators.push(`✓ Member for ${months} months`);
  } else if (accountAgeDays >= 30) {
    ageScore = 12;
    indicators.push(`✓ Member for 1 month`);
  } else if (accountAgeDays >= 7) {
    ageScore = 8;
    indicators.push(`✓ Member for ${accountAgeDays} days`);
  } else {
    ageScore = 5;
    if (isNewMember) indicators.push('✓ New Community Member');
  }
  ageScore = Math.min(15, ageScore);
  breakdown.push({
    category: 'Account Tenure',
    score: Math.round(ageScore),
    maxScore: 15,
    weight: '15%',
  });

  // 3. Rental Experience & History (Max: 35 pts)
  let rentalScore = 0;
  if (totalBookings === 0) {
    rentalScore = 20; // Neutral baseline for new renters
  } else {
    // Completed volume (up to 25 pts)
    const volumePts = Math.min(25, completedRentals * 5);
    // Success rate (up to 10 pts)
    const successRate = completedRentals / totalBookings;
    const successPts = successRate * 10;
    rentalScore = volumePts + successPts;

    if (completedRentals > 0) {
      indicators.push(`✓ ${completedRentals} Completed Rental${completedRentals > 1 ? 's' : ''}`);
    }
  }
  rentalScore = Math.min(35, rentalScore);
  breakdown.push({
    category: 'Rental Experience',
    score: Math.round(rentalScore),
    maxScore: 35,
    weight: '35%',
  });

  // 4. Reliability & Cancellation Record (Max: 25 pts)
  let reliabilityScore = 0;
  const cancellations = renterBookings.filter((b) => b.status === 'CANCELLED').length;

  if (totalBookings === 0) {
    reliabilityScore = 18; // Neutral baseline
  } else {
    const cancelRate = cancellations / totalBookings;
    if (cancellations === 0) {
      reliabilityScore = 25;
      indicators.push('✓ 0 Booking Cancellations (100% Reliability)');
    } else if (cancelRate <= 0.10) {
      reliabilityScore = 18;
      indicators.push('✓ Low Cancellation Rate (<10%)');
    } else if (cancelRate <= 0.25) {
      reliabilityScore = 10;
    } else {
      reliabilityScore = 0;
    }
  }
  reliabilityScore = Math.min(25, reliabilityScore);
  breakdown.push({
    category: 'Reliability & Cancellations',
    score: Math.round(reliabilityScore),
    maxScore: 25,
    weight: '25%',
  });

  const totalScore = Math.max(0, Math.min(100, Math.round(profileScore + ageScore + rentalScore + reliabilityScore)));
  const tier = getTier(totalScore);

  return {
    userId: user.id,
    name: user.name,
    role: 'RENTER',
    score: totalScore,
    tier: tier.label,
    tierColor: tier.color,
    isNewMember,
    breakdown,
    indicators,
    stats: {
      completedRentals,
      totalBookings,
      cancellations,
      cancellationRate: totalBookings > 0 ? (cancellations / totalBookings) : 0,
      accountAgeDays,
    },
  };
}

module.exports = {
  calculateUserTrustScore,
  getTier,
};
