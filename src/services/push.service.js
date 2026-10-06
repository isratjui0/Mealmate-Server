import webpush from 'web-push';
import { PushSubscription } from '../modules/notification/pushSubscription.model.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

let isPushConfigured = false;

if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY && env.VAPID_SUBJECT) {
  try {
    webpush.setVapidDetails(
      env.VAPID_SUBJECT,
      env.VAPID_PUBLIC_KEY,
      env.VAPID_PRIVATE_KEY
    );
    isPushConfigured = true;
    logger.info('Web Push VAPID configuration initialized successfully');
  } catch (err) {
    logger.warn({ err: err.message }, 'Failed to initialize Web Push VAPID keys');
  }
} else {
  logger.info('Web Push VAPID keys not provided; in-app notifications will operate standalone');
}

/**
 * Send Web Push notification to all active devices of a user
 */
export const sendWebPushToUser = async (userId, payload) => {
  if (!isPushConfigured) {
    return { sent: 0, failed: 0, reason: 'VAPID not configured' };
  }

  const subscriptions = await PushSubscription.find({ userId });
  if (subscriptions.length === 0) {
    return { sent: 0, failed: 0, reason: 'No subscriptions found' };
  }

  let sent = 0;
  let failed = 0;

  const payloadString = JSON.stringify(payload);

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: sub.keys
        },
        payloadString
      );
      sent++;
    } catch (err) {
      failed++;
      logger.warn({ err: err.message, endpoint: sub.endpoint }, 'Push notification send error');
      // If subscription has expired or is invalid (HTTP 410 or 404), remove it
      if (err.statusCode === 410 || err.statusCode === 404) {
        await PushSubscription.deleteOne({ _id: sub._id });
        logger.info({ endpoint: sub.endpoint }, 'Removed expired push subscription');
      }
    }
  }

  return { sent, failed };
};
