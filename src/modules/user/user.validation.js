import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    timezone: z.string().optional()
  })
});

export const updatePreferencesSchema = z.object({
  body: z.object({
    mealRemindersEnabled: z.boolean().optional(),
    doseRemindersEnabled: z.boolean().optional(),
    reminderLeadTimeMinutes: z.number().min(0).max(60).optional(),
    gracePeriodMinutes: z.number().min(5).max(180).optional(),
    snoozeDurationMinutes: z.enum([5, 10, 15]).optional(),
    notificationChannels: z.object({
      inApp: z.boolean().optional(),
      browser: z.boolean().optional(),
      webPush: z.boolean().optional()
    }).optional()
  })
});
