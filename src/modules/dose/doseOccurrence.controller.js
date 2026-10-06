import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { ResponseMessages } from '../../constants/messages.js';
import * as doseService from './dose.service.js';

export const getOccurrences = catchAsync(async (req, res) => {
  const occurrences = await doseService.getDoseOccurrences(req.userId, req.query);
  sendResponse(res, {
    statusCode: 200,
    message: ResponseMessages.DOSE_OCCURRENCES_FETCHED,
    data: { occurrences }
  });
});

export const getOccurrenceById = catchAsync(async (req, res) => {
  const occurrence = await doseService.getDoseOccurrenceById(req.userId, req.params.id);
  sendResponse(res, {
    statusCode: 200,
    message: ResponseMessages.DOSE_OCCURRENCE_FETCHED,
    data: { occurrence }
  });
});

export const markTaken = catchAsync(async (req, res) => {
  const occurrence = await doseService.markDoseTaken(
    req.userId,
    req.params.id,
    req.body?.notes
  );
  sendResponse(res, {
    statusCode: 200,
    message: ResponseMessages.DOSE_TAKEN,
    data: { occurrence }
  });
});

export const markSkipped = catchAsync(async (req, res) => {
  const occurrence = await doseService.markDoseSkipped(
    req.userId,
    req.params.id,
    req.body?.notes
  );
  sendResponse(res, {
    statusCode: 200,
    message: ResponseMessages.DOSE_SKIPPED,
    data: { occurrence }
  });
});

export const postponeDose = catchAsync(async (req, res) => {
  const occurrence = await doseService.postponeDose(
    req.userId,
    req.params.id,
    req.body
  );
  sendResponse(res, {
    statusCode: 200,
    message: ResponseMessages.DOSE_POSTPONED,
    data: { occurrence }
  });
});

export const getHistory = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;
  const history = await doseService.getDoseHistory(req.userId, startDate, endDate);
  sendResponse(res, {
    statusCode: 200,
    message: ResponseMessages.DOSE_HISTORY_FETCHED,
    data: { history }
  });
});
