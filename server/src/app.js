const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { notFound, errorHandler } = require('./middlewares/error.middleware');

const authRoutes = require('./routes/auth.routes');
const categoryRoutes = require('./routes/category.routes');
const productRoutes = require('./routes/product.routes');
const bookingRoutes = require('./routes/booking.routes');
const userRoutes = require('./routes/user.routes');
const aiListingRoutes = require('./routes/aiListing.routes');
const tripPlannerRoutes = require('./routes/tripPlanner.routes');
const reviewRoutes = require('./routes/review.routes');
const walletRoutes = require('./routes/wallet.routes');

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet({ crossOriginResourcePolicy: false })); // Allow loading images from same origin
app.use(morgan('dev'));

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check & status
app.get('/', (req, res) => {
  res.json({ message: 'RentHub API is active and running', timestamp: new Date().toISOString() });
});
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ai-listing', aiListingRoutes);
app.use('/api/trip-planner', tripPlannerRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/wallet', walletRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
