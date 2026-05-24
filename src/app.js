import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import 'dotenv/config';

import { errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { env } from './config/env.js';

// Route Imports
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import productRoutes from './routes/product.routes.js';
import categoryRoutes from './routes/category.routes.js';
import orderRoutes from './routes/order.routes.js';
import cartRoutes from './routes/cart.routes.js';
import wishlistRoutes from './routes/wishlist.routes.js';
import consultationRoutes from './routes/consultation.routes.js';
import expertRoutes from './routes/expert.routes.js';
import branchRoutes from './routes/branch.routes.js';
import courseRoutes from './routes/course.routes.js';
import lectureRoutes from './routes/lecture.routes.js';
import enrollmentRoutes from './routes/enrollment.routes.js';
import assignmentRoutes from './routes/assignment.routes.js';
import examRoutes from './routes/exam.routes.js';
import certificateRoutes from './routes/certificate.routes.js';
import franchiseRoutes from './routes/franchise.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';
import staffRoutes from './routes/staff.routes.js';
import shippingRoutes from './routes/shipping.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import reviewRoutes from './routes/review.routes.js';
import couponRoutes from './routes/coupon.routes.js';
import loyaltyRoutes from './routes/loyalty.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';

const app = express();

// Trust the first proxy (required for Render, Railway, Heroku, etc.)
// This allows express-rate-limit to correctly read the client IP from X-Forwarded-For
app.set('trust proxy', 1);

// Security & Utility Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false
}));
app.use(cors({
  origin: (origin, callback) => {
    // Allow all origins
    callback(null, true);
  },
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Global Rate Limiter
app.use(apiLimiter);

// Health Check Route (for Render)
app.get('/', (req, res) => {
  res.status(200).json({ success: true, message: 'Noore Imperial Server is running' });
});

// API Routes
const apiRouter = express.Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/products', productRoutes);
apiRouter.use('/categories', categoryRoutes);
apiRouter.use('/orders', orderRoutes);
apiRouter.use('/cart', cartRoutes);
apiRouter.use('/wishlist', wishlistRoutes);
apiRouter.use('/consultations', consultationRoutes);
apiRouter.use('/experts', expertRoutes);
apiRouter.use('/branches', branchRoutes);
apiRouter.use('/courses', courseRoutes);
apiRouter.use('/lectures', lectureRoutes);
apiRouter.use('/enrollments', enrollmentRoutes);
apiRouter.use('/assignments', assignmentRoutes);
apiRouter.use('/exams', examRoutes);
apiRouter.use('/certificates', certificateRoutes);
apiRouter.use('/franchise', franchiseRoutes);
apiRouter.use('/inventory', inventoryRoutes);
apiRouter.use('/staff', staffRoutes);
apiRouter.use('/shipping', shippingRoutes);
apiRouter.use('/payment', paymentRoutes);
apiRouter.use('/reviews', reviewRoutes);
apiRouter.use('/coupons', couponRoutes);
apiRouter.use('/loyalty', loyaltyRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/analytics', analyticsRoutes);

app.use('/api', apiRouter);

// Robots.txt
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send('User-agent: *\nAllow: /api/products\nAllow: /api/courses\nDisallow: /api/auth\nDisallow: /api/users\nDisallow: /api/orders');
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global Error Handler
app.use(errorHandler);

export default app;
