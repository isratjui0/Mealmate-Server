import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { ResponseMessages } from '../../constants/messages.js';
import * as userService from './user.service.js';

export const getProfile = catchAsync(async (req, res) => {
  const profile = await userService.getUserProfile(req.userId);

  sendResponse(res, {
    statusCode: 200,
    message: ResponseMessages.PROFILE_FETCH_SUCCESS,
    data: { user: profile }
  });
});

export const updateProfile = catchAsync(async (req, res) => {
  const updatedUser = await userService.updateUserProfile(req.userId, req.body);

  sendResponse(res, {
    statusCode: 200,
    message: ResponseMessages.PROFILE_UPDATE_SUCCESS,
    data: { user: updatedUser }
  });
});

export const updatePreferences = catchAsync(async (req, res) => {
  const updatedUser = await userService.updateUserPreferences(req.userId, req.body);

  sendResponse(res, {
    statusCode: 200,
    message: ResponseMessages.PREFERENCES_UPDATE_SUCCESS,
    data: { user: updatedUser }
  });
});

export const deleteAccount = catchAsync(async (req, res) => {
  await userService.deleteUserAccount(req.userId);

  sendResponse(res, {
    statusCode: 200,
    message: ResponseMessages.ACCOUNT_DELETED_SUCCESS,
    data: null
  });
});
