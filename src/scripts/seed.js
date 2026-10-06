import { connectDB, disconnectDB } from '../config/database.js';
import { User } from '../modules/user/user.model.js';
import { Meal } from '../modules/meal/meal.model.js';
import { MealOccurrence } from '../modules/meal/mealOccurrence.model.js';
import { Food } from '../modules/food/food.model.js';
import { FoodTracking } from '../modules/food/foodTracking.model.js';
import { DoseSchedule } from '../modules/dose/doseSchedule.model.js';
import { DoseOccurrence } from '../modules/dose/doseOccurrence.model.js';
import { Notification } from '../modules/notification/notification.model.js';
import { MealStatus, DoseStatus, FoodTrackingStatus } from '../constants/enums.js';
import { getMonthDays, nowInTimezone } from '../utils/dateUtils.js';
import { logger } from '../utils/logger.js';

const DEMO_EMAIL = 'demo@mealmate.app';
const DEMO_PASSWORD = 'password123';

const runSeed = async () => {
  if (process.env.NODE_ENV === 'production') {
    logger.error('Refusing to run seed script in production environment!');
    process.exit(1);
  }

  logger.info('Starting MealMate database seeding...');
  await connectDB();

  // 1. Remove existing demo user and demo records to prevent uncontrolled duplicates
  let demoUser = await User.findOne({ email: DEMO_EMAIL });
  if (demoUser) {
    logger.info('Cleaning up existing demo user records...');
    await Promise.all([
      Meal.deleteMany({ userId: demoUser._id }),
      MealOccurrence.deleteMany({ userId: demoUser._id }),
      Food.deleteMany({ userId: demoUser._id }),
      FoodTracking.deleteMany({ userId: demoUser._id }),
      DoseSchedule.deleteMany({ userId: demoUser._id }),
      DoseOccurrence.deleteMany({ userId: demoUser._id }),
      Notification.deleteMany({ userId: demoUser._id }),
      User.deleteOne({ _id: demoUser._id })
    ]);
  }

  // 2. Create Demo User
  const passwordHash = await User.hashPassword(DEMO_PASSWORD);
  demoUser = await User.create({
    name: 'Demo User',
    email: DEMO_EMAIL,
    passwordHash,
    timezone: 'America/New_York',
    preferences: {
      mealRemindersEnabled: true,
      doseRemindersEnabled: true,
      reminderLeadTimeMinutes: 10,
      gracePeriodMinutes: 30,
      snoozeDurationMinutes: 10,
      notificationChannels: {
        inApp: true,
        browser: true,
        webPush: false
      }
    }
  });
  logger.info(`Demo user created: ${DEMO_EMAIL} (password: ${DEMO_PASSWORD})`);

  const userId = demoUser._id;

  // 3. Create Sample Meal Schedules
  const meals = await Meal.insertMany([
    {
      userId,
      name: 'Breakfast',
      category: 'breakfast',
      time: '08:30',
      weekdays: [0, 1, 2, 3, 4, 5, 6],
      reminderEnabled: true,
      followUpEnabled: true,
      active: true
    },
    {
      userId,
      name: 'Lunch',
      category: 'lunch',
      time: '13:00',
      weekdays: [1, 2, 3, 4, 5],
      reminderEnabled: true,
      followUpEnabled: true,
      active: true
    },
    {
      userId,
      name: 'Dinner',
      category: 'dinner',
      time: '19:30',
      weekdays: [0, 1, 2, 3, 4, 5, 6],
      reminderEnabled: true,
      followUpEnabled: true,
      active: true
    },
    {
      userId,
      name: 'Evening Snack',
      category: 'snack',
      time: '21:30',
      weekdays: [5, 6],
      reminderEnabled: false,
      followUpEnabled: false,
      active: true
    }
  ]);
  logger.info(`Created ${meals.length} meal schedules`);

  // 4. Create Food Items for Spreadsheet
  const foods = await Food.insertMany([
    {
      userId,
      name: 'Brown Rice',
      category: 'Carbs',
      description: '1 cup boiled',
      columnOrder: 0,
      active: true
    },
    {
      userId,
      name: 'Grilled Chicken Breast',
      category: 'Protein',
      description: '150g lean chicken',
      columnOrder: 1,
      active: true
    },
    {
      userId,
      name: 'Steamed Broccoli',
      category: 'Vegetables',
      description: 'Fresh broccoli florets',
      columnOrder: 2,
      active: true
    },
    {
      userId,
      name: 'Greek Yogurt',
      category: 'Dairy',
      description: 'Unsweetened whole milk',
      columnOrder: 3,
      active: true
    },
    {
      userId,
      name: 'Avocado',
      category: 'Healthy Fats',
      description: 'Half avocado',
      columnOrder: 4,
      active: true
    }
  ]);
  logger.info(`Created ${foods.length} food items`);

  // 5. Create Dose Schedules
  const doses = await DoseSchedule.insertMany([
    {
      userId,
      itemName: 'Multivitamin Complex',
      dosageDescription: '1 tablet with breakfast',
      times: ['08:30'],
      weekdays: [0, 1, 2, 3, 4, 5, 6],
      startDate: '2026-10-01',
      reminderEnabled: true,
      active: true
    },
    {
      userId,
      itemName: 'Omega 3 Fish Oil',
      dosageDescription: '1000mg softgel',
      times: ['13:00', '19:30'],
      weekdays: [1, 2, 3, 4, 5],
      startDate: '2026-10-01',
      reminderEnabled: true,
      active: true
    }
  ]);
  logger.info(`Created ${doses.length} dose schedules`);

  // 6. Generate historical and current food tracking data for current month
  const currentMonth = nowInTimezone('America/New_York').toFormat('yyyy-MM');
  const monthDays = getMonthDays(currentMonth, 'America/New_York');

  const foodTrackingDocs = [];
  // Populate first 15 days with sample consumed/not_consumed records
  for (let i = 0; i < Math.min(15, monthDays.length); i++) {
    const day = monthDays[i];
    // For each food, simulate realistic tracking
    for (let fIdx = 0; fIdx < foods.length; fIdx++) {
      const food = foods[fIdx];
      // Skip some to simulate unrecorded empty cells
      if ((i + fIdx) % 4 === 0) continue;

      const status = (i + fIdx) % 3 === 0 ? FoodTrackingStatus.NOT_CONSUMED : FoodTrackingStatus.CONSUMED;
      foodTrackingDocs.push({
        userId,
        foodId: food._id,
        trackingDate: day.date,
        status,
        notes: status === FoodTrackingStatus.CONSUMED ? 'Finished portion' : 'Ran out'
      });
    }
  }

  if (foodTrackingDocs.length > 0) {
    await FoodTracking.insertMany(foodTrackingDocs);
    logger.info(`Created ${foodTrackingDocs.length} food tracking records for month ${currentMonth}`);
  }

  // 7. Generate Meal and Dose Occurrences
  const { generateOccurrencesForUser } = await import('../modules/meal/meal.service.js');
  const { generateDoseOccurrencesForUser } = await import('../modules/dose/dose.service.js');

  await generateOccurrencesForUser(userId, 7);
  await generateDoseOccurrencesForUser(userId, 7);
  logger.info('Generated meal and dose occurrences for demo user');

  logger.info('Database seeding completed successfully!');
  logger.info('----------------------------------------------');
  logger.info(`Login Email:    ${DEMO_EMAIL}`);
  logger.info(`Login Password: ${DEMO_PASSWORD}`);
  logger.info('----------------------------------------------');

  await disconnectDB();
  process.exit(0);
};

runSeed().catch((err) => {
  logger.fatal({ err }, 'Seed execution failed');
  process.exit(1);
});
