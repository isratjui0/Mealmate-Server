import { DateTime } from 'luxon';
import { DoseSchedule } from './doseSchedule.model.js';
import { DoseOccurrence } from './doseOccurrence.model.js';
import { User } from '../user/user.model.js';
import { AppError } from '../../utils/AppError.js';
import { DoseStatus, ValidDoseTransitions } from '../../constants/enums.js';
import {
  nowInTimezone,
  createScheduledDate,
  getStandardWeekday
} from '../../utils/dateUtils.js';

export const generateDoseOccurrencesForUser = async (userId, daysAhead = 7) => {
  const user = await User.findById(userId);
  if (!user) return;

  const timezone = user.timezone || 'UTC';
  const now = nowInTimezone(timezone);
  const activeSchedules = await DoseSchedule.find({ userId, active: true });

  if (activeSchedules.length === 0) return;

  const operations = [];

  for (let i = 0; i <= daysAhead; i++) {
    const targetDt = now.plus({ days: i });
    const dateKey = targetDt.toFormat('yyyy-MM-dd');
    const weekday = getStandardWeekday(targetDt);

    for (const schedule of activeSchedules) {
      // Respect schedule start and end dates
      if (dateKey < schedule.startDate) continue;
      if (schedule.endDate && dateKey > schedule.endDate) continue;

      if (schedule.weekdays.includes(weekday)) {
        for (const timeStr of schedule.times) {
          const scheduledAt = createScheduledDate(dateKey, timeStr, timezone);

          operations.push({
            updateOne: {
              filter: {
                userId,
                doseScheduleId: schedule._id,
                scheduledDateKey: dateKey,
                scheduledTime: timeStr
              },
              update: {
                $setOnInsert: {
                  userId,
                  doseScheduleId: schedule._id,
                  scheduledDateKey: dateKey,
                  scheduledTime: timeStr,
                  scheduledAt,
                  status: DoseStatus.PENDING
                }
              },
              upsert: true
            }
          });
        }
      }
    }
  }

  if (operations.length > 0) {
    await DoseOccurrence.bulkWrite(operations, { ordered: false }).catch((err) => {
      if (err.code !== 11000) throw err;
    });
  }
};

export const detectMissedDoseOccurrences = async (userId) => {
  const user = await User.findById(userId);
  const graceMinutes = user?.preferences?.gracePeriodMinutes || 30;
  const now = new Date();

  const pendingThreshold = new Date(now.getTime() - graceMinutes * 60 * 1000);

  // 1. Pending occurrences past scheduledAt + graceMinutes
  await DoseOccurrence.updateMany(
    {
      userId,
      status: DoseStatus.PENDING,
      scheduledAt: { $lt: pendingThreshold }
    },
    {
      $set: { status: DoseStatus.MISSED }
    }
  );

  // 2. Postponed occurrences past postponedUntil + graceMinutes
  await DoseOccurrence.updateMany(
    {
      userId,
      status: DoseStatus.POSTPONED,
      postponedUntil: { $lt: pendingThreshold }
    },
    {
      $set: { status: DoseStatus.MISSED }
    }
  );
};

export const createDoseSchedule = async (userId, doseData) => {
  const schedule = await DoseSchedule.create({
    ...doseData,
    userId
  });

  await generateDoseOccurrencesForUser(userId, 7);

  return schedule.toJSON();
};

export const getDoseSchedules = async (userId) => {
  const schedules = await DoseSchedule.find({ userId }).sort({ createdAt: -1 });
  return schedules.map((s) => s.toJSON());
};

export const getDoseScheduleById = async (userId, doseId) => {
  const schedule = await DoseSchedule.findOne({ _id: doseId, userId });
  if (!schedule) {
    throw new AppError('Dose schedule not found', 404);
  }
  return schedule.toJSON();
};

export const updateDoseSchedule = async (userId, doseId, updateData) => {
  const schedule = await DoseSchedule.findOne({ _id: doseId, userId });
  if (!schedule) {
    throw new AppError('Dose schedule not found', 404);
  }

  Object.assign(schedule, updateData);
  await schedule.save();

  // If timing or dates changed, refresh future pending occurrences
  if (updateData.times || updateData.weekdays || updateData.startDate || updateData.endDate) {
    const now = new Date();
    await DoseOccurrence.deleteMany({
      userId,
      doseScheduleId: doseId,
      status: DoseStatus.PENDING,
      scheduledAt: { $gte: now }
    });

    await generateDoseOccurrencesForUser(userId, 7);
  }

  return schedule.toJSON();
};

export const deleteDoseSchedule = async (userId, doseId) => {
  const schedule = await DoseSchedule.findOneAndDelete({ _id: doseId, userId });
  if (!schedule) {
    throw new AppError('Dose schedule not found', 404);
  }

  const now = new Date();
  await DoseOccurrence.deleteMany({
    userId,
    doseScheduleId: doseId,
    status: DoseStatus.PENDING,
    scheduledAt: { $gte: now }
  });

  return true;
};

export const toggleDosePause = async (userId, doseId) => {
  const schedule = await DoseSchedule.findOne({ _id: doseId, userId });
  if (!schedule) {
    throw new AppError('Dose schedule not found', 404);
  }

  schedule.active = !schedule.active;
  await schedule.save();

  if (schedule.active) {
    await generateDoseOccurrencesForUser(userId, 7);
  } else {
    const now = new Date();
    await DoseOccurrence.deleteMany({
      userId,
      doseScheduleId: doseId,
      status: DoseStatus.PENDING,
      scheduledAt: { $gte: now }
    });
  }

  return schedule.toJSON();
};

export const getDoseOccurrences = async (userId, filters = {}) => {
  await generateDoseOccurrencesForUser(userId, 3);
  await detectMissedDoseOccurrences(userId);

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

  if (filters.doseScheduleId) {
    query.doseScheduleId = filters.doseScheduleId;
  }

  const occurrences = await DoseOccurrence.find(query)
    .populate('doseScheduleId', 'itemName dosageDescription reminderEnabled')
    .sort({ scheduledAt: 1 });

  return occurrences.map((occ) => occ.toJSON());
};

export const getDoseOccurrenceById = async (userId, occurrenceId) => {
  const occurrence = await DoseOccurrence.findOne({ _id: occurrenceId, userId }).populate(
    'doseScheduleId',
    'itemName dosageDescription reminderEnabled'
  );

  if (!occurrence) {
    throw new AppError('Dose occurrence not found', 404);
  }

  return occurrence.toJSON();
};

export const markDoseTaken = async (userId, occurrenceId, notes) => {
  const occurrence = await DoseOccurrence.findOne({ _id: occurrenceId, userId });
  if (!occurrence) {
    throw new AppError('Dose occurrence not found', 404);
  }

  const allowed = ValidDoseTransitions[occurrence.status];
  if (!allowed || !allowed.includes(DoseStatus.TAKEN)) {
    throw new AppError(
      `Cannot mark dose as taken from current status '${occurrence.status}'`,
      400
    );
  }

  occurrence.status = DoseStatus.TAKEN;
  occurrence.recordedAt = new Date();
  if (notes !== undefined) occurrence.notes = notes;

  await occurrence.save();
  return occurrence.toJSON();
};

export const markDoseSkipped = async (userId, occurrenceId, notes) => {
  const occurrence = await DoseOccurrence.findOne({ _id: occurrenceId, userId });
  if (!occurrence) {
    throw new AppError('Dose occurrence not found', 404);
  }

  const allowed = ValidDoseTransitions[occurrence.status];
  if (!allowed || !allowed.includes(DoseStatus.SKIPPED)) {
    throw new AppError(
      `Cannot mark dose as skipped from current status '${occurrence.status}'`,
      400
    );
  }

  occurrence.status = DoseStatus.SKIPPED;
  occurrence.recordedAt = new Date();
  if (notes !== undefined) occurrence.notes = notes;

  await occurrence.save();
  return occurrence.toJSON();
};

export const postponeDose = async (userId, occurrenceId, { minutes, postponedUntil, notes }) => {
  const occurrence = await DoseOccurrence.findOne({ _id: occurrenceId, userId });
  if (!occurrence) {
    throw new AppError('Dose occurrence not found', 404);
  }

  const allowed = ValidDoseTransitions[occurrence.status];
  if (!allowed || !allowed.includes(DoseStatus.POSTPONED)) {
    throw new AppError(
      `Cannot postpone dose from current status '${occurrence.status}'`,
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
    throw new AppError('Invalid postponed timestamp', 400);
  }

  occurrence.status = DoseStatus.POSTPONED;
  occurrence.postponedUntil = newPostponedDate;
  if (notes !== undefined) occurrence.notes = notes;

  await occurrence.save();
  return occurrence.toJSON();
};

export const getDoseHistory = async (userId, startDate, endDate) => {
  const query = {
    userId,
    status: { $in: [DoseStatus.TAKEN, DoseStatus.SKIPPED, DoseStatus.MISSED] }
  };

  if (startDate || endDate) {
    query.scheduledDateKey = {};
    if (startDate) query.scheduledDateKey.$gte = startDate;
    if (endDate) query.scheduledDateKey.$lte = endDate;
  }

  const history = await DoseOccurrence.find(query)
    .populate('doseScheduleId', 'itemName dosageDescription')
    .sort({ scheduledAt: -1 });

  return history.map((h) => h.toJSON());
};
