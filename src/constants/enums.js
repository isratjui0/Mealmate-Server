export const MealStatus = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  SKIPPED: 'skipped',
  MISSED: 'missed',
  POSTPONED: 'postponed'
};

export const DoseStatus = {
  PENDING: 'pending',
  TAKEN: 'taken',
  SKIPPED: 'skipped',
  MISSED: 'missed',
  POSTPONED: 'postponed'
};

export const FoodTrackingStatus = {
  CONSUMED: 'consumed',
  NOT_CONSUMED: 'not_consumed'
};

export const NotificationStatus = {
  PENDING: 'pending',
  SENT: 'sent',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

export const NotificationType = {
  MEAL_REMINDER: 'meal_reminder',
  DOSE_REMINDER: 'dose_reminder',
  SNOOZE_REMINDER: 'snooze_reminder',
  MISSED_ALERT: 'missed_alert'
};

export const ValidMealTransitions = {
  [MealStatus.PENDING]: [MealStatus.COMPLETED, MealStatus.SKIPPED, MealStatus.POSTPONED, MealStatus.MISSED],
  [MealStatus.POSTPONED]: [MealStatus.COMPLETED, MealStatus.SKIPPED, MealStatus.MISSED, MealStatus.POSTPONED],
  [MealStatus.COMPLETED]: [],
  [MealStatus.SKIPPED]: [],
  [MealStatus.MISSED]: [MealStatus.COMPLETED] // allow late recording if explicit
};

export const ValidDoseTransitions = {
  [DoseStatus.PENDING]: [DoseStatus.TAKEN, DoseStatus.SKIPPED, DoseStatus.POSTPONED, DoseStatus.MISSED],
  [DoseStatus.POSTPONED]: [DoseStatus.TAKEN, DoseStatus.SKIPPED, DoseStatus.MISSED, DoseStatus.POSTPONED],
  [DoseStatus.TAKEN]: [],
  [DoseStatus.SKIPPED]: [],
  [DoseStatus.MISSED]: [DoseStatus.TAKEN] // allow late recording if explicit
};
