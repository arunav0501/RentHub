require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const prisma = require('./src/utils/prisma');
const jwt = require('jsonwebtoken');

async function runTests() {
  console.log('=== Running Automated Tests for New RentHub Features ===\n');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`Test server running at ${baseUrl}`);

  try {
    // 1. Check database products and images
    console.log('\n[TEST 1] Verifying all products have authentic, non-null image paths');
    const products = await prisma.product.findMany();
    if (products.length === 0) throw new Error('No products in database');

    const gopro = products.find((p) => p.title.includes('GoPro'));
    if (!gopro) throw new Error('GoPro product not found in database');
    if (!gopro.image || !gopro.image.includes('gopro')) {
      throw new Error(`GoPro has incorrect image: ${gopro.image}`);
    }
    console.log(`PASS: GoPro Hero 11 image verified -> ${gopro.image}`);

    for (const p of products) {
      if (!p.image) {
        throw new Error(`Product ${p.title} has null image!`);
      }
    }
    console.log(`PASS: All ${products.length} products have verified image paths.`);

    // 2. Fetch or create test user (renter) and owner
    let renter = await prisma.user.findFirst({ where: { role: 'USER' } });
    if (!renter) {
      renter = await prisma.user.create({
        data: {
          name: 'Alice Renter',
          email: 'alice@renthub.com',
          password: 'hashedpassword123',
          role: 'USER',
          walletBalance: 2500,
        },
      });
    }
    const owner = await prisma.user.findFirst({ where: { role: 'OWNER' } });
    if (!owner) throw new Error('Owner user not found');

    const renterToken = jwt.sign({ id: renter.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // 3. Test GET /api/wallet
    console.log('\n[TEST 2] GET /api/wallet');
    const walletRes = await fetch(`${baseUrl}/api/wallet`, {
      headers: { Authorization: `Bearer ${renterToken}` },
    });
    if (walletRes.status !== 200) throw new Error(`Expected 200, got ${walletRes.status}`);
    const walletData = await walletRes.json();
    console.log(`PASS: Wallet retrieved. Current balance: ₹${walletData.balance}`);

    // 4. Test POST /api/wallet/add-funds
    console.log('\n[TEST 3] POST /api/wallet/add-funds (Top up ₹1000)');
    const initialBalance = walletData.balance;
    const addRes = await fetch(`${baseUrl}/api/wallet/add-funds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${renterToken}`,
      },
      body: JSON.stringify({
        amount: 1000,
        paymentMethod: 'UPI',
        upiId: 'alice@okhdfcbank',
      }),
    });
    if (addRes.status !== 201) throw new Error(`Add funds failed with ${addRes.status}`);
    const addData = await addRes.json();
    if (addData.balance !== initialBalance + 1000) {
      throw new Error(`Balance mismatch: expected ${initialBalance + 1000}, got ${addData.balance}`);
    }
    console.log(`PASS: Wallet balance incremented correctly -> ₹${addData.balance}`);

    // 5. Test POST /api/wallet/withdraw
    console.log('\n[TEST 4] POST /api/wallet/withdraw (Withdraw ₹250)');
    const withdrawRes = await fetch(`${baseUrl}/api/wallet/withdraw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${renterToken}`,
      },
      body: JSON.stringify({
        amount: 250,
        withdrawalMethod: 'UPI',
        upiId: 'alice@okhdfcbank',
      }),
    });
    if (withdrawRes.status !== 200) throw new Error(`Withdraw failed with ${withdrawRes.status}`);
    const withdrawData = await withdrawRes.json();
    if (withdrawData.balance !== addData.balance - 250) {
      throw new Error(`Withdrawal balance mismatch: ${withdrawData.balance}`);
    }
    console.log(`PASS: Withdrawal deducted correctly -> ₹${withdrawData.balance}`);

    // 6. Test Withdrawal Overdraft Prevention
    console.log('\n[TEST 5] Overdraft protection (Attempt to withdraw ₹999,999)');
    const overdraftRes = await fetch(`${baseUrl}/api/wallet/withdraw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${renterToken}`,
      },
      body: JSON.stringify({
        amount: 999999,
        withdrawalMethod: 'UPI',
        upiId: 'alice@okhdfcbank',
      }),
    });
    if (overdraftRes.status !== 400) throw new Error(`Expected 400 for overdraft, got ${overdraftRes.status}`);
    console.log('PASS: Overdraft rejected with 400 Bad Request');

    // 7. Test Booking with RentHub Wallet payment
    console.log('\n[TEST 6] POST /api/bookings with paymentMethod: WALLET');
    const testProduct = products.find((p) => p.ownerId !== renter.id) || products[0];
    const preWalletBalance = withdrawData.balance;

    const bookingRes = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${renterToken}`,
      },
      body: JSON.stringify({
        productId: testProduct.id,
        startDate: new Date(Date.now() + 86400000).toISOString(),
        endDate: new Date(Date.now() + 86400000 * 3).toISOString(),
        paymentMethod: 'WALLET',
      }),
    });
    if (bookingRes.status !== 201) {
      const err = await bookingRes.json();
      throw new Error(`Wallet booking failed: ${JSON.stringify(err)}`);
    }
    const newBooking = await bookingRes.json();
    if (newBooking.paymentStatus !== 'PAID') {
      throw new Error(`Expected paymentStatus PAID, got ${newBooking.paymentStatus}`);
    }
    if (!newBooking.paymentRef) {
      throw new Error('Expected paymentRef to be generated');
    }
    console.log(`PASS: Booking created with Wallet payment. ID: ${newBooking.id}, Ref: ${newBooking.paymentRef}, Status: ${newBooking.status}`);

    // 8. Test Booking with UPI payment
    console.log('\n[TEST 7] POST /api/bookings with paymentMethod: UPI');
    const upiBookingRes = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${renterToken}`,
      },
      body: JSON.stringify({
        productId: testProduct.id,
        startDate: new Date(Date.now() + 86400000 * 5).toISOString(),
        endDate: new Date(Date.now() + 86400000 * 7).toISOString(),
        paymentMethod: 'UPI',
        paymentDetails: { upiId: 'alice@okhdfcbank' },
      }),
    });
    if (upiBookingRes.status !== 201) throw new Error('UPI booking failed');
    const upiBooking = await upiBookingRes.json();
    console.log(`PASS: Booking created with UPI payment. Ref: ${upiBooking.paymentRef}`);

    // 9. Test Booking with Cash on Delivery
    console.log('\n[TEST 8] POST /api/bookings with paymentMethod: CASH_ON_DELIVERY');
    const codBookingRes = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${renterToken}`,
      },
      body: JSON.stringify({
        productId: testProduct.id,
        startDate: new Date(Date.now() + 86400000 * 10).toISOString(),
        endDate: new Date(Date.now() + 86400000 * 12).toISOString(),
        paymentMethod: 'CASH_ON_DELIVERY',
      }),
    });
    if (codBookingRes.status !== 201) throw new Error('COD booking failed');
    const codBooking = await codBookingRes.json();
    if (codBooking.paymentStatus !== 'CASH_ON_DELIVERY') {
      throw new Error(`Expected CASH_ON_DELIVERY, got ${codBooking.paymentStatus}`);
    }
    console.log(`PASS: Booking created with Cash on Delivery. Status: ${codBooking.paymentStatus}`);

    // 10. Test Owner Completing Rental and Renter Reviewing
    console.log('\n[TEST 9] Owner marks booking COMPLETED and Renter reviews');
    await prisma.booking.update({
      where: { id: newBooking.id },
      data: { status: 'COMPLETED' },
    });

    const canReviewRes = await fetch(`${baseUrl}/api/reviews/can-review/${testProduct.id}`, {
      headers: { Authorization: `Bearer ${renterToken}` },
    });
    const canReviewData = await canReviewRes.json();
    console.log('Can review check:', canReviewData);

    const reviewRes = await fetch(`${baseUrl}/api/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${renterToken}`,
      },
      body: JSON.stringify({
        productId: testProduct.id,
        rating: 5,
        comment: 'Exceptional experience! High quality gear and smooth handover.',
        bookingId: newBooking.id,
      }),
    });
    if (reviewRes.status !== 201 && reviewRes.status !== 200) {
      const err = await reviewRes.json();
      throw new Error(`Review submission failed: ${JSON.stringify(err)}`);
    }
    const reviewData = await reviewRes.json();
    console.log(`PASS: Verified review submitted. Rating: ${reviewData.rating}★`);

    // 11. Test GET /api/reviews/product/:productId
    console.log('\n[TEST 10] GET /api/reviews/product/:productId');
    const productReviewsRes = await fetch(`${baseUrl}/api/reviews/product/${testProduct.id}`);
    const productReviews = await productReviewsRes.json();
    if (!productReviews.stats || productReviews.stats.totalReviews < 1) {
      throw new Error('Stats did not include the new review');
    }
    console.log(`PASS: Aggregate reviews retrieved. Average: ${productReviews.stats.averageRating}★, Total: ${productReviews.stats.totalReviews}`);

    console.log('\n========================================');
    console.log('🎉 ALL 10 AUTOMATED API TESTS PASSED! 🎉');
    console.log('========================================\n');
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

runTests().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
