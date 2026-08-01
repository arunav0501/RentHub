const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing old data...');
  await prisma.booking.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding database...');

  // 1. Create Categories
  const categories = ['Electronics', 'Vehicles', 'Tools', 'Furniture', 'Photography', 'Sports', 'Party & Events', 'Audio & Visual'];
  const createdCategories = [];
  
  for (const name of categories) {
    const category = await prisma.category.create({
      data: { name },
    });
    createdCategories.push(category);
  }
  console.log(`Created ${createdCategories.length} categories.`);

  // 2. Create Users (Owner and Renters)
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const owner1 = await prisma.user.create({
    data: {
      name: 'Tech Rentals Co.',
      email: 'tech@renthub.com',
      password: hashedPassword,
      phone: '555-0101',
      role: 'OWNER',
    },
  });

  const owner2 = await prisma.user.create({
    data: {
      name: 'Outdoor Adventures',
      email: 'outdoor@renthub.com',
      password: hashedPassword,
      phone: '555-0202',
      role: 'OWNER',
    },
  });

  const renter = await prisma.user.create({
    data: {
      name: 'Alice Renter',
      email: 'alice@renthub.com',
      password: hashedPassword,
      phone: '555-0303',
      role: 'USER',
    },
  });

  console.log(`Created users.`);

  const getCatId = (name) => createdCategories.find(c => c.name === name).id;

  // 3. Create sample products
  const products = [
    {
      title: 'Sony Alpha a7 III Mirrorless Camera',
      description: 'Excellent condition mirrorless camera, great for weddings and professional photography. Comes with a 28-70mm lens and 2 batteries.',
      categoryId: getCatId('Photography'),
      dailyRent: 45.00,
      location: 'New York, NY',
      quantity: 2,
      condition: 'Like New',
      brand: 'Sony',
      model: 'a7 III',
      ownerId: owner1.id,
    },
    {
      title: 'Dewalt 20V MAX Cordless Drill',
      description: 'Powerful cordless drill with 2 batteries and a charger. Perfect for home improvement projects and DIY.',
      categoryId: getCatId('Tools'),
      dailyRent: 15.00,
      location: 'Los Angeles, CA',
      quantity: 5,
      condition: 'Good',
      brand: 'Dewalt',
      model: 'DCD771C2',
      ownerId: owner2.id,
    },
    {
      title: 'MacBook Pro 16" M2 Max',
      description: 'High performance laptop for video editing and programming. 32GB RAM, 1TB SSD. Comes with charger and protective case.',
      categoryId: getCatId('Electronics'),
      dailyRent: 80.00,
      location: 'San Francisco, CA',
      quantity: 1,
      condition: 'Like New',
      brand: 'Apple',
      model: 'MacBook Pro 16',
      ownerId: owner1.id,
    },
    {
      title: 'Tesla Model 3 Standard Range',
      description: 'Clean, fully charged Tesla Model 3. Autopilot included. Perfect for weekend getaways.',
      categoryId: getCatId('Vehicles'),
      dailyRent: 120.00,
      location: 'Austin, TX',
      quantity: 1,
      condition: 'Like New',
      brand: 'Tesla',
      model: 'Model 3',
      ownerId: owner2.id,
    },
    {
      title: 'DJI Mavic 3 Pro Drone',
      description: 'Professional drone with Hasselblad camera. Includes 3 batteries, ND filters, and carrying case.',
      categoryId: getCatId('Photography'),
      dailyRent: 95.00,
      location: 'Miami, FL',
      quantity: 1,
      condition: 'Excellent',
      brand: 'DJI',
      model: 'Mavic 3 Pro',
      ownerId: owner1.id,
    },
    {
      title: 'Bose S1 Pro Portable Bluetooth Speaker',
      description: 'Great for small to medium parties. Battery lasts up to 11 hours. Crisp and loud sound.',
      categoryId: getCatId('Audio & Visual'),
      dailyRent: 35.00,
      location: 'Chicago, IL',
      quantity: 3,
      condition: 'Good',
      brand: 'Bose',
      model: 'S1 Pro',
      ownerId: owner1.id,
    },
    {
      title: 'Trek Marlin 7 Mountain Bike',
      description: 'Size Large. Front suspension, hydraulic disc brakes. Includes helmet and lock.',
      categoryId: getCatId('Sports'),
      dailyRent: 25.00,
      location: 'Denver, CO',
      quantity: 2,
      condition: 'Good',
      brand: 'Trek',
      model: 'Marlin 7',
      ownerId: owner2.id,
    },
    {
      title: 'JBL PartyBox 310',
      description: 'Massive sound and dazzling lights. Perfect for outdoor events and parties.',
      categoryId: getCatId('Party & Events'),
      dailyRent: 50.00,
      location: 'Las Vegas, NV',
      quantity: 2,
      condition: 'Like New',
      brand: 'JBL',
      model: 'PartyBox 310',
      ownerId: owner1.id,
    },
    {
      title: 'Nintendo Switch OLED with 5 Games',
      description: 'Includes Mario Kart 8, Zelda BOTW, Smash Bros. Comes with 4 joy-cons and a dock.',
      categoryId: getCatId('Electronics'),
      dailyRent: 20.00,
      location: 'Seattle, WA',
      quantity: 1,
      condition: 'Excellent',
      brand: 'Nintendo',
      model: 'Switch OLED',
      ownerId: owner1.id,
    },
    {
      title: 'Honda EM5000S Portable Generator',
      description: '5000 watt generator, electric start. Great for backup power or camping.',
      categoryId: getCatId('Tools'),
      dailyRent: 65.00,
      location: 'Houston, TX',
      quantity: 1,
      condition: 'Fair',
      brand: 'Honda',
      model: 'EM5000S',
      ownerId: owner2.id,
    }
  ];

  for (const p of products) {
    await prisma.product.create({
      data: p
    });
  }
  console.log(`Created ${products.length} sample products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
