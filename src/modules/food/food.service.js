import mongoose from 'mongoose';
import { Food } from './food.model.js';
import { FoodTracking } from './foodTracking.model.js';
import { User } from '../user/user.model.js';
import { AppError } from '../../utils/AppError.js';
import { getMonthDays, nowInTimezone } from '../../utils/dateUtils.js';

export const createFood = async (userId, foodData) => {
  let columnOrder = foodData.columnOrder;
  if (columnOrder === undefined) {
    const highest = await Food.findOne({ userId }).sort({ columnOrder: -1 }).select('columnOrder');
    columnOrder = highest && highest.columnOrder !== undefined ? highest.columnOrder + 1 : 0;
  }

  const food = await Food.create({
    ...foodData,
    userId,
    columnOrder
  });

  return food.toJSON();
};

export const getFoods = async (userId, includeArchived = false) => {
  const query = { userId };
  if (!includeArchived) {
    query.active = true;
  }

  const foods = await Food.find(query).sort({ columnOrder: 1, createdAt: 1 });
  return foods.map((f) => f.toJSON());
};

export const getFoodById = async (userId, foodId) => {
  const food = await Food.findOne({ _id: foodId, userId });
  if (!food) {
    throw new AppError('Food item not found', 404);
  }
  return food.toJSON();
};

export const updateFood = async (userId, foodId, updateData) => {
  const food = await Food.findOne({ _id: foodId, userId });
  if (!food) {
    throw new AppError('Food item not found', 404);
  }

  Object.assign(food, updateData);
  await food.save();

  return food.toJSON();
};

export const deleteFood = async (userId, foodId) => {
  const food = await Food.findOne({ _id: foodId, userId });
  if (!food) {
    throw new AppError('Food item not found', 404);
  }

  // Check if historical tracking records exist for this food
  const trackingCount = await FoodTracking.countDocuments({ userId, foodId });
  if (trackingCount > 0) {
    // Soft-archive to preserve historical records as required by SRS
    food.active = false;
    await food.save();
    return { archived: true, message: 'Food item archived to preserve historical tracking records' };
  } else {
    await Food.deleteOne({ _id: foodId });
    return { deleted: true, message: 'Food item deleted successfully' };
  }
};

export const reorderFoods = async (userId, { orders, foodIds }) => {
  const bulkOps = [];

  if (orders && Array.isArray(orders)) {
    for (const item of orders) {
      bulkOps.push({
        updateOne: {
          filter: { _id: item.id, userId },
          update: { $set: { columnOrder: item.columnOrder } }
        }
      });
    }
  } else if (foodIds && Array.isArray(foodIds)) {
    foodIds.forEach((id, index) => {
      bulkOps.push({
        updateOne: {
          filter: { _id: id, userId },
          update: { $set: { columnOrder: index } }
        }
      });
    });
  }

  if (bulkOps.length > 0) {
    await Food.bulkWrite(bulkOps);
  }

  return getFoods(userId, false);
};

/**
 * Retrieve spreadsheet food tracking matrix for specified month (YYYY-MM)
 */
export const getMonthlyFoodTracking = async (userId, monthKey) => {
  const user = await User.findById(userId);
  const timezone = user?.timezone || 'UTC';

  const selectedMonth = monthKey || nowInTimezone(timezone).toFormat('yyyy-MM');
  const monthDays = getMonthDays(selectedMonth, timezone);

  const startDate = monthDays[0].date;
  const endDate = monthDays[monthDays.length - 1].date;

  // Find all active foods
  const activeFoods = await Food.find({ userId, active: true }).sort({ columnOrder: 1, createdAt: 1 });

  // Single bulk query for the entire month
  const trackingRecords = await FoodTracking.find({
    userId,
    trackingDate: { $gte: startDate, $lte: endDate }
  });

  // Index tracking records by "YYYY-MM-DD:foodId"
  const trackingMap = new Map();
  const additionalFoodIds = new Set();

  for (const record of trackingRecords) {
    const key = `${record.trackingDate}:${record.foodId.toString()}`;
    trackingMap.set(key, record.status);
    additionalFoodIds.add(record.foodId.toString());
  }

  // Check if any archived foods have tracking entries this month to include them
  const activeFoodIdSet = new Set(activeFoods.map((f) => f._id.toString()));
  const missingArchivedIds = Array.from(additionalFoodIds).filter((id) => !activeFoodIdSet.has(id));

  let allFoods = [...activeFoods];
  if (missingArchivedIds.length > 0) {
    const archivedFoods = await Food.find({ _id: { $in: missingArchivedIds }, userId });
    allFoods = [...allFoods, ...archivedFoods].sort((a, b) => (a.columnOrder || 0) - (b.columnOrder || 0));
  }

  const formattedFoods = allFoods.map((f) => ({
    id: f._id.toString(),
    name: f.name,
    category: f.category,
    columnOrder: f.columnOrder,
    active: f.active
  }));

  // Build the spreadsheet day rows
  const days = monthDays.map((day) => {
    const entries = {};
    for (const food of formattedFoods) {
      const entryKey = `${day.date}:${food.id}`;
      // null indicates an unrecorded cell
      entries[food.id] = trackingMap.has(entryKey) ? trackingMap.get(entryKey) : null;
    }

    return {
      date: day.date,
      weekday: day.weekday,
      dayNumber: day.dayNumber,
      entries
    };
  });

  return {
    month: selectedMonth,
    foods: formattedFoods,
    days
  };
};

export const getDailyFoodTracking = async (userId, dateStr) => {
  const foods = await Food.find({ userId, active: true }).sort({ columnOrder: 1 });
  const records = await FoodTracking.find({ userId, trackingDate: dateStr });

  const recordMap = new Map();
  for (const rec of records) {
    recordMap.set(rec.foodId.toString(), {
      status: rec.status,
      notes: rec.notes
    });
  }

  const items = foods.map((f) => {
    const rec = recordMap.get(f._id.toString());
    return {
      foodId: f._id.toString(),
      foodName: f.name,
      category: f.category,
      status: rec ? rec.status : null,
      notes: rec ? rec.notes : ''
    };
  });

  return {
    date: dateStr,
    items
  };
};

export const upsertTrackingCell = async (userId, foodId, dateStr, status, notes = '') => {
  // Validate that food belongs to user
  const food = await Food.findOne({ _id: foodId, userId });
  if (!food) {
    throw new AppError('Food item not found or does not belong to user', 404);
  }

  // Atomic upsert
  const trackingRecord = await FoodTracking.findOneAndUpdate(
    { userId, foodId, trackingDate: dateStr },
    {
      $set: {
        status,
        notes: notes || ''
      }
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    }
  );

  return {
    foodId: trackingRecord.foodId.toString(),
    date: trackingRecord.trackingDate,
    status: trackingRecord.status,
    notes: trackingRecord.notes
  };
};

export const clearTrackingCell = async (userId, foodId, dateStr) => {
  // Safe cell clearing deletes the tracking record
  await FoodTracking.findOneAndDelete({
    userId,
    foodId,
    trackingDate: dateStr
  });

  return {
    foodId,
    date: dateStr,
    status: null
  };
};

export const getFoodAnalytics = async (userId, startDate, endDate) => {
  const matchStage = { userId: new mongoose.Types.ObjectId(userId) };

  if (startDate || endDate) {
    matchStage.trackingDate = {};
    if (startDate) matchStage.trackingDate.$gte = startDate;
    if (endDate) matchStage.trackingDate.$lte = endDate;
  }

  const [statusStats, foodStats, totalFoods] = await Promise.all([
    FoodTracking.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]),
    FoodTracking.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { foodId: '$foodId', status: '$status' },
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'foods',
          localField: '_id.foodId',
          foreignField: '_id',
          as: 'food'
        }
      },
      { $unwind: '$food' },
      {
        $project: {
          foodId: '$_id.foodId',
          foodName: '$food.name',
          status: '$_id.status',
          count: 1
        }
      }
    ]),
    Food.countDocuments({ userId, active: true })
  ]);

  let consumedCount = 0;
  let notConsumedCount = 0;

  for (const s of statusStats) {
    if (s._id === 'consumed') consumedCount = s.count;
    if (s._id === 'not_consumed') notConsumedCount = s.count;
  }

  return {
    totalFoodsActive: totalFoods,
    totalRecords: consumedCount + notConsumedCount,
    consumed: consumedCount,
    notConsumed: notConsumedCount,
    breakdownByFood: foodStats
  };
};
