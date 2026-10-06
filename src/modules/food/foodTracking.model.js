import mongoose from 'mongoose';
import { FoodTrackingStatus } from '../../constants/enums.js';
import { isValidDateKey } from '../../utils/dateUtils.js';

const foodTrackingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    foodId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Food',
      required: [true, 'Food ID is required'],
      index: true
    },
    trackingDate: {
      type: String,
      required: [true, 'Tracking date (YYYY-MM-DD) is required'],
      validate: {
        validator: isValidDateKey,
        message: 'trackingDate must be in valid YYYY-MM-DD format'
      },
      index: true
    },
    status: {
      type: String,
      enum: Object.values(FoodTrackingStatus),
      required: [true, 'Status is required']
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [300, 'Notes cannot exceed 300 characters'],
      default: ''
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

// Unique compound index for atomic cell upserts
foodTrackingSchema.index({ userId: 1, foodId: 1, trackingDate: 1 }, { unique: true });
foodTrackingSchema.index({ userId: 1, trackingDate: 1 });

export const FoodTracking = mongoose.model('FoodTracking', foodTrackingSchema);
