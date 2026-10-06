import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters'),
    email: z.string().email('Please provide a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    timezone: z.string().optional().default('UTC'),
    preferences: z.object({
      mealRemindersEnabled: z.boolean().optional(),
      doseRemindersEnabled: z.boolean().optional(),
      reminderLeadTimeMinutes: z.number().min(0).max(60).optional(),
      gracePeriodMinutes: z.number().min(5).max(180).optional(),
      snoozeDurationMinutes: z.enum([5, 10, 15]).optional()
    }).optional()
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Please provide a valid email address'),
    password: z.string().min(1, 'Password is required')
  })
});
