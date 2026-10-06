import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { ResponseMessages } from '../../constants/messages.js';
import * as mealService from './meal.service.js';

export const createMeal = catchAsync(async (req, res) => {
  const meal = await mealService.createMeal(req.userId, req.body);
  sendResponse(res, {
    statusCode: 201,
    message: ResponseMessages.MEAL_CREATED,
    data: { meal }
  });
});

export const getMeals = catchAsync(async (req, res) => {
  const meals = await mealService.getMeals(req.userId);
  sendResponse(res, {
    statusCode: 200,
    message: ResponseMessages.MEALS_FETCHED,
    data: { meals }
  });
});

export const getMealById = catchAsync(async (req, res) => {
  const meal = await mealService.getMealById(req.userId, req.params.id);
  sendResponse(res, {
    statusCode: 200,
    message: ResponseMessages.MEAL_FETCHED,
    data: { meal }
  });
});

export const updateMeal = catchAsync(async (req, res) => {
  const meal = await mealService.updateMeal(req.userId, req.params.id, req.body);
  sendResponse(res, {
    statusCode: 200,
    message: ResponseMessages.MEAL_UPDATED,
    data: { meal }
  });
});

export const deleteMeal = catchAsync(async (req, res) => {
  await mealService.deleteMeal(req.userId, req.params.id);
  sendResponse(res, {
    statusCode: 200,
    message: ResponseMessages.MEAL_DELETED,
    data: null
  });
});

export const togglePause = catchAsync(async (req, res) => {
  const meal = await mealService.toggleMealPause(req.userId, req.params.id);
  sendResponse(res, {
    statusCode: 200,
    message: ResponseMessages.MEAL_STATUS_TOGGLED,
    data: { meal }
  });
});
