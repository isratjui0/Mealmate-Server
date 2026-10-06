import { Router } from 'express';
import * as exportController from './export.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(protect);

router.get('/food-tracking', exportController.exportFoodTracking);
router.get('/meal-history', exportController.exportMealHistory);
router.get('/dose-history', exportController.exportDoseHistory);

export default router;
