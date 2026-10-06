import { z } from 'zod';
import { isValidTimeFormat, isValidDateKey } from '../../utils/dateUtils.js';

export const createMealSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Meal name is required').max(100),
    category: z.string().optional().default('custom'),
    time: z.string().refine(isValidTimeFormat, {
      message: 'Time must be in 24-hour HH:mm format'
    }),
    weekdays: z
      .array(z.number().int().min(0).max(6))
      .min(1, 'At least one weekday must be selected')
      .optional()
      .default([0, 1, 2, 3, 4, 5, 6]),
    reminderEnabled: z.boolean().optional().default(true),
    followUpEnabled: z.boolean().optional().default(true)
  })
});

export const updateMealSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid meal ID format')
  }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    category: z.string().optional(),
    time: z.string().refine(isValidTimeFormat, { message: 'Time must be in 24-hour HH:mm format' }).optional(),
    weekdays: z.array(z.number().int().min(0).max(6)).min(1).optional(),
    reminderEnabled: z.boolean().optional(),
    followUpEnabled: z.boolean().optional(),
    active: z.boolean().optional()
  })
});

export const mealIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format')
  })
});

export const getOccurrencesQuerySchema = z.object({
  query: z.object({
    date: z.string().refine(isValidDateKey, { message: 'Date must be in YYYY-MM-DD format' }).optional(),
    startDate: z.string().refine(isValidDateKey, { message: 'startDate must be in YYYY-MM-DD format' }).optional(),
    endDate: z.string().refine(isValidDateKey, { message: 'endDate must be in YYYY-MM-DD format' }).optional(),
    status: z.enum(['pending', 'completed', 'skipped', 'missed', 'postponed']).optional(),
    mealId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional()
  })
});

export const postponeOccurrenceSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid occurrence ID format')
  }),
  body: z.object({
    minutes: z.number().int().min(5).max(1440).optional(),
    postponedUntil: z.string().datetime().optional()
  }).refine((data) => data.minutes !== undefined || data.postponedUntil !== undefined, {
    message: 'Either minutes or postponedUntil ISO timestamp must be provided'
  })
});

export const snoozeOccurrenceSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid occurrence ID format')
  }),
  body: z.object({
    durationMinutes: z.enum([5, 10, 15], {
      errorMap: () => ({ message: 'Snooze duration must be 5, 10, or 15 minutes' })
    }).default(10)
  })
});

export const occurrenceActionSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid occurrence ID format')
  }),
  body: z.object({
    notes: z.string().max(500).optional()
  }).optional()
});
