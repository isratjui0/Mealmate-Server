import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false // never select by default
    },
    timezone: {
      type: String,
      default: 'UTC',
      trim: true
    },
    preferences: {
      mealRemindersEnabled: {
        type: Boolean,
        default: true
      },
      doseRemindersEnabled: {
        type: Boolean,
        default: true
      },
      reminderLeadTimeMinutes: {
        type: Number,
        default: 0,
        min: 0,
        max: 60
      },
      gracePeriodMinutes: {
        type: Number,
        default: 30,
        min: 5,
        max: 180
      },
      snoozeDurationMinutes: {
        type: Number,
        default: 10,
        enum: [5, 10, 15]
      },
      notificationChannels: {
        inApp: { type: Boolean, default: true },
        browser: { type: Boolean, default: true },
        webPush: { type: Boolean, default: true }
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
        delete ret.passwordHash;
        return ret;
      }
    }
  }
);

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.statics.hashPassword = async function (plainPassword) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
};

export const User = mongoose.model('User', userSchema);
