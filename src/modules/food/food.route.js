import { Router } from 'express';
import * as foodController from './food.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  createFoodSchema,
  updateFoodSchema,
  foodIdParamSchema,
  reorderFoodsSchema
} from './food.validation.js';

const router = Router();

router.use(protect);

router.post('/', validate(createFoodSchema), foodController.createFood);
router.get('/', foodController.getFoods);
router.patch('/reorder', validate(reorderFoodsSchema), foodController.reorderFoods);
router.get('/:id', validate(foodIdParamSchema), foodController.getFoodById);
router.patch('/:id', validate(updateFoodSchema), foodController.updateFood);
router.delete('/:id', validate(foodIdParamSchema), foodController.deleteFood);

export default router;
