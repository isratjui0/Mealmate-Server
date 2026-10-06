import mongoose from 'mongoose';
import { isValidTimeFormat } from '../../utils/dateUtils.js';

const mealSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    name: {
      type: String,
      required: [true, 'Meal name is required'],
      trim: true,
      maxlength: [100, 'Meal name cannot exceed 100 characters']
    },
    category: {
      type: String,
      trim: true,
      default: 'custom'
    },
    time: {
      type: String,
      required: [true, 'Meal time is required (HH:mm)'],
      validate: {
        validator: isValidTimeFormat,
        message: 'Meal time must be in 24-hour HH:mm format'
      }
    },
    weekdays: {
      type: [Number],
      default: [0, 1, 2, 3, 4, 5, 6],
      validate: {
        validator: (arr) => arr.length > 0 && arr.every((d) => Number.isInteger(d) && d >= 0 && d <= 6),
        message: 'Weekdays must contain numbers between 0 (Sunday) and 6 (Saturday)'
      }
    },
    reminderEnabled: {
      type: Boolean,
      default: true
    },
    followUpEnabled: {
      type: Boolean,
      default: true
    },
    active: {
      type: Boolean,
      default: true
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

mealSchema.index({ userId: 1, active: 1 });

export const Meal = mongoose.model('Meal', mealSchema);
