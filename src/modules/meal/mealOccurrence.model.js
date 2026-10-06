import mongoose from 'mongoose';
import { MealStatus } from '../../constants/enums.js';

const mealOccurrenceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    mealId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meal',
      required: [true, 'Meal ID is required'],
      index: true
    },
    scheduledDateKey: {
      type: String,
      required: [true, 'Scheduled date key (YYYY-MM-DD) is required'],
      index: true
    },
    scheduledAt: {
      type: Date,
      required: [true, 'Scheduled timestamp is required'],
      index: true
    },
    status: {
      type: String,
      enum: Object.values(MealStatus),
      default: MealStatus.PENDING,
      index: true
    },
    completedAt: {
      type: Date
    },
    postponedUntil: {
      type: Date
    },
    snoozeCount: {
      type: Number,
      default: 0
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters']
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Idempotent generation key: one occurrence per user, meal schedule, and local calendar date
mealOccurrenceSchema.index({ userId: 1, mealId: 1, scheduledDateKey: 1 }, { unique: true });
mealOccurrenceSchema.index({ userId: 1, scheduledDateKey: 1 });
mealOccurrenceSchema.index({ status: 1, scheduledAt: 1 });

export const MealOccurrence = mongoose.model('MealOccurrence', mealOccurrenceSchema);
