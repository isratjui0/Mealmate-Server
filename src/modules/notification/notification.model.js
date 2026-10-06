import mongoose from 'mongoose';
import { NotificationStatus, NotificationType } from '../../constants/enums.js';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    occurrenceId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true
    },
    occurrenceType: {
      type: String,
      enum: ['MealOccurrence', 'DoseOccurrence']
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    scheduledFor: {
      type: Date,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: Object.values(NotificationStatus),
      default: NotificationStatus.PENDING,
      index: true
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    attempts: {
      type: Number,
      default: 0
    },
    lastAttemptAt: {
      type: Date
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

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
