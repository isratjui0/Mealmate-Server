import { User } from './user.model.js';
import { Meal } from '../meal/meal.model.js';
import { MealOccurrence } from '../meal/mealOccurrence.model.js';
import { Food } from '../food/food.model.js';
import { FoodTracking } from '../food/foodTracking.model.js';
import { DoseSchedule } from '../dose/doseSchedule.model.js';
import { DoseOccurrence } from '../dose/doseOccurrence.model.js';
import { Notification } from '../notification/notification.model.js';
import { PushSubscription } from '../notification/pushSubscription.model.js';
import { AppError } from '../../utils/AppError.js';

export const getUserProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  return user.toJSON();
};

export const updateUserProfile = async (userId, { name, timezone }) => {
  const updates = {};
  if (name !== undefined) updates.name = name.trim();
  if (timezone !== undefined) updates.timezone = timezone.trim();

  const user = await User.findByIdAndUpdate(userId, updates, {
    new: true,
    runValidators: true
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }
  return user.toJSON();
};

export const updateUserPreferences = async (userId, preferences) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Merge preferences cleanly
  user.preferences = {
    ...user.preferences.toObject(),
    ...preferences
  };

  await user.save();
  return user.toJSON();
};

export const deleteUserAccount = async (userId) => {
  const user = await User.findByIdAndDelete(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Cascade delete all user-owned records
  await Promise.all([
    Meal.deleteMany({ userId }),
    MealOccurrence.deleteMany({ userId }),
    Food.deleteMany({ userId }),
    FoodTracking.deleteMany({ userId }),
    DoseSchedule.deleteMany({ userId }),
    DoseOccurrence.deleteMany({ userId }),
    Notification.deleteMany({ userId }),
    PushSubscription.deleteMany({ userId })
  ]);

  return true;
};
