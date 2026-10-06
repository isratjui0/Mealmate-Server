import { Router } from 'express';
import * as occurrenceController from './mealOccurrence.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  getOccurrencesQuerySchema,
  occurrenceActionSchema,
  postponeOccurrenceSchema,
  snoozeOccurrenceSchema
} from './meal.validation.js';

const router = Router();

router.use(protect);

router.get('/', validate(getOccurrencesQuerySchema), occurrenceController.getOccurrences);
router.get('/:id', occurrenceController.getOccurrenceById);
router.patch('/:id/complete', validate(occurrenceActionSchema), occurrenceController.completeOccurrence);
router.patch('/:id/skip', validate(occurrenceActionSchema), occurrenceController.skipOccurrence);
router.patch('/:id/postpone', validate(postponeOccurrenceSchema), occurrenceController.postponeOccurrence);
router.patch('/:id/snooze', validate(snoozeOccurrenceSchema), occurrenceController.snoozeOccurrence);

export default router;
