import { Router } from 'express';
import * as mealController from './meal.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  createMealSchema,
  updateMealSchema,
  mealIdParamSchema
} from './meal.validation.js';

const router = Router();

router.use(protect);

router.post('/', validate(createMealSchema), mealController.createMeal);
router.get('/', mealController.getMeals);
router.get('/:id', validate(mealIdParamSchema), mealController.getMealById);
router.patch('/:id', validate(updateMealSchema), mealController.updateMeal);
router.delete('/:id', validate(mealIdParamSchema), mealController.deleteMeal);
router.patch('/:id/pause', validate(mealIdParamSchema), mealController.togglePause);

export default router;
