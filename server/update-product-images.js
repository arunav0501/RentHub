const { PrismaClient } = require('@prisma/client');
const https = require('https');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const uploadDir = path.join(__dirname, 'uploads', 'products');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

function downloadImage(url, dest) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
      return resolve(dest);
    }
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadImage(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error(`Failed to download ${url}: status ${res.statusCode}`));
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(dest);
      });
    }).on('error', reject);
  });
}

const productImages = [
  {
    titleMatch: 'GoPro Hero 11',
    fileName: 'gopro-hero11.jpg',
    url: 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=1200&auto=format&fit=crop&q=85',
  },
  {
    titleMatch: 'DJI Osmo Action 4',
    fileName: 'dji-osmo-action4.jpg',
    url: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=1200&auto=format&fit=crop&q=85',
  },
  {
    titleMatch: 'Sony Alpha A7 IV',
    fileName: 'sony-a7iv.jpg',
    url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1200&auto=format&fit=crop&q=85',
  },
  {
    titleMatch: 'DJI Mini 4 Pro Drone',
    fileName: 'dji-mini4-pro.jpg',
    url: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=1200&auto=format&fit=crop&q=85',
  },
  {
    titleMatch: 'JBL Charge 5',
    fileName: 'jbl-charge5.jpg',
    url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=1200&auto=format&fit=crop&q=85',
  },
  {
    titleMatch: 'Anker 737 Power Bank',
    fileName: 'anker-737.jpg',
    url: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=1200&auto=format&fit=crop&q=85',
  },
  {
    titleMatch: 'Quechua MH100',
    fileName: 'quechua-mh100.jpg',
    url: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1200&auto=format&fit=crop&q=85',
  },
  {
    titleMatch: 'Coleman Sundome',
    fileName: 'coleman-sundome.jpg',
    url: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=1200&auto=format&fit=crop&q=85',
  },
  {
    titleMatch: 'Black Diamond Trail Trekking Poles',
    fileName: 'trekking-poles.jpg',
    url: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&auto=format&fit=crop&q=85',
  },
  {
    titleMatch: 'Petzl Actik Core',
    fileName: 'petzl-headlamp.jpg',
    url: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?w=1200&auto=format&fit=crop&q=85',
  },
  {
    titleMatch: 'Yamaha P-125',
    fileName: 'yamaha-p125.jpg',
    url: 'https://images.unsplash.com/photo-1520523839898-507124cd5371?w=1200&auto=format&fit=crop&q=85',
  },
  {
    titleMatch: 'Fender FA-125',
    fileName: 'fender-guitar.jpg',
    url: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=1200&auto=format&fit=crop&q=85',
  },
];

async function run() {
  console.log('--- Downloading authentic product images ---');
  for (const item of productImages) {
    const dest = path.join(uploadDir, item.fileName);
    try {
      await downloadImage(item.url, dest);
      console.log(`✓ Saved ${item.fileName} (${fs.statSync(dest).size} bytes)`);
    } catch (err) {
      console.error(`✗ Error downloading ${item.fileName}:`, err.message);
    }
  }

  console.log('\n--- Updating Database Product Images ---');
  for (const item of productImages) {
    const imgPath = `/uploads/products/${item.fileName}`;
    const matched = await prisma.product.findMany({
      where: {
        title: { contains: item.titleMatch },
      },
    });

    for (const prod of matched) {
      await prisma.product.update({
        where: { id: prod.id },
        data: { image: imgPath },
      });
      console.log(`Updated product: "${prod.title}" -> ${imgPath}`);
    }
  }

  // Also ensure users have initial wallet balance and seed a couple of verified reviews
  console.log('\n--- Updating user wallet balances and seeding reviews ---');
  const users = await prisma.user.findMany();
  for (const u of users) {
    if (!u.walletBalance || u.walletBalance === 0) {
      await prisma.user.update({
        where: { id: u.id },
        data: { walletBalance: 2500.0 },
      });
      console.log(`Updated wallet balance for user ${u.name}: ₹2500`);
    }
  }

  // Find a product to add verified sample reviews
  const gopro = await prisma.product.findFirst({
    where: { title: { contains: 'GoPro Hero 11' } },
  });
  const alice = await prisma.user.findFirst({
    where: { email: { contains: 'alice' } },
  });

  if (gopro && alice) {
    // Check if there is a completed booking
    let booking = await prisma.booking.findFirst({
      where: { productId: gopro.id, userId: alice.id },
    });

    if (!booking) {
      const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const end = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
      booking = await prisma.booking.create({
        data: {
          productId: gopro.id,
          userId: alice.id,
          startDate: start,
          endDate: end,
          totalPrice: 1350,
          status: 'COMPLETED',
          paymentMethod: 'WALLET',
          paymentStatus: 'PAID',
          paymentRef: 'TXN-RH-DEMO-001',
        },
      });
      console.log('Created completed demo booking for Alice on GoPro Hero 11');
    } else if (booking.status !== 'COMPLETED') {
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: 'COMPLETED',
          paymentMethod: 'WALLET',
          paymentStatus: 'PAID',
        },
      });
    }

    // Check if review already exists
    const existingReview = await prisma.review.findFirst({
      where: { productId: gopro.id, userId: alice.id },
    });

    if (!existingReview) {
      await prisma.review.create({
        data: {
          productId: gopro.id,
          userId: alice.id,
          bookingId: booking.id,
          rating: 5,
          comment: 'Incredible action camera! Took it scuba diving in Goa. The HyperSmooth 5.0 stabilization was rock solid and the battery lasted the entire afternoon. Pickup and return was effortless.',
        },
      });
      console.log('Created 5-star verified review for GoPro Hero 11');
    }

    // Also add an initial topup wallet transaction for Alice
    const existingTx = await prisma.walletTransaction.findFirst({
      where: { userId: alice.id },
    });
    if (!existingTx) {
      await prisma.walletTransaction.create({
        data: {
          userId: alice.id,
          amount: 3000,
          type: 'CREDIT',
          category: 'TOPUP',
          description: 'Initial Wallet Top-up via UPI',
          paymentMethod: 'UPI',
          referenceId: 'TXN-RH-TOPUP-101',
          status: 'COMPLETED',
        },
      });
      await prisma.walletTransaction.create({
        data: {
          userId: alice.id,
          amount: 1350,
          type: 'DEBIT',
          category: 'RENTAL_PAYMENT',
          description: 'Rental Payment for GoPro Hero 11 Black',
          paymentMethod: 'WALLET',
          referenceId: 'TXN-RH-PAY-102',
          status: 'COMPLETED',
        },
      });
      console.log('Created demo wallet transactions for Alice');
    }
  }

  console.log('\n--- Setup Complete! ---');
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
