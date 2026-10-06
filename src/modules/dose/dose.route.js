import { Router } from 'express';
import * as doseController from './dose.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  createDoseSchema,
  updateDoseSchema,
  doseIdParamSchema
} from './dose.validation.js';

const router = Router();

router.use(protect);

router.post('/', validate(createDoseSchema), doseController.createDose);
router.get('/', doseController.getDoses);
router.get('/:id', validate(doseIdParamSchema), doseController.getDoseById);
router.patch('/:id', validate(updateDoseSchema), doseController.updateDose);
router.delete('/:id', validate(doseIdParamSchema), doseController.deleteDose);
router.patch('/:id/pause', validate(doseIdParamSchema), doseController.togglePause);

export default router;
