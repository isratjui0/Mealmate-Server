import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { ResponseMessages } from '../../constants/messages.js';
import * as foodService from './food.service.js';

export const getMonthlyTracking = catchAsync(async (req, res) => {
  const result = await foodService.getMonthlyFoodTracking(req.userId, req.query.month);
  sendResponse(res, {
    statusCode: 200,
    message: ResponseMessages.TRACKING_FETCHED,
    data: result
  });
});

export const getDailyTracking = catchAsync(async (req, res) => {
  const result = await foodService.getDailyFoodTracking(req.userId, req.params.date);
  sendResponse(res, {
    statusCode: 200,
    message: ResponseMessages.TRACKING_FETCHED,
    data: result
  });
});

export const updateTrackingCell = catchAsync(async (req, res) => {
  const { date, foodId } = req.params;
  const { status, notes } = req.body;

  const result = await foodService.upsertTrackingCell(req.userId, foodId, date, status, notes);

  sendResponse(res, {
    statusCode: 200,
    message: ResponseMessages.TRACKING_UPDATED,
    data: result
  });
});

export const clearTrackingCell = catchAsync(async (req, res) => {
  const { date, foodId } = req.params;

  const result = await foodService.clearTrackingCell(req.userId, foodId, date);

  sendResponse(res, {
    statusCode: 200,
    message: ResponseMessages.TRACKING_CLEARED,
    data: result
  });
});

export const getFoodTrackingAnalytics = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;
  const result = await foodService.getFoodAnalytics(req.userId, startDate, endDate);

  sendResponse(res, {
    statusCode: 200,
    message: ResponseMessages.FOOD_ANALYTICS_FETCHED,
    data: result
  });
});
