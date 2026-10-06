import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidTimeFormat,
  isValidDateKey,
  getMonthDays,
  getStandardWeekday,
  createScheduledDate,
  nowInTimezone
} from '../../src/utils/dateUtils.js';
import { escapeCsvField, generateCsv } from '../../src/utils/csv.js';
import {
  MealStatus,
  DoseStatus,
  FoodTrackingStatus,
  ValidMealTransitions,
  ValidDoseTransitions
} from '../../src/constants/enums.js';
import { registerSchema, loginSchema } from '../../src/modules/auth/auth.validation.js';
import { createMealSchema } from '../../src/modules/meal/meal.validation.js';
import { createFoodSchema, updateTrackingCellSchema } from '../../src/modules/food/food.validation.js';
import { createDoseSchema } from '../../src/modules/dose/dose.validation.js';

test('Unit Tests — Date & Timezone Utilities', async (t) => {
  await t.test('isValidTimeFormat correctly validates 24-hour HH:mm time strings', () => {
    assert.equal(isValidTimeFormat('00:00'), true);
    assert.equal(isValidTimeFormat('08:30'), true);
    assert.equal(isValidTimeFormat('23:59'), true);
    assert.equal(isValidTimeFormat('12:00'), true);

    // Invalid formats
    assert.equal(isValidTimeFormat('24:00'), false);
    assert.equal(isValidTimeFormat('8:30'), false);
    assert.equal(isValidTimeFormat('08:60'), false);
    assert.equal(isValidTimeFormat('12:0'), false);
    assert.equal(isValidTimeFormat('invalid'), false);
    assert.equal(isValidTimeFormat(''), false);
  });

  await t.test('isValidDateKey validates YYYY-MM-DD calendar dates', () => {
    assert.equal(isValidDateKey('2026-10-04'), true);
    assert.equal(isValidDateKey('2026-02-28'), true);

    // Invalid dates
    assert.equal(isValidDateKey('2026-02-30'), false);
    assert.equal(isValidDateKey('2026-13-01'), false);
    assert.equal(isValidDateKey('04-10-2026'), false);
    assert.equal(isValidDateKey('not-a-date'), false);
  });

  await t.test('getMonthDays returns complete month calendar days and weekdays', () => {
    const octDays = getMonthDays('2026-10', 'UTC');
    assert.equal(octDays.length, 31);
    assert.equal(octDays[0].date, '2026-10-01');
    assert.equal(octDays[0].dayNumber, 1);
    assert.equal(octDays[30].date, '2026-10-31');
    assert.equal(octDays[30].dayNumber, 31);

    // Check invalid month format throws error
    assert.throws(() => getMonthDays('invalid-month'), /Invalid month format/);
  });

  await t.test('createScheduledDate combines dateKey, time, and timezone into UTC Date', () => {
    const dt = createScheduledDate('2026-10-04', '08:30', 'UTC');
    assert.ok(dt instanceof Date);
    assert.equal(dt.toISOString(), '2026-10-04T08:30:00.000Z');
  });
});

test('Unit Tests — CSV Escaping and Generation', async (t) => {
  await t.test('escapeCsvField handles quotes, commas, newlines, and nulls', () => {
    assert.equal(escapeCsvField('normal text'), 'normal text');
    assert.equal(escapeCsvField('hello, world'), '"hello, world"');
    assert.equal(escapeCsvField('say "hello"'), '"say ""hello"""');
    assert.equal(escapeCsvField('line 1\nline 2'), '"line 1\nline 2"');
    assert.equal(escapeCsvField(null), '');
    assert.equal(escapeCsvField(undefined), '');
    assert.equal(escapeCsvField(42), '42');
  });

  await t.test('generateCsv formats columns and rows into RFC compliant CSV', () => {
    const columns = [
      { key: 'date', label: 'Date' },
      { key: 'name', label: 'Item Name' },
      { key: 'status', label: 'Status' }
    ];
    const rows = [
      { date: '2026-10-04', name: 'Eggs, Scrambled', status: 'consumed' },
      { date: '2026-10-05', name: 'Oatmeal', status: 'not_consumed' }
    ];

    const csv = generateCsv(columns, rows);
    const lines = csv.split('\r\n');

    assert.equal(lines[0], 'Date,Item Name,Status');
    assert.equal(lines[1], '2026-10-04,"Eggs, Scrambled",consumed');
    assert.equal(lines[2], '2026-10-05,Oatmeal,not_consumed');
  });
});

test('Unit Tests — System Status Enums & State Machine Transitions', async (t) => {
  await t.test('Meal status transitions strictly conform to requirements', () => {
    // Pending can transition to completed, skipped, postponed, missed
    assert.ok(ValidMealTransitions[MealStatus.PENDING].includes(MealStatus.COMPLETED));
    assert.ok(ValidMealTransitions[MealStatus.PENDING].includes(MealStatus.SKIPPED));
    assert.ok(ValidMealTransitions[MealStatus.PENDING].includes(MealStatus.POSTPONED));
    assert.ok(ValidMealTransitions[MealStatus.PENDING].includes(MealStatus.MISSED));

    // Postponed can transition to completed, skipped, missed
    assert.ok(ValidMealTransitions[MealStatus.POSTPONED].includes(MealStatus.COMPLETED));
    assert.ok(ValidMealTransitions[MealStatus.POSTPONED].includes(MealStatus.SKIPPED));
    assert.ok(ValidMealTransitions[MealStatus.POSTPONED].includes(MealStatus.MISSED));

    // Completed and skipped are terminal
    assert.equal(ValidMealTransitions[MealStatus.COMPLETED].length, 0);
    assert.equal(ValidMealTransitions[MealStatus.SKIPPED].length, 0);
  });

  await t.test('Dose status transitions strictly conform to requirements', () => {
    assert.ok(ValidDoseTransitions[DoseStatus.PENDING].includes(DoseStatus.TAKEN));
    assert.ok(ValidDoseTransitions[DoseStatus.PENDING].includes(DoseStatus.SKIPPED));
    assert.ok(ValidDoseTransitions[DoseStatus.PENDING].includes(DoseStatus.POSTPONED));
    assert.ok(ValidDoseTransitions[DoseStatus.PENDING].includes(DoseStatus.MISSED));

    // Taken and skipped are terminal
    assert.equal(ValidDoseTransitions[DoseStatus.TAKEN].length, 0);
    assert.equal(ValidDoseTransitions[DoseStatus.SKIPPED].length, 0);
  });
});

test('Unit Tests — Zod Request Validation Schemas', async (t) => {
  await t.test('registerSchema validates valid registration payload', () => {
    const valid = registerSchema.safeParse({
      body: {
        name: 'Sarah Connor',
        email: 'sarah@resistance.org',
        password: 'terminator_hunter',
        timezone: 'America/Los_Angeles'
      }
    });
    assert.equal(valid.success, true);

    const invalidEmail = registerSchema.safeParse({
      body: {
        name: 'Sarah',
        email: 'not-an-email',
        password: 'short'
      }
    });
    assert.equal(invalidEmail.success, false);
  });

  await t.test('createMealSchema enforces 24-hr time and weekday bounds', () => {
    const valid = createMealSchema.safeParse({
      body: {
        name: 'Dinner',
        time: '19:45',
        weekdays: [1, 2, 3, 4, 5]
      }
    });
    assert.equal(valid.success, true);

    const invalidTime = createMealSchema.safeParse({
      body: {
        name: 'Dinner',
        time: '7:45 PM'
      }
    });
    assert.equal(invalidTime.success, false);
  });

  await t.test('updateTrackingCellSchema accepts only consumed and not_consumed', () => {
    const validConsumed = updateTrackingCellSchema.safeParse({
      params: { date: '2026-10-04', foodId: '507f1f77bcf86cd799439011' },
      body: { status: 'consumed' }
    });
    assert.equal(validConsumed.success, true);

    const validNotConsumed = updateTrackingCellSchema.safeParse({
      params: { date: '2026-10-04', foodId: '507f1f77bcf86cd799439011' },
      body: { status: 'not_consumed' }
    });
    assert.equal(validNotConsumed.success, true);

    const invalidStatus = updateTrackingCellSchema.safeParse({
      params: { date: '2026-10-04', foodId: '507f1f77bcf86cd799439011' },
      body: { status: 'maybe' }
    });
    assert.equal(invalidStatus.success, false);
  });

  await t.test('createDoseSchema enforces date boundaries and time formats', () => {
    const valid = createDoseSchema.safeParse({
      body: {
        itemName: 'Iron 65mg',
        dosageDescription: '1 tablet with orange juice',
        times: ['08:00', '20:00'],
        startDate: '2026-10-01',
        endDate: '2026-10-31'
      }
    });
    assert.equal(valid.success, true);

    const invalidDates = createDoseSchema.safeParse({
      body: {
        itemName: 'Iron 65mg',
        dosageDescription: '1 tablet',
        times: ['08:00'],
        startDate: '2026-10-31',
        endDate: '2026-10-01' // earlier than startDate
      }
    });
    assert.equal(invalidDates.success, false);
  });
});
