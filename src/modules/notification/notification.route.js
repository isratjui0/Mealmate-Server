import { Router } from 'express';
import * as notificationController from './notification.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  subscribePushSchema,
  unsubscribePushSchema,
  notificationIdParamSchema,
  updateNotificationPreferencesSchema
} from './notification.validation.js';

const router = Router();

router.use(protect);

router.get('/', notificationController.getNotifications);
router.patch('/:id/read', validate(notificationIdParamSchema), notificationController.markAsRead);
router.post('/subscribe', validate(subscribePushSchema), notificationController.subscribePush);
router.delete('/subscribe', validate(unsubscribePushSchema), notificationController.unsubscribePush);
router.get('/preferences', notificationController.getPreferences);
router.patch('/preferences', validate(updateNotificationPreferencesSchema), notificationController.updatePreferences);

export default router;
