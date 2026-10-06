import { z } from 'zod';
import { isValidTimeFormat, isValidDateKey } from '../../utils/dateUtils.js';

export const createDoseSchema = z.object({
  body: z.object({
    itemName: z.string().min(1, 'Item name is required').max(100),
    dosageDescription: z.string().min(1, 'Dosage description is required').max(200),
    times: z
      .array(z.string().refine(isValidTimeFormat, { message: 'Dose times must be in HH:mm format' }))
      .min(1, 'At least one scheduled dose time is required'),
    weekdays: z
      .array(z.number().int().min(0).max(6))
      .min(1, 'At least one weekday must be selected')
      .optional()
      .default([0, 1, 2, 3, 4, 5, 6]),
    startDate: z.string().refine(isValidDateKey, { message: 'startDate must be in YYYY-MM-DD format' }),
    endDate: z.string().refine(isValidDateKey, { message: 'endDate must be in YYYY-MM-DD format' }).optional(),
    reminderEnabled: z.boolean().optional().default(true)
  }).refine((data) => !data.endDate || data.endDate >= data.startDate, {
    message: 'endDate cannot be earlier than startDate'
  })
});

export const updateDoseSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid dose ID format')
  }),
  body: z.object({
    itemName: z.string().min(1).max(100).optional(),
    dosageDescription: z.string().min(1).max(200).optional(),
    times: z.array(z.string().refine(isValidTimeFormat)).min(1).optional(),
    weekdays: z.array(z.number().int().min(0).max(6)).min(1).optional(),
    startDate: z.string().refine(isValidDateKey).optional(),
    endDate: z.string().refine(isValidDateKey).optional(),
    reminderEnabled: z.boolean().optional(),
    active: z.boolean().optional()
  })
});

export const doseIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format')
  })
});

export const getDoseOccurrencesQuerySchema = z.object({
  query: z.object({
    date: z.string().refine(isValidDateKey).optional(),
    startDate: z.string().refine(isValidDateKey).optional(),
    endDate: z.string().refine(isValidDateKey).optional(),
    status: z.enum(['pending', 'taken', 'skipped', 'missed', 'postponed']).optional(),
    doseScheduleId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional()
  })
});

export const postponeDoseSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid occurrence ID format')
  }),
  body: z.object({
    minutes: z.number().int().min(5).max(1440).optional(),
    postponedUntil: z.string().datetime().optional(),
    notes: z.string().max(500).optional()
  }).refine((data) => data.minutes !== undefined || data.postponedUntil !== undefined, {
    message: 'Either minutes or postponedUntil ISO timestamp must be provided'
  })
});

export const doseOccurrenceActionSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid occurrence ID format')
  }),
  body: z.object({
    notes: z.string().max(500).optional()
  }).optional()
});
