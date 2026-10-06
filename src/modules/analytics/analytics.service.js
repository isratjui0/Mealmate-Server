import mongoose from 'mongoose';
import { User } from '../user/user.model.js';
import { MealOccurrence } from '../meal/mealOccurrence.model.js';
import { DoseOccurrence } from '../dose/doseOccurrence.model.js';
import { FoodTracking } from '../food/foodTracking.model.js';
import { Food } from '../food/food.model.js';
import { MealStatus, DoseStatus, FoodTrackingStatus } from '../../constants/enums.js';
import {
  getTodayDateKey,
  getMonthDays,
  nowInTimezone
} from '../../utils/dateUtils.js';
import {
  generateOccurrencesForUser,
  detectMissedMealOccurrences
} from '../meal/meal.service.js';
import {
  generateDoseOccurrencesForUser,
  detectMissedDoseOccurrences
} from '../dose/dose.service.js';

export const getDashboardAnalytics = async (userId) => {
  const user = await User.findById(userId);
  const timezone = user?.timezone || 'UTC';
  const todayKey = getTodayDateKey(timezone);

  // Ensure today's occurrences are generated and missed status updated
  await generateOccurrencesForUser(userId, 1);
  await generateDoseOccurrencesForUser(userId, 1);
  await detectMissedMealOccurrences(userId);
  await detectMissedDoseOccurrences(userId);

  // 1. Meal occurrences for today
  const mealsToday = await MealOccurrence.find({
    userId,
    scheduledDateKey: todayKey
  }).populate('mealId', 'name category time');

  let mealsCompleted = 0;
  let mealsSkipped = 0;
  let mealsMissed = 0;
  let mealsPending = 0;
  let mealsPostponed = 0;

  for (const m of mealsToday) {
    if (m.status === MealStatus.COMPLETED) mealsCompleted++;
    else if (m.status === MealStatus.SKIPPED) mealsSkipped++;
    else if (m.status === MealStatus.MISSED) mealsMissed++;
    else if (m.status === MealStatus.POSTPONED) mealsPostponed++;
    else if (m.status === MealStatus.PENDING) mealsPending++;
  }

  // Decided meals: completed, skipped, missed. Future pending are not counted as failed!
  const mealsDecided = mealsCompleted + mealsSkipped + mealsMissed;
  const mealCompletionRate = mealsDecided > 0 ? Math.round((mealsCompleted / mealsDecided) * 100) : 100;

  // 2. Dose occurrences for today
  const dosesToday = await DoseOccurrence.find({
    userId,
    scheduledDateKey: todayKey
  }).populate('doseScheduleId', 'itemName dosageDescription');

  let dosesTaken = 0;
  let dosesSkipped = 0;
  let dosesMissed = 0;
  let dosesPending = 0;
  let dosesPostponed = 0;

  for (const d of dosesToday) {
    if (d.status === DoseStatus.TAKEN) dosesTaken++;
    else if (d.status === DoseStatus.SKIPPED) dosesSkipped++;
    else if (d.status === DoseStatus.MISSED) dosesMissed++;
    else if (d.status === DoseStatus.POSTPONED) dosesPostponed++;
    else if (d.status === DoseStatus.PENDING) dosesPending++;
  }

  const dosesDecided = dosesTaken + dosesSkipped + dosesMissed;
  const doseAdherenceRate = dosesDecided > 0 ? Math.round((dosesTaken / dosesDecided) * 100) : 100;

  // 3. Food tracking summary for today
  const [totalActiveFoods, trackingToday] = await Promise.all([
    Food.countDocuments({ userId, active: true }),
    FoodTracking.find({ userId, trackingDate: todayKey })
  ]);

  let foodConsumed = 0;
  let foodNotConsumed = 0;
  for (const f of trackingToday) {
    if (f.status === FoodTrackingStatus.CONSUMED) foodConsumed++;
    if (f.status === FoodTrackingStatus.NOT_CONSUMED) foodNotConsumed++;
  }

  return {
    date: todayKey,
    timezone,
    meals: {
      total: mealsToday.length,
      completed: mealsCompleted,
      skipped: mealsSkipped,
      missed: mealsMissed,
      upcoming: mealsPending + mealsPostponed,
      completionRate: mealCompletionRate,
      items: mealsToday
    },
    doses: {
      total: dosesToday.length,
      taken: dosesTaken,
      skipped: dosesSkipped,
      missed: dosesMissed,
      upcoming: dosesPending + dosesPostponed,
      adherenceRate: doseAdherenceRate,
      items: dosesToday
    },
    foodTracking: {
      totalFoods: totalActiveFoods,
      recordedCells: trackingToday.length,
      consumed: foodConsumed,
      notConsumed: foodNotConsumed,
      unrecorded: Math.max(0, totalActiveFoods - trackingToday.length)
    }
  };
};

export const getMealAnalytics = async (userId, startDate, endDate) => {
  const query = { userId };
  if (startDate || endDate) {
    query.scheduledDateKey = {};
    if (startDate) query.scheduledDateKey.$gte = startDate;
    if (endDate) query.scheduledDateKey.$lte = endDate;
  }

  const occurrences = await MealOccurrence.find(query).populate('mealId', 'name category');

  let total = occurrences.length;
  let completed = 0;
  let skipped = 0;
  let missed = 0;
  let pending = 0;
  let postponed = 0;

  const dailyMap = {};

  for (const occ of occurrences) {
    const d = occ.scheduledDateKey;
    if (!dailyMap[d]) {
      dailyMap[d] = { date: d, total: 0, completed: 0, skipped: 0, missed: 0, pending: 0 };
    }
    dailyMap[d].total++;

    if (occ.status === MealStatus.COMPLETED) {
      completed++;
      dailyMap[d].completed++;
    } else if (occ.status === MealStatus.SKIPPED) {
      skipped++;
      dailyMap[d].skipped++;
    } else if (occ.status === MealStatus.MISSED) {
      missed++;
      dailyMap[d].missed++;
    } else if (occ.status === MealStatus.POSTPONED) {
      postponed++;
      dailyMap[d].pending++;
    } else {
      pending++;
      dailyMap[d].pending++;
    }
  }

  const decided = completed + skipped + missed;
  const completionRate = decided > 0 ? Math.round((completed / decided) * 100) : 100;

  const dailyBreakdown = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalOccurrences: total,
    completed,
    skipped,
    missed,
    pending: pending + postponed,
    completionRate,
    dailyBreakdown
  };
};

export const getDoseAnalytics = async (userId, startDate, endDate) => {
  const query = { userId };
  if (startDate || endDate) {
    query.scheduledDateKey = {};
    if (startDate) query.scheduledDateKey.$gte = startDate;
    if (endDate) query.scheduledDateKey.$lte = endDate;
  }

  const occurrences = await DoseOccurrence.find(query).populate('doseScheduleId', 'itemName');

  let total = occurrences.length;
  let taken = 0;
  let skipped = 0;
  let missed = 0;
  let pending = 0;

  const itemMap = {};

  for (const occ of occurrences) {
    const itemName = occ.doseScheduleId?.itemName || 'Unknown Item';
    if (!itemMap[itemName]) {
      itemMap[itemName] = { itemName, total: 0, taken: 0, skipped: 0, missed: 0, pending: 0 };
    }
    itemMap[itemName].total++;

    if (occ.status === DoseStatus.TAKEN) {
      taken++;
      itemMap[itemName].taken++;
    } else if (occ.status === DoseStatus.SKIPPED) {
      skipped++;
      itemMap[itemName].skipped++;
    } else if (occ.status === DoseStatus.MISSED) {
      missed++;
      itemMap[itemName].missed++;
    } else {
      pending++;
      itemMap[itemName].pending++;
    }
  }

  const decided = taken + skipped + missed;
  const adherenceRate = decided > 0 ? Math.round((taken / decided) * 100) : 100;

  return {
    totalOccurrences: total,
    taken,
    skipped,
    missed,
    pending,
    adherenceRate,
    itemBreakdown: Object.values(itemMap)
  };
};

export const getCalendarRoutineAnalytics = async (userId, monthKey) => {
  const user = await User.findById(userId);
  const timezone = user?.timezone || 'UTC';
  const selectedMonth = monthKey || nowInTimezone(timezone).toFormat('yyyy-MM');

  const days = getMonthDays(selectedMonth, timezone);
  const startDate = days[0].date;
  const endDate = days[days.length - 1].date;

  const [mealOccurrences, doseOccurrences, foodTrackings] = await Promise.all([
    MealOccurrence.find({ userId, scheduledDateKey: { $gte: startDate, $lte: endDate } }),
    DoseOccurrence.find({ userId, scheduledDateKey: { $gte: startDate, $lte: endDate } }),
    FoodTracking.find({ userId, trackingDate: { $gte: startDate, $lte: endDate } })
  ]);

  const mealMap = {};
  for (const m of mealOccurrences) {
    if (!mealMap[m.scheduledDateKey]) {
      mealMap[m.scheduledDateKey] = { total: 0, completed: 0, skipped: 0, missed: 0 };
    }
    mealMap[m.scheduledDateKey].total++;
    if (m.status === MealStatus.COMPLETED) mealMap[m.scheduledDateKey].completed++;
    if (m.status === MealStatus.SKIPPED) mealMap[m.scheduledDateKey].skipped++;
    if (m.status === MealStatus.MISSED) mealMap[m.scheduledDateKey].missed++;
  }

  const doseMap = {};
  for (const d of doseOccurrences) {
    if (!doseMap[d.scheduledDateKey]) {
      doseMap[d.scheduledDateKey] = { total: 0, taken: 0, skipped: 0, missed: 0 };
    }
    doseMap[d.scheduledDateKey].total++;
    if (d.status === DoseStatus.TAKEN) doseMap[d.scheduledDateKey].taken++;
    if (d.status === DoseStatus.SKIPPED) doseMap[d.scheduledDateKey].skipped++;
    if (d.status === DoseStatus.MISSED) doseMap[d.scheduledDateKey].missed++;
  }

  const foodMap = {};
  for (const f of foodTrackings) {
    if (!foodMap[f.trackingDate]) {
      foodMap[f.trackingDate] = { totalLogged: 0, consumed: 0, notConsumed: 0 };
    }
    foodMap[f.trackingDate].totalLogged++;
    if (f.status === FoodTrackingStatus.CONSUMED) foodMap[f.trackingDate].consumed++;
    if (f.status === FoodTrackingStatus.NOT_CONSUMED) foodMap[f.trackingDate].notConsumed++;
  }

  const calendarDays = days.map((day) => {
    return {
      date: day.date,
      weekday: day.weekday,
      dayNumber: day.dayNumber,
      mealStats: mealMap[day.date] || { total: 0, completed: 0, skipped: 0, missed: 0 },
      doseStats: doseMap[day.date] || { total: 0, taken: 0, skipped: 0, missed: 0 },
      foodStats: foodMap[day.date] || { totalLogged: 0, consumed: 0, notConsumed: 0 }
    };
  });

  return {
    month: selectedMonth,
    days: calendarDays
  };
};
