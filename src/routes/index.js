import { Router } from 'express';
import mongoose from 'mongoose';
import swaggerUi from 'swagger-ui-express';
import { swaggerDocument } from '../config/swagger.js';

import authRoutes from '../modules/auth/auth.route.js';
import userRoutes from '../modules/user/user.route.js';
import mealRoutes from '../modules/meal/meal.route.js';
import mealOccurrenceRoutes from '../modules/meal/mealOccurrence.route.js';
import foodRoutes from '../modules/food/food.route.js';
import foodTrackingRoutes from '../modules/food/foodTracking.route.js';
import doseRoutes from '../modules/dose/dose.route.js';
import doseOccurrenceRoutes from '../modules/dose/doseOccurrence.route.js';
import notificationRoutes from '../modules/notification/notification.route.js';
import analyticsRoutes from '../modules/analytics/analytics.route.js';
import exportRoutes from '../modules/export/export.route.js';
import { sendResponse } from '../utils/sendResponse.js';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  sendResponse(res, {
    statusCode: 200,
    message: 'MealMate API is healthy and operational',
    data: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: dbStatus,
      environment: process.env.NODE_ENV || 'development'
    }
  });
});

// Swagger API documentation
router.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
router.get('/docs.json', (req, res) => {
  res.json(swaggerDocument);
});

// Module routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/meals', mealRoutes);
router.use('/meal-occurrences', mealOccurrenceRoutes);
router.use('/foods', foodRoutes);
router.use('/food-tracking', foodTrackingRoutes);
router.use('/doses', doseRoutes);
router.use('/dose-occurrences', doseOccurrenceRoutes);
router.use('/notifications', notificationRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/export', exportRoutes);

export default router;
