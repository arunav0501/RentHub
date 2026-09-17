const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const owner = await prisma.user.findFirst({
    where: { role: 'OWNER' },
  });

  if (!owner) {
    console.error('No owner found');
    return;
  }

  // Find categories
  const categories = await prisma.category.findMany();
  const getCatId = (name) => {
    const c = categories.find((cat) => cat.name.toLowerCase().includes(name.toLowerCase()));
    return c ? c.id : categories[0].id;
  };

  const sampleProducts = [
    {
      title: 'GoPro Hero 11 Black 5.3K Action Camera',
      description: 'Rugged waterproof 5.3K action camera with HyperSmooth 5.0 stabilization, extra Enduro battery, and floating hand grip. Perfect for beach and water adventures.',
      dailyRent: 450,
      location: 'Goa',
      quantity: 2,
      condition: 'Excellent',
      brand: 'GoPro',
      model: 'Hero 11 Black',
      image: '/uploads/products/gopro-hero11.jpg',
      categoryId: getCatId('Photography'),
      ownerId: owner.id,
    },
    {
      title: 'DJI Osmo Action 4 Adventure Combo',
      description: '4K/120fps wide-angle action camera with 1/1.3-inch sensor, 3 batteries, and magnetic quick-release mount. Ideal for scuba diving and beach vlogging.',
      dailyRent: 500,
      location: 'Goa',
      quantity: 1,
      condition: 'Like New',
      brand: 'DJI',
      model: 'Osmo Action 4',
      image: '/uploads/products/dji-osmo-action4.jpg',
      categoryId: getCatId('Photography'),
      ownerId: owner.id,
    },
    {
      title: 'JBL Charge 5 Portable Waterproof Bluetooth Speaker',
      description: 'IP67 waterproof and dustproof portable party speaker with punchy bass, 20 hours of playtime, and built-in power bank to charge phones.',
      dailyRent: 220,
      location: 'Goa',
      quantity: 2,
      condition: 'Good',
      brand: 'JBL',
      model: 'Charge 5',
      image: '/uploads/products/jbl-charge5.jpg',
      categoryId: getCatId('Audio'),
      ownerId: owner.id,
    },
    {
      title: 'Anker 737 Power Bank (PowerCore 24K, 140W)',
      description: 'Ultra-powerful 24,000mAh portable charger with smart digital display and 140W fast charging. Powers phones, cameras, and laptops all day.',
      dailyRent: 150,
      location: 'Goa',
      quantity: 3,
      condition: 'Like New',
      brand: 'Anker',
      model: '737 PowerCore 24K',
      image: '/uploads/products/anker-737.jpg',
      categoryId: getCatId('Electronics'),
      ownerId: owner.id,
    },
    {
      title: 'Quechua MH100 4-Person Waterproof Camping Tent',
      description: 'Spacious 4-person dome tent with waterproof flysheet, mosquito mesh windows, and wind resistance up to 50 km/h. Easy 10-minute setup.',
      dailyRent: 350,
      location: 'Dehradun',
      quantity: 2,
      condition: 'Good',
      brand: 'Quechua',
      model: 'MH100 4P',
      image: '/uploads/products/quechua-mh100.jpg',
      categoryId: getCatId('Sports'),
      ownerId: owner.id,
    },
    {
      title: 'Coleman Sundome 2-Person Trekking Tent',
      description: 'Compact 2-person tent with WeatherTec system and snag-free pole sleeves. Lightweight and ideal for alpine treks.',
      dailyRent: 250,
      location: 'Kedarkantha',
      quantity: 1,
      condition: 'Good',
      brand: 'Coleman',
      model: 'Sundome 2P',
      image: '/uploads/products/coleman-sundome.jpg',
      categoryId: getCatId('Sports'),
      ownerId: owner.id,
    },
    {
      title: 'Black Diamond Trail Trekking Poles (Pair)',
      description: 'Dual FlickLock adjustable aluminum poles with ergonomic dual-density grip and 360-degree padded webbing strap.',
      dailyRent: 120,
      location: 'Dehradun',
      quantity: 4,
      condition: 'Excellent',
      brand: 'Black Diamond',
      model: 'Trail Trek',
      image: '/uploads/products/trekking-poles.jpg',
      categoryId: getCatId('Sports'),
      ownerId: owner.id,
    },
    {
      title: 'Petzl Actik Core Rechargeable Headlamp (450 Lumens)',
      description: 'Multi-beam compact headlamp with red lighting and hybrid rechargeable battery. Essential for night summit pushes and campsite illumination.',
      dailyRent: 90,
      location: 'Kedarkantha',
      quantity: 2,
      condition: 'Like New',
      brand: 'Petzl',
      model: 'Actik Core',
      image: '/uploads/products/petzl-headlamp.jpg',
      categoryId: getCatId('Sports'),
      ownerId: owner.id,
    },
    {
      title: 'Sony Alpha A7 IV Full-Frame Mirrorless Camera Kit',
      description: '33MP full-frame hybrid camera with 4K 60p 10-bit video, paired with 24-70mm f/2.8 GM lens. Perfect for wedding photography, portraits, and cinema.',
      dailyRent: 1250,
      location: 'Mumbai',
      quantity: 1,
      condition: 'Like New',
      brand: 'Sony',
      model: 'Alpha 7 IV',
      image: '/uploads/products/sony-a7iv.jpg',
      categoryId: getCatId('Photography'),
      ownerId: owner.id,
    },
    {
      title: 'DJI Mini 4 Pro Drone Fly More Combo',
      description: 'Sub-249g lightweight camera drone with 4K/60fps HDR true vertical shooting, omnidirectional obstacle sensing, and 3 intelligent flight batteries.',
      dailyRent: 1400,
      location: 'Goa',
      quantity: 1,
      condition: 'Like New',
      brand: 'DJI',
      model: 'Mini 4 Pro',
      image: '/uploads/products/dji-mini4-pro.jpg',
      categoryId: getCatId('Electronics'),
      ownerId: owner.id,
    },
    {
      title: 'Yamaha P-125 88-Key Weighted Digital Piano',
      description: 'Compact 88-key weighted digital stage piano with authentic acoustic grand sound engine, sustain pedal, stand, and headphone jack. Perfect for practice and stage.',
      dailyRent: 600,
      location: 'Bangalore',
      quantity: 2,
      condition: 'Like New',
      brand: 'Yamaha',
      model: 'P-125',
      image: '/uploads/products/yamaha-p125.jpg',
      categoryId: getCatId('Audio'),
      ownerId: owner.id,
    },
    {
      title: 'Fender FA-125 Dreadnought Acoustic Guitar',
      description: 'Rich-toned full-size dreadnought acoustic guitar with spruce top, die-cast tuning machines, padded gig bag, picks, and guitar strap.',
      dailyRent: 200,
      location: 'Bangalore',
      quantity: 3,
      condition: 'Excellent',
      brand: 'Fender',
      model: 'FA-125',
      image: '/uploads/products/fender-guitar.jpg',
      categoryId: getCatId('Audio'),
      ownerId: owner.id,
    },
  ];

  for (const item of sampleProducts) {
    const existing = await prisma.product.findFirst({
      where: { title: item.title },
    });
    if (!existing) {
      await prisma.product.create({ data: item });
      console.log('Created product:', item.title, `(in ${item.location})`);
    } else {
      console.log('Already exists:', item.title);
    }
  }

  console.log('Seed completed successfully!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
