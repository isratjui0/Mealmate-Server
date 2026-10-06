import mongoose from 'mongoose';
import { isValidTimeFormat, isValidDateKey } from '../../utils/dateUtils.js';

const doseScheduleSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    itemName: {
      type: String,
      required: [true, 'Dose item/medication name is required'],
      trim: true,
      maxlength: [100, 'Item name cannot exceed 100 characters']
    },
    dosageDescription: {
      type: String,
      required: [true, 'Dosage description is required (e.g. 500mg, 1 tablet)'],
      trim: true,
      maxlength: [200, 'Dosage description cannot exceed 200 characters']
    },
    times: {
      type: [String],
      required: [true, 'At least one scheduled time (HH:mm) is required'],
      validate: {
        validator: (arr) => arr.length > 0 && arr.every(isValidTimeFormat),
        message: 'Every dose time must be in 24-hour HH:mm format'
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
    startDate: {
      type: String,
      required: [true, 'Start date (YYYY-MM-DD) is required'],
      validate: {
        validator: isValidDateKey,
        message: 'startDate must be in valid YYYY-MM-DD format'
      }
    },
    endDate: {
      type: String,
      validate: {
        validator: (val) => !val || isValidDateKey(val),
        message: 'endDate must be in valid YYYY-MM-DD format'
      }
    },
    reminderEnabled: {
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

doseScheduleSchema.index({ userId: 1, active: 1 });

export const DoseSchedule = mongoose.model('DoseSchedule', doseScheduleSchema);
