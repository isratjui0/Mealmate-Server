import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { ResponseMessages } from '../../constants/messages.js';
import * as mealService from './meal.service.js';

export const getOccurrences = catchAsync(async (req, res) => {
  const occurrences = await mealService.getOccurrences(req.userId, req.query);
  sendResponse(res, {
    statusCode: 200,
    message: ResponseMessages.OCCURRENCES_FETCHED,
    data: { occurrences }
  });
});

export const getOccurrenceById = catchAsync(async (req, res) => {
  const occurrence = await mealService.getOccurrenceById(req.userId, req.params.id);
  sendResponse(res, {
    statusCode: 200,
    message: ResponseMessages.OCCURRENCE_FETCHED,
    data: { occurrence }
  });
});

export const completeOccurrence = catchAsync(async (req, res) => {
  const occurrence = await mealService.completeOccurrence(
    req.userId,
    req.params.id,
    req.body?.notes
  );
  sendResponse(res, {
    statusCode: 200,
    message: ResponseMessages.OCCURRENCE_COMPLETED,
    data: { occurrence }
  });
});

export const skipOccurrence = catchAsync(async (req, res) => {
  const occurrence = await mealService.skipOccurrence(
    req.userId,
    req.params.id,
    req.body?.notes
  );
  sendResponse(res, {
    statusCode: 200,
    message: ResponseMessages.OCCURRENCE_SKIPPED,
    data: { occurrence }
  });
});

export const postponeOccurrence = catchAsync(async (req, res) => {
  const occurrence = await mealService.postponeOccurrence(
    req.userId,
    req.params.id,
    req.body
  );
  sendResponse(res, {
    statusCode: 200,
    message: ResponseMessages.OCCURRENCE_POSTPONED,
    data: { occurrence }
  });
});

export const snoozeOccurrence = catchAsync(async (req, res) => {
  const duration = req.body?.durationMinutes || 10;
  const occurrence = await mealService.snoozeOccurrence(
    req.userId,
    req.params.id,
    duration
  );
  sendResponse(res, {
    statusCode: 200,
    message: ResponseMessages.OCCURRENCE_SNOOZED,
    data: { occurrence }
  });
});
