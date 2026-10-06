import { DateTime } from 'luxon';
import { Meal } from './meal.model.js';
import { MealOccurrence } from './mealOccurrence.model.js';
import { User } from '../user/user.model.js';
import { AppError } from '../../utils/AppError.js';
import { MealStatus, ValidMealTransitions } from '../../constants/enums.js';
import {
  nowInTimezone,
  createScheduledDate,
  getStandardWeekday
} from '../../utils/dateUtils.js';

/**
 * Generate meal occurrences for a user within a rolling date window (default 7 days)
 */
export const generateOccurrencesForUser = async (userId, daysAhead = 7) => {
  const user = await User.findById(userId);
  if (!user) return;

  const timezone = user.timezone || 'UTC';
  const now = nowInTimezone(timezone);
  const activeMeals = await Meal.find({ userId, active: true });

  if (activeMeals.length === 0) return;

  const operations = [];

  for (let i = 0; i <= daysAhead; i++) {
    const targetDt = now.plus({ days: i });
    const dateKey = targetDt.toFormat('yyyy-MM-dd');
    const weekday = getStandardWeekday(targetDt);

    for (const meal of activeMeals) {
      if (meal.weekdays.includes(weekday)) {
        const scheduledAt = createScheduledDate(dateKey, meal.time, timezone);

        operations.push({
          updateOne: {
            filter: {
              userId,
              mealId: meal._id,
              scheduledDateKey: dateKey
            },
            update: {
              $setOnInsert: {
                userId,
                mealId: meal._id,
                scheduledDateKey: dateKey,
                scheduledAt,
                status: MealStatus.PENDING,
                snoozeCount: 0
              }
            },
            upsert: true
          }
        });
      }
    }
  }

  if (operations.length > 0) {
    await MealOccurrence.bulkWrite(operations, { ordered: false }).catch((err) => {
      // Ignore duplicate key errors if concurrent writes occur
      if (err.code !== 11000) throw err;
    });
  }
};

/**
 * Update overdue occurrences to 'missed' status based on grace period
 */
export const detectMissedMealOccurrences = async (userId) => {
  const user = await User.findById(userId);
  const graceMinutes = user?.preferences?.gracePeriodMinutes || 30;
  const now = new Date();

  // 1. Pending occurrences past scheduledAt + graceMinutes
  const pendingThreshold = new Date(now.getTime() - graceMinutes * 60 * 1000);
  await MealOccurrence.updateMany(
    {
      userId,
      status: MealStatus.PENDING,
      scheduledAt: { $lt: pendingThreshold }
    },
    {
      $set: { status: MealStatus.MISSED }
    }
  );

  // 2. Postponed occurrences past postponedUntil + graceMinutes
  await MealOccurrence.updateMany(
    {
      userId,
      status: MealStatus.POSTPONED,
      postponedUntil: { $lt: pendingThreshold }
    },
    {
      $set: { status: MealStatus.MISSED }
    }
  );
};

export const createMeal = async (userId, mealData) => {
  const meal = await Meal.create({
    ...mealData,
    userId
  });

  // Generate occurrences immediately for upcoming days
  await generateOccurrencesForUser(userId, 7);

  return meal.toJSON();
};

export const getMeals = async (userId) => {
  const meals = await Meal.find({ userId }).sort({ time: 1 });
  return meals.map((m) => m.toJSON());
};

export const getMealById = async (userId, mealId) => {
  const meal = await Meal.findOne({ _id: mealId, userId });
  if (!meal) {
    throw new AppError('Meal schedule not found', 404);
  }
  return meal.toJSON();
};

export const updateMeal = async (userId, mealId, updateData) => {
  const meal = await Meal.findOne({ _id: mealId, userId });
  if (!meal) {
    throw new AppError('Meal schedule not found', 404);
  }

  Object.assign(meal, updateData);
  await meal.save();

  // If time or weekdays changed, refresh future pending occurrences
  if (updateData.time || updateData.weekdays) {
    const user = await User.findById(userId);
    const timezone = user?.timezone || 'UTC';
    const now = new Date();

    // Remove future pending occurrences to regenerate matching new schedule
    await MealOccurrence.deleteMany({
      userId,
      mealId,
      status: MealStatus.PENDING,
      scheduledAt: { $gte: now }
    });

    await generateOccurrencesForUser(userId, 7);
  }

  return meal.toJSON();
};

export const deleteMeal = async (userId, mealId) => {
  const meal = await Meal.findOneAndDelete({ _id: mealId, userId });
  if (!meal) {
    throw new AppError('Meal schedule not found', 404);
  }

  // Preserve completed/skipped/missed history, only remove future pending ones
  const now = new Date();
  await MealOccurrence.deleteMany({
    userId,
    mealId,
    status: MealStatus.PENDING,
    scheduledAt: { $gte: now }
  });

  return true;
};

export const toggleMealPause = async (userId, mealId) => {
  const meal = await Meal.findOne({ _id: mealId, userId });
  if (!meal) {
    throw new AppError('Meal schedule not found', 404);
  }

  meal.active = !meal.active;
  await meal.save();

  if (meal.active) {
    await generateOccurrencesForUser(userId, 7);
  } else {
    // If paused, remove future pending occurrences
    const now = new Date();
    await MealOccurrence.deleteMany({
      userId,
      mealId,
      status: MealStatus.PENDING,
      scheduledAt: { $gte: now }
    });
  }

  return meal.toJSON();
};

export const getOccurrences = async (userId, filters = {}) => {
  // Ensure today's and upcoming occurrences exist
  await generateOccurrencesForUser(userId, 3);
  // Detect missed meals
  await detectMissedMealOccurrences(userId);

  const query = { userId };

  if (filters.date) {
    query.scheduledDateKey = filters.date;
  } else if (filters.startDate || filters.endDate) {
    query.scheduledDateKey = {};
    if (filters.startDate) query.scheduledDateKey.$gte = filters.startDate;
    if (filters.endDate) query.scheduledDateKey.$lte = filters.endDate;
  }

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.mealId) {
    query.mealId = filters.mealId;
  }

  const occurrences = await MealOccurrence.find(query)
    .populate('mealId', 'name category time reminderEnabled')
    .sort({ scheduledAt: 1 });

  return occurrences.map((occ) => occ.toJSON());
};

export const getOccurrenceById = async (userId, occurrenceId) => {
  const occurrence = await MealOccurrence.findOne({ _id: occurrenceId, userId }).populate(
    'mealId',
    'name category time'
  );

  if (!occurrence) {
    throw new AppError('Meal occurrence not found', 404);
  }

  return occurrence.toJSON();
};

export const completeOccurrence = async (userId, occurrenceId, notes) => {
  const occurrence = await MealOccurrence.findOne({ _id: occurrenceId, userId });
  if (!occurrence) {
    throw new AppError('Meal occurrence not found', 404);
  }

  const allowed = ValidMealTransitions[occurrence.status];
  if (!allowed || !allowed.includes(MealStatus.COMPLETED)) {
    throw new AppError(
      `Cannot mark meal as completed from current status '${occurrence.status}'`,
      400
    );
  }

  occurrence.status = MealStatus.COMPLETED;
  occurrence.completedAt = new Date();
  if (notes !== undefined) occurrence.notes = notes;

  await occurrence.save();
  return occurrence.toJSON();
};

export const skipOccurrence = async (userId, occurrenceId, notes) => {
  const occurrence = await MealOccurrence.findOne({ _id: occurrenceId, userId });
  if (!occurrence) {
    throw new AppError('Meal occurrence not found', 404);
  }

  const allowed = ValidMealTransitions[occurrence.status];
  if (!allowed || !allowed.includes(MealStatus.SKIPPED)) {
    throw new AppError(
      `Cannot mark meal as skipped from current status '${occurrence.status}'`,
      400
    );
  }

  occurrence.status = MealStatus.SKIPPED;
  if (notes !== undefined) occurrence.notes = notes;

  await occurrence.save();
  return occurrence.toJSON();
};

export const postponeOccurrence = async (userId, occurrenceId, { minutes, postponedUntil, notes }) => {
  const occurrence = await MealOccurrence.findOne({ _id: occurrenceId, userId });
  if (!occurrence) {
    throw new AppError('Meal occurrence not found', 404);
  }

  const allowed = ValidMealTransitions[occurrence.status];
  if (!allowed || !allowed.includes(MealStatus.POSTPONED)) {
    throw new AppError(
      `Cannot postpone meal from current status '${occurrence.status}'`,
      400
    );
  }

  let newPostponedDate;
  if (postponedUntil) {
    newPostponedDate = new Date(postponedUntil);
  } else if (minutes) {
    const baseTime = occurrence.postponedUntil || occurrence.scheduledAt || new Date();
    newPostponedDate = new Date(new Date(baseTime).getTime() + minutes * 60 * 1000);
  }

  if (isNaN(newPostponedDate.getTime())) {
    throw new AppError('Invalid postponed time', 400);
  }

  occurrence.status = MealStatus.POSTPONED;
  occurrence.postponedUntil = newPostponedDate;
  if (notes !== undefined) occurrence.notes = notes;

  await occurrence.save();
  return occurrence.toJSON();
};

export const snoozeOccurrence = async (userId, occurrenceId, durationMinutes = 10) => {
  const occurrence = await MealOccurrence.findOne({ _id: occurrenceId, userId });
  if (!occurrence) {
    throw new AppError('Meal occurrence not found', 404);
  }

  const baseTime = new Date();
  const newPostponedDate = new Date(baseTime.getTime() + durationMinutes * 60 * 1000);

  occurrence.status = MealStatus.POSTPONED;
  occurrence.postponedUntil = newPostponedDate;
  occurrence.snoozeCount = (occurrence.snoozeCount || 0) + 1;

  await occurrence.save();
  return occurrence.toJSON();
};
