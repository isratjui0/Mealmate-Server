import { z } from 'zod';

export const subscribePushSchema = z.object({
  body: z.object({
    endpoint: z.string().url('A valid push service URL is required'),
    keys: z.object({
      p256dh: z.string().min(1, 'p256dh key is required'),
      auth: z.string().min(1, 'auth key is required')
    })
  })
});

export const unsubscribePushSchema = z.object({
  body: z.object({
    endpoint: z.string().url('A valid push service URL is required')
  })
});

export const notificationIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid notification ID format')
  })
});

export const updateNotificationPreferencesSchema = z.object({
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
