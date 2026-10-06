import { Router } from 'express';
import * as trackingController from './foodTracking.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  getFoodTrackingMonthlySchema,
  dateParamSchema,
  updateTrackingCellSchema,
  deleteTrackingCellSchema
} from './food.validation.js';

const router = Router();

router.use(protect);

router.get('/analytics', trackingController.getFoodTrackingAnalytics);
router.get('/', validate(getFoodTrackingMonthlySchema), trackingController.getMonthlyTracking);
router.get('/:date', validate(dateParamSchema), trackingController.getDailyTracking);
router.put('/:date/:foodId', validate(updateTrackingCellSchema), trackingController.updateTrackingCell);
router.delete('/:date/:foodId', validate(deleteTrackingCellSchema), trackingController.clearTrackingCell);

export default router;
