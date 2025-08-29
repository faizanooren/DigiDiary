const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const journalRoutes = require('./routes/journal');
const bucketListRoutes = require('./routes/bucketList');
const todoListRoutes = require('./routes/todoList');
const insightsRoutes = require('./routes/insights');
const streakRoutes = require('./routes/streak');
const quotesRoutes = require('./routes/quotes');
const globalSearchRoutes = require('./routes/globalSearch');

const app = express();

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [process.env.CLIENT_URL, 'http://localhost:3000'].filter(Boolean);
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable pre-flight for all routes

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));

// Rate limiting - apply after CORS and OPTIONS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Increased limit
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => req.method === 'OPTIONS', // Don't rate limit pre-flight requests
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/bucket-list', bucketListRoutes);
app.use('/api/todo-list', todoListRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/streak', streakRoutes);
app.use('/api/quotes', quotesRoutes);
app.use('/api/search', globalSearchRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'DigiDiary API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/digidiary')
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log('❌ Unhandled Promise Rejection:', err.message);
  // Close server & exit process
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('❌ Uncaught Exception:', err.message);
  console.log('Shutting down the server due to uncaught exception');
  process.exit(1);
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 DigiDiary server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
}); 