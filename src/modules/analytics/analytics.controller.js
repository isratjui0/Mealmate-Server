import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { ResponseMessages } from '../../constants/messages.js';
import * as analyticsService from './analytics.service.js';

export const getDashboard = catchAsync(async (req, res) => {
  const result = await analyticsService.getDashboardAnalytics(req.userId);
  sendResponse(res, {
    statusCode: 200,
    message: ResponseMessages.DASHBOARD_ANALYTICS_FETCHED,
    data: result
  });
});

export const getMeals = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;
  const result = await analyticsService.getMealAnalytics(req.userId, startDate, endDate);
  sendResponse(res, {
    statusCode: 200,
    message: ResponseMessages.MEAL_ANALYTICS_FETCHED,
    data: result
  });
});

export const getFoods = catchAsync(async (req, res) => {
  // Can delegate to food tracking analytics
  const { startDate, endDate } = req.query;
  const { getFoodAnalytics } = await import('../food/food.service.js');
  const result = await getFoodAnalytics(req.userId, startDate, endDate);
  sendResponse(res, {
    statusCode: 200,
    message: ResponseMessages.FOOD_ANALYTICS_FETCHED,
    data: result
  });
});

export const getDoses = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;
  const result = await analyticsService.getDoseAnalytics(req.userId, startDate, endDate);
  sendResponse(res, {
    statusCode: 200,
    message: ResponseMessages.DOSE_ANALYTICS_FETCHED,
    data: result
  });
});

export const getCalendar = catchAsync(async (req, res) => {
  const result = await analyticsService.getCalendarRoutineAnalytics(req.userId, req.query.month);
  sendResponse(res, {
    statusCode: 200,
    message: ResponseMessages.CALENDAR_ANALYTICS_FETCHED,
    data: result
  });
});
