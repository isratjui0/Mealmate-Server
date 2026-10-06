import { Router } from 'express';
import * as analyticsController from './analytics.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(protect);

router.get('/dashboard', analyticsController.getDashboard);
router.get('/meals', analyticsController.getMeals);
router.get('/foods', analyticsController.getFoods);
router.get('/doses', analyticsController.getDoses);
router.get('/calendar', analyticsController.getCalendar);

export default router;
