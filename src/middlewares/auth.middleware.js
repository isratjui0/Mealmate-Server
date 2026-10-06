import jwt from 'jsonwebtoken';
import { User } from '../modules/user/user.model.js';
import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('You are not logged in. Please log in to access this resource.', 401));
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);

    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    // Attach user information to request
    req.user = currentUser;
    req.userId = currentUser._id.toString();

    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid authentication token', 401));
    }
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Authentication token has expired', 401));
    }
    next(err);
  }
};
