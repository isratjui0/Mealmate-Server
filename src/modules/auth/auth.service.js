import jwt from 'jsonwebtoken';
import { User } from '../user/user.model.js';
import { AppError } from '../../utils/AppError.js';
import { env } from '../../config/env.js';

export const signToken = (id) => {
  return jwt.sign({ id }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN
  });
};

export const registerUser = async ({ name, email, password, timezone, preferences }) => {
  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new AppError('An account with this email address already exists', 409, [
      { field: 'email', message: 'Email is already in use' }
    ]);
  }

  const passwordHash = await User.hashPassword(password);

  const newUser = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    timezone: timezone || 'UTC',
    preferences: preferences || {}
  });

  const token = signToken(newUser._id);

  return {
    user: newUser.toJSON(),
    token
  };
};

export const loginUser = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = signToken(user._id);

  return {
    user: user.toJSON(),
    token
  };
};
