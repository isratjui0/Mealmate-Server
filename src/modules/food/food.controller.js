import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { ResponseMessages } from '../../constants/messages.js';
import * as foodService from './food.service.js';

export const createFood = catchAsync(async (req, res) => {
  const food = await foodService.createFood(req.userId, req.body);
  sendResponse(res, {
    statusCode: 201,
    message: ResponseMessages.FOOD_CREATED,
    data: { food }
  });
});

export const getFoods = catchAsync(async (req, res) => {
  const includeArchived = req.query.includeArchived === 'true';
  const foods = await foodService.getFoods(req.userId, includeArchived);
  sendResponse(res, {
    statusCode: 200,
    message: ResponseMessages.FOODS_FETCHED,
    data: { foods }
  });
});

export const getFoodById = catchAsync(async (req, res) => {
  const food = await foodService.getFoodById(req.userId, req.params.id);
  sendResponse(res, {
    statusCode: 200,
    message: ResponseMessages.FOOD_FETCHED,
    data: { food }
  });
});

export const updateFood = catchAsync(async (req, res) => {
  const food = await foodService.updateFood(req.userId, req.params.id, req.body);
  sendResponse(res, {
    statusCode: 200,
    message: ResponseMessages.FOOD_UPDATED,
    data: { food }
  });
});

export const deleteFood = catchAsync(async (req, res) => {
  const result = await foodService.deleteFood(req.userId, req.params.id);
  sendResponse(res, {
    statusCode: 200,
    message: result.message || ResponseMessages.FOOD_DELETED,
    data: result
  });
});

export const reorderFoods = catchAsync(async (req, res) => {
  const foods = await foodService.reorderFoods(req.userId, req.body);
  sendResponse(res, {
    statusCode: 200,
    message: ResponseMessages.FOODS_REORDERED,
    data: { foods }
  });
});
