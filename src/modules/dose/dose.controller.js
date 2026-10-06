import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { ResponseMessages } from '../../constants/messages.js';
import * as doseService from './dose.service.js';

export const createDose = catchAsync(async (req, res) => {
  const dose = await doseService.createDoseSchedule(req.userId, req.body);
  sendResponse(res, {
    statusCode: 201,
    message: ResponseMessages.DOSE_CREATED,
    data: { dose }
  });
});

export const getDoses = catchAsync(async (req, res) => {
  const doses = await doseService.getDoseSchedules(req.userId);
  sendResponse(res, {
    statusCode: 200,
    message: ResponseMessages.DOSES_FETCHED,
    data: { doses }
  });
});

export const getDoseById = catchAsync(async (req, res) => {
  const dose = await doseService.getDoseScheduleById(req.userId, req.params.id);
  sendResponse(res, {
    statusCode: 200,
    message: ResponseMessages.DOSE_FETCHED,
    data: { dose }
  });
});

export const updateDose = catchAsync(async (req, res) => {
  const dose = await doseService.updateDoseSchedule(req.userId, req.params.id, req.body);
  sendResponse(res, {
    statusCode: 200,
    message: ResponseMessages.DOSE_UPDATED,
    data: { dose }
  });
});

export const deleteDose = catchAsync(async (req, res) => {
  await doseService.deleteDoseSchedule(req.userId, req.params.id);
  sendResponse(res, {
    statusCode: 200,
    message: ResponseMessages.DOSE_DELETED,
    data: null
  });
});

export const togglePause = catchAsync(async (req, res) => {
  const dose = await doseService.toggleDosePause(req.userId, req.params.id);
  sendResponse(res, {
    statusCode: 200,
    message: ResponseMessages.DOSE_STATUS_TOGGLED,
    data: { dose }
  });
});
