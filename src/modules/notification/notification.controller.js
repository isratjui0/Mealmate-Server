import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { ResponseMessages } from '../../constants/messages.js';
import * as notificationService from './notification.service.js';

export const getNotifications = catchAsync(async (req, res) => {
  const unreadOnly = req.query.unreadOnly === 'true';
  const notifications = await notificationService.getNotifications(req.userId, unreadOnly);
  sendResponse(res, {
    statusCode: 200,
    message: ResponseMessages.NOTIFICATIONS_FETCHED,
    data: { notifications }
  });
});

export const markAsRead = catchAsync(async (req, res) => {
  const notification = await notificationService.markAsRead(req.userId, req.params.id);
  sendResponse(res, {
    statusCode: 200,
    message: ResponseMessages.NOTIFICATION_READ,
    data: { notification }
  });
});

export const subscribePush = catchAsync(async (req, res) => {
  const subscription = await notificationService.savePushSubscription(req.userId, req.body);
  sendResponse(res, {
    statusCode: 201,
    message: ResponseMessages.PUSH_SUBSCRIBED,
    data: { subscription }
  });
});

export const unsubscribePush = catchAsync(async (req, res) => {
  await notificationService.removePushSubscription(req.userId, req.body.endpoint);
  sendResponse(res, {
    statusCode: 200,
    message: ResponseMessages.PUSH_UNSUBSCRIBED,
    data: null
  });
});

export const getPreferences = catchAsync(async (req, res) => {
  const preferences = await notificationService.getNotificationPreferences(req.userId);
  sendResponse(res, {
    statusCode: 200,
    message: ResponseMessages.NOTIFICATION_PREFS_FETCHED,
    data: { preferences }
  });
});

export const updatePreferences = catchAsync(async (req, res) => {
  const preferences = await notificationService.updateNotificationPreferences(req.userId, req.body);
  sendResponse(res, {
    statusCode: 200,
    message: ResponseMessages.NOTIFICATION_PREFS_UPDATED,
    data: { preferences }
  });
});
