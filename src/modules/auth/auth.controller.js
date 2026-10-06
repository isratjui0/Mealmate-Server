import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { ResponseMessages } from '../../constants/messages.js';
import * as authService from './auth.service.js';

export const register = catchAsync(async (req, res) => {
  const result = await authService.registerUser(req.body);

  sendResponse(res, {
    statusCode: 201,
    message: ResponseMessages.REGISTER_SUCCESS,
    data: result
  });
});

export const login = catchAsync(async (req, res) => {
  const result = await authService.loginUser(req.body);

  sendResponse(res, {
    statusCode: 200,
    message: ResponseMessages.LOGIN_SUCCESS,
    data: result
  });
});

export const logout = catchAsync(async (req, res) => {
  sendResponse(res, {
    statusCode: 200,
    message: ResponseMessages.LOGOUT_SUCCESS,
    data: null
  });
});

export const getMe = catchAsync(async (req, res) => {
  sendResponse(res, {
    statusCode: 200,
    message: ResponseMessages.PROFILE_FETCH_SUCCESS,
    data: {
      user: req.user.toJSON()
    }
  });
});
