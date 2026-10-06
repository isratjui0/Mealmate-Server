import { z } from 'zod';
import { FoodTrackingStatus } from '../../constants/enums.js';
import { isValidDateKey } from '../../utils/dateUtils.js';

export const createFoodSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Food name cannot be empty').max(100),
    category: z.string().optional().default('General'),
    description: z.string().max(300).optional().default(''),
    columnOrder: z.number().int().optional()
  })
});

export const updateFoodSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid food ID format')
  }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    category: z.string().optional(),
    description: z.string().max(300).optional(),
    columnOrder: z.number().int().optional(),
    active: z.boolean().optional()
  })
});

export const foodIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid food ID format')
  })
});

export const reorderFoodsSchema = z.object({
  body: z.object({
    orders: z.array(
      z.object({
        id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid food ID format'),
        columnOrder: z.number().int()
      })
    ).optional(),
    foodIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).optional()
  }).refine((data) => data.orders || data.foodIds, {
    message: 'Either orders array or foodIds array must be provided'
  })
});

export const getFoodTrackingMonthlySchema = z.object({
  query: z.object({
    month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format').optional()
  })
});

export const dateParamSchema = z.object({
  params: z.object({
    date: z.string().refine(isValidDateKey, { message: 'Date must be in YYYY-MM-DD format' })
  })
});

export const updateTrackingCellSchema = z.object({
  params: z.object({
    date: z.string().refine(isValidDateKey, { message: 'Date must be in YYYY-MM-DD format' }),
    foodId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid food ID format')
  }),
  body: z.object({
    status: z.enum([FoodTrackingStatus.CONSUMED, FoodTrackingStatus.NOT_CONSUMED], {
      errorMap: () => ({ message: "Status must be 'consumed' or 'not_consumed'" })
    }),
    notes: z.string().max(300).optional().default('')
  })
});

export const deleteTrackingCellSchema = z.object({
  params: z.object({
    date: z.string().refine(isValidDateKey, { message: 'Date must be in YYYY-MM-DD format' }),
    foodId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid food ID format')
  })
});
