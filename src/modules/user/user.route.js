import { Router } from 'express';
import * as userController from './user.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { updateProfileSchema, updatePreferencesSchema } from './user.validation.js';

const router = Router();

// All user routes require authentication
router.use(protect);

router.get('/profile', userController.getProfile);
router.patch('/profile', validate(updateProfileSchema), userController.updateProfile);
router.patch('/preferences', validate(updatePreferencesSchema), userController.updatePreferences);
router.delete('/account', userController.deleteAccount);

export default router;
