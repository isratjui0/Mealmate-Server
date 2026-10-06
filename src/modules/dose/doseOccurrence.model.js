import mongoose from 'mongoose';
import { DoseStatus } from '../../constants/enums.js';

const doseOccurrenceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    doseScheduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DoseSchedule',
      required: [true, 'Dose schedule ID is required'],
      index: true
    },
    scheduledDateKey: {
      type: String,
      required: [true, 'Scheduled date key (YYYY-MM-DD) is required'],
      index: true
    },
    scheduledTime: {
      type: String,
      required: [true, 'Scheduled time (HH:mm) is required']
    },
    scheduledAt: {
      type: Date,
      required: [true, 'Scheduled timestamp is required'],
      index: true
    },
    status: {
      type: String,
      enum: Object.values(DoseStatus),
      default: DoseStatus.PENDING,
      index: true
    },
    recordedAt: {
      type: Date
    },
    postponedUntil: {
      type: Date
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

// Unique compound index ensuring idempotent generation per dose schedule time slot per date
doseOccurrenceSchema.index(
  { userId: 1, doseScheduleId: 1, scheduledDateKey: 1, scheduledTime: 1 },
  { unique: true }
);
doseOccurrenceSchema.index({ userId: 1, scheduledDateKey: 1 });
doseOccurrenceSchema.index({ status: 1, scheduledAt: 1 });

export const DoseOccurrence = mongoose.model('DoseOccurrence', doseOccurrenceSchema);
