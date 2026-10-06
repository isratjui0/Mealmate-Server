import { FoodTracking } from '../food/foodTracking.model.js';
import { MealOccurrence } from '../meal/mealOccurrence.model.js';
import { DoseOccurrence } from '../dose/doseOccurrence.model.js';
import { generateCsv } from '../../utils/csv.js';

export const exportFoodTrackingCsv = async (userId, startDate, endDate) => {
  const query = { userId };
  if (startDate || endDate) {
    query.trackingDate = {};
    if (startDate) query.trackingDate.$gte = startDate;
    if (endDate) query.trackingDate.$lte = endDate;
  }

  const records = await FoodTracking.find(query)
    .populate('foodId', 'name category')
    .sort({ trackingDate: -1 });

  const columns = [
    { key: 'date', label: 'Tracking Date' },
    { key: 'foodName', label: 'Food Item' },
    { key: 'category', label: 'Category' },
    { key: 'status', label: 'Status' },
    { key: 'notes', label: 'Notes' }
  ];

  const rows = records.map((r) => ({
    date: r.trackingDate,
    foodName: r.foodId?.name || 'Deleted Food',
    category: r.foodId?.category || 'General',
    status: r.status,
    notes: r.notes || ''
  }));

  return generateCsv(columns, rows);
};

export const exportMealHistoryCsv = async (userId, startDate, endDate) => {
  const query = { userId };
  if (startDate || endDate) {
    query.scheduledDateKey = {};
    if (startDate) query.scheduledDateKey.$gte = startDate;
    if (endDate) query.scheduledDateKey.$lte = endDate;
  }

  const occurrences = await MealOccurrence.find(query)
    .populate('mealId', 'name category time')
    .sort({ scheduledAt: -1 });

  const columns = [
    { key: 'date', label: 'Scheduled Date' },
    { key: 'time', label: 'Scheduled Time' },
    { key: 'name', label: 'Meal Name' },
    { key: 'category', label: 'Category' },
    { key: 'status', label: 'Outcome Status' },
    { key: 'completedAt', label: 'Completed At' },
    { key: 'notes', label: 'Notes' }
  ];

  const rows = occurrences.map((o) => ({
    date: o.scheduledDateKey,
    time: o.mealId?.time || '',
    name: o.mealId?.name || 'Deleted Meal',
    category: o.mealId?.category || 'custom',
    status: o.status,
    completedAt: o.completedAt ? o.completedAt.toISOString() : '',
    notes: o.notes || ''
  }));

  return generateCsv(columns, rows);
};

export const exportDoseHistoryCsv = async (userId, startDate, endDate) => {
  const query = { userId };
  if (startDate || endDate) {
    query.scheduledDateKey = {};
    if (startDate) query.scheduledDateKey.$gte = startDate;
    if (endDate) query.scheduledDateKey.$lte = endDate;
  }

  const occurrences = await DoseOccurrence.find(query)
    .populate('doseScheduleId', 'itemName dosageDescription')
    .sort({ scheduledAt: -1 });

  const columns = [
    { key: 'date', label: 'Scheduled Date' },
    { key: 'time', label: 'Scheduled Time' },
    { key: 'itemName', label: 'Medication / Item' },
    { key: 'dosage', label: 'Dosage Description' },
    { key: 'status', label: 'Outcome Status' },
    { key: 'recordedAt', label: 'Recorded At' },
    { key: 'notes', label: 'Notes' }
  ];

  const rows = occurrences.map((o) => ({
    date: o.scheduledDateKey,
    time: o.scheduledTime,
    itemName: o.doseScheduleId?.itemName || 'Deleted Dose Item',
    dosage: o.doseScheduleId?.dosageDescription || '',
    status: o.status,
    recordedAt: o.recordedAt ? o.recordedAt.toISOString() : '',
    notes: o.notes || ''
  }));

  return generateCsv(columns, rows);
};
