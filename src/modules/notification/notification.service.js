import { Notification } from './notification.model.js';
import { PushSubscription } from './pushSubscription.model.js';
import { User } from '../user/user.model.js';
import { AppError } from '../../utils/AppError.js';

export const getNotifications = async (userId, unreadOnly = false) => {
  const query = { userId };
  if (unreadOnly) {
    query.isRead = false;
  }

  const notifications = await Notification.find(query).sort({ scheduledFor: -1, createdAt: -1 }).limit(100);
  return notifications.map((n) => n.toJSON());
};

export const markAsRead = async (userId, notificationId) => {
  const notification = await Notification.findOne({ _id: notificationId, userId });
  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  notification.isRead = true;
  await notification.save();

  return notification.toJSON();
};

export const savePushSubscription = async (userId, { endpoint, keys }) => {
  const subscription = await PushSubscription.findOneAndUpdate(
    { userId, endpoint },
    { $set: { keys } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return subscription.toJSON();
};

export const removePushSubscription = async (userId, endpoint) => {
  await PushSubscription.findOneAndDelete({ userId, endpoint });
  return true;
};

export const getNotificationPreferences = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  return user.preferences;
};

export const updateNotificationPreferences = async (userId, prefs) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  user.preferences = {
    ...user.preferences.toObject(),
    ...prefs
  };

  await user.save();
  return user.preferences;
};
