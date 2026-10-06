import mongoose from 'mongoose';

const pushSubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    endpoint: {
      type: String,
      required: [true, 'Push endpoint is required'],
      trim: true
    },
    keys: {
      p256dh: {
        type: String,
        required: [true, 'p256dh key is required']
      },
      auth: {
        type: String,
        required: [true, 'auth key is required']
      }
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

pushSubscriptionSchema.index({ userId: 1, endpoint: 1 }, { unique: true });

export const PushSubscription = mongoose.model('PushSubscription', pushSubscriptionSchema);
