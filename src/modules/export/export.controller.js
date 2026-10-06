import { catchAsync } from '../../utils/catchAsync.js';
import * as exportService from './export.service.js';

export const exportFoodTracking = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;
  const csv = await exportService.exportFoodTrackingCsv(req.userId, startDate, endDate);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="food_tracking_export.csv"');
  res.status(200).send(csv);
});

export const exportMealHistory = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;
  const csv = await exportService.exportMealHistoryCsv(req.userId, startDate, endDate);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="meal_history_export.csv"');
  res.status(200).send(csv);
});

export const exportDoseHistory = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;
  const csv = await exportService.exportDoseHistoryCsv(req.userId, startDate, endDate);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="dose_history_export.csv"');
  res.status(200).send(csv);
});
