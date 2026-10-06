import mongoose from 'mongoose';

const foodSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    name: {
      type: String,
      required: [true, 'Food name is required'],
      trim: true,
      minlength: [1, 'Food name cannot be empty'],
      maxlength: [100, 'Food name cannot exceed 100 characters']
    },
    category: {
      type: String,
      trim: true,
      default: 'General'
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, 'Description cannot exceed 300 characters'],
      default: ''
    },
    columnOrder: {
      type: Number,
      default: 0
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

foodSchema.index({ userId: 1, active: 1, columnOrder: 1 });

export const Food = mongoose.model('Food', foodSchema);
