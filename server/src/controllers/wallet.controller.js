const prisma = require('../utils/prisma');
const asyncHandler = require('../utils/asyncHandler');
const { z } = require('zod');

const addFundsSchema = z.object({
  amount: z.number().positive().min(50, 'Minimum top-up amount is ₹50'),
  paymentMethod: z.enum(['UPI', 'CARD', 'NETBANKING']).default('UPI'),
  upiId: z.string().optional(),
  cardLast4: z.string().optional(),
});

const withdrawSchema = z.object({
  amount: z.number().positive().min(50, 'Minimum withdrawal amount is ₹50'),
  withdrawalMethod: z.enum(['UPI', 'BANK_TRANSFER']).default('UPI'),
  upiId: z.string().optional(),
  bankDetails: z
    .object({
      accountNumber: z.string().min(6),
      ifsc: z.string().min(4),
      accountHolder: z.string().min(2),
    })
    .optional(),
});

// GET /api/wallet
exports.getWallet = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      walletBalance: true,
    },
  });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const transactions = await prisma.walletTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  let totalCredited = 0;
  let totalDebited = 0;

  for (const tx of transactions) {
    if (tx.status === 'COMPLETED') {
      if (tx.type === 'CREDIT') totalCredited += tx.amount;
      else if (tx.type === 'DEBIT') totalDebited += tx.amount;
    }
  }

  res.json({
    balance: user.walletBalance,
    totalCredited,
    totalDebited,
    transactions,
  });
});

// POST /api/wallet/add-funds
exports.addFunds = asyncHandler(async (req, res) => {
  const { amount, paymentMethod, upiId, cardLast4 } = addFundsSchema.parse(req.body);
  const userId = req.user.id;

  const refSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
  const referenceId = `TXN-RH-TOPUP-${Date.now()}-${refSuffix}`;

  const description =
    paymentMethod === 'UPI' && upiId
      ? `Wallet Top-up via UPI (${upiId})`
      : paymentMethod === 'CARD' && cardLast4
      ? `Wallet Top-up via Card ending in ${cardLast4}`
      : `Wallet Top-up via ${paymentMethod}`;

  // Execute in transaction
  const result = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        walletBalance: {
          increment: amount,
        },
      },
      select: {
        walletBalance: true,
      },
    });

    const transaction = await tx.walletTransaction.create({
      data: {
        userId,
        amount,
        type: 'CREDIT',
        category: 'TOPUP',
        description,
        paymentMethod,
        referenceId,
        status: 'COMPLETED',
      },
    });

    return { balance: updatedUser.walletBalance, transaction };
  });

  res.status(201).json({
    message: `Successfully added ₹${amount.toFixed(2)} to your RentHub Wallet!`,
    balance: result.balance,
    transaction: result.transaction,
  });
});

// POST /api/wallet/withdraw
exports.withdrawFunds = asyncHandler(async (req, res) => {
  const { amount, withdrawalMethod, upiId, bankDetails } = withdrawSchema.parse(req.body);
  const userId = req.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { walletBalance: true },
  });

  if (!user) return res.status(404).json({ message: 'User not found' });

  if (user.walletBalance < amount) {
    return res.status(400).json({
      message: `Insufficient wallet balance. Available: ₹${user.walletBalance.toFixed(2)}, Requested: ₹${amount.toFixed(2)}`,
    });
  }

  const refSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
  const referenceId = `TXN-RH-WTH-${Date.now()}-${refSuffix}`;

  let description = `Withdrawal via ${withdrawalMethod}`;
  if (withdrawalMethod === 'UPI' && upiId) {
    description = `Payout to UPI ID: ${upiId}`;
  } else if (withdrawalMethod === 'BANK_TRANSFER' && bankDetails) {
    const maskedAcc = '••••' + bankDetails.accountNumber.slice(-4);
    description = `Payout to Bank (${bankDetails.ifsc}, ${maskedAcc})`;
  }

  // Execute in transaction
  const result = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        walletBalance: {
          decrement: amount,
        },
      },
      select: {
        walletBalance: true,
      },
    });

    const transaction = await tx.walletTransaction.create({
      data: {
        userId,
        amount,
        type: 'DEBIT',
        category: 'WITHDRAWAL',
        description,
        paymentMethod: withdrawalMethod,
        referenceId,
        status: 'COMPLETED',
      },
    });

    return { balance: updatedUser.walletBalance, transaction };
  });

  res.status(200).json({
    message: `Successfully processed withdrawal of ₹${amount.toFixed(2)}!`,
    balance: result.balance,
    transaction: result.transaction,
  });
});
