import { Router } from 'express';
import * as occurrenceController from './doseOccurrence.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  getDoseOccurrencesQuerySchema,
  doseOccurrenceActionSchema,
  postponeDoseSchema
} from './dose.validation.js';

const router = Router();

router.use(protect);

router.get('/history', occurrenceController.getHistory);
router.get('/', validate(getDoseOccurrencesQuerySchema), occurrenceController.getOccurrences);
router.get('/:id', occurrenceController.getOccurrenceById);
router.patch('/:id/taken', validate(doseOccurrenceActionSchema), occurrenceController.markTaken);
router.patch('/:id/skip', validate(doseOccurrenceActionSchema), occurrenceController.markSkipped);
router.patch('/:id/postpone', validate(postponeDoseSchema), occurrenceController.postponeDose);

export default router;
