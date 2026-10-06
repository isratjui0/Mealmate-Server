import cron from 'node-cron';
import { User } from '../modules/user/user.model.js';
import { MealOccurrence } from '../modules/meal/mealOccurrence.model.js';
import { DoseOccurrence } from '../modules/dose/doseOccurrence.model.js';
import { Notification } from '../modules/notification/notification.model.js';
import {
  MealStatus,
  DoseStatus,
  NotificationStatus,
  NotificationType
} from '../constants/enums.js';
import {
  generateOccurrencesForUser,
  detectMissedMealOccurrences
} from '../modules/meal/meal.service.js';
import {
  generateDoseOccurrencesForUser,
  detectMissedDoseOccurrences
} from '../modules/dose/dose.service.js';
import { sendWebPushToUser } from './push.service.js';
import { logger } from '../utils/logger.js';

let cronTask = null;

/**
 * Execute a single cycle of schedule generation, missed detection, and reminder dispatching
 */
export const runSchedulerCycle = async () => {
  try {
    const users = await User.find({});
    const now = new Date();

    for (const user of users) {
      const userId = user._id;

      // 1. Maintain rolling occurrence generation
      await generateOccurrencesForUser(userId, 3);
      await generateDoseOccurrencesForUser(userId, 3);

      // 2. Detect missed occurrences
      await detectMissedMealOccurrences(userId);
      await detectMissedDoseOccurrences(userId);

      // 3. Process Meal Reminders
      if (user.preferences?.mealRemindersEnabled !== false) {
        const leadMinutes = user.preferences?.reminderLeadTimeMinutes || 0;
        const reminderWindow = new Date(now.getTime() + leadMinutes * 60 * 1000);

        const dueMeals = await MealOccurrence.find({
          userId,
          status: { $in: [MealStatus.PENDING, MealStatus.POSTPONED] },
          $or: [
            { status: MealStatus.PENDING, scheduledAt: { $lte: reminderWindow } },
            { status: MealStatus.POSTPONED, postponedUntil: { $lte: reminderWindow } }
          ]
        }).populate('mealId', 'name time reminderEnabled');

        for (const occ of dueMeals) {
          if (occ.mealId?.reminderEnabled === false) continue;

          // Check if notification already created
          const existingNotif = await Notification.findOne({
            userId,
            occurrenceId: occ._id
          });

          if (!existingNotif) {
            const mealName = occ.mealId?.name || 'Meal';
            const scheduledTime = occ.mealId?.time || '';
            const title = `Meal Reminder: ${mealName}`;
            const message = `It's time for your ${mealName} scheduled at ${scheduledTime}.`;

            const notif = await Notification.create({
              userId,
              occurrenceId: occ._id,
              occurrenceType: 'MealOccurrence',
              type: NotificationType.MEAL_REMINDER,
              title,
              message,
              scheduledFor: occ.postponedUntil || occ.scheduledAt,
              status: NotificationStatus.SENT,
              attempts: 1,
              lastAttemptAt: now
            });

            // Dispatch Web Push if configured and enabled
            if (user.preferences?.notificationChannels?.webPush !== false) {
              await sendWebPushToUser(userId, {
                title,
                body: message,
                data: {
                  url: '/meals',
                  occurrenceId: occ._id.toString(),
                  type: 'meal'
                }
              }).catch((err) => logger.warn({ err }, 'Web push dispatch error'));
            }
          }
        }
      }

      // 4. Process Dose Reminders
      if (user.preferences?.doseRemindersEnabled !== false) {
        const leadMinutes = user.preferences?.reminderLeadTimeMinutes || 0;
        const reminderWindow = new Date(now.getTime() + leadMinutes * 60 * 1000);

        const dueDoses = await DoseOccurrence.find({
          userId,
          status: { $in: [DoseStatus.PENDING, DoseStatus.POSTPONED] },
          $or: [
            { status: DoseStatus.PENDING, scheduledAt: { $lte: reminderWindow } },
            { status: DoseStatus.POSTPONED, postponedUntil: { $lte: reminderWindow } }
          ]
        }).populate('doseScheduleId', 'itemName dosageDescription reminderEnabled');

        for (const occ of dueDoses) {
          if (occ.doseScheduleId?.reminderEnabled === false) continue;

          const existingNotif = await Notification.findOne({
            userId,
            occurrenceId: occ._id
          });

          if (!existingNotif) {
            const itemName = occ.doseScheduleId?.itemName || 'Medication/Supplement';
            const dosage = occ.doseScheduleId?.dosageDescription || '';
            const title = `Dose Reminder: ${itemName}`;
            const message = `Time for ${itemName} (${dosage}).`;

            await Notification.create({
              userId,
              occurrenceId: occ._id,
              occurrenceType: 'DoseOccurrence',
              type: NotificationType.DOSE_REMINDER,
              title,
              message,
              scheduledFor: occ.postponedUntil || occ.scheduledAt,
              status: NotificationStatus.SENT,
              attempts: 1,
              lastAttemptAt: now
            });

            if (user.preferences?.notificationChannels?.webPush !== false) {
              await sendWebPushToUser(userId, {
                title,
                body: message,
                data: {
                  url: '/doses',
                  occurrenceId: occ._id.toString(),
                  type: 'dose'
                }
              }).catch((err) => logger.warn({ err }, 'Web push dispatch error'));
            }
          }
        }
      }
    }
  } catch (err) {
    logger.error({ err: err.message }, 'Error during background scheduler cycle');
  }
};

/**
 * Start recurring cron scheduler (runs every minute)
 */
export const startScheduler = () => {
  if (cronTask) return;

  // Run every minute
  cronTask = cron.schedule('* * * * *', async () => {
    await runSchedulerCycle();
  });

  logger.info('Background scheduler started (interval: every minute)');
};

/**
 * Stop scheduler gracefully
 */
export const stopScheduler = () => {
  if (cronTask) {
    cronTask.stop();
    cronTask = null;
    logger.info('Background scheduler stopped');
  }
};
