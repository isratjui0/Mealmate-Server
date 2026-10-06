export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'MealMate API Documentation',
    version: '1.0.0',
    description:
      'REST API for MealMate — Meal Reminder, Food Tracking & Dose Management System. Strictly adheres to the MealMate SRS specification.'
  },
  servers: [
    {
      url: '/api',
      description: 'API Base URL'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token in the format Bearer <token>'
      }
    },
    schemas: {
      StandardResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Operation completed successfully' },
          data: { type: 'object' }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Validation failed' },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string', example: 'email' },
                message: { type: 'string', example: 'Please provide a valid email address' }
              }
            }
          }
        }
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string', example: 'John Doe' },
          email: { type: 'string', example: 'john@example.com' },
          timezone: { type: 'string', example: 'America/New_York' },
          preferences: { type: 'object' }
        }
      },
      Meal: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string', example: 'Breakfast' },
          category: { type: 'string', example: 'breakfast' },
          time: { type: 'string', example: '08:00' },
          weekdays: { type: 'array', items: { type: 'integer' }, example: [0, 1, 2, 3, 4, 5, 6] },
          reminderEnabled: { type: 'boolean', example: true },
          active: { type: 'boolean', example: true }
        }
      },
      MealOccurrence: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          mealId: { type: 'string' },
          scheduledDateKey: { type: 'string', example: '2026-10-04' },
          scheduledAt: { type: 'string', format: 'date-time' },
          status: {
            type: 'string',
            enum: ['pending', 'completed', 'skipped', 'missed', 'postponed']
          },
          completedAt: { type: 'string', format: 'date-time' },
          postponedUntil: { type: 'string', format: 'date-time' }
        }
      },
      Food: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string', example: 'Rice' },
          category: { type: 'string', example: 'Carbs' },
          columnOrder: { type: 'integer', example: 0 },
          active: { type: 'boolean', example: true }
        }
      },
      DoseSchedule: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          itemName: { type: 'string', example: 'Vitamin D3' },
          dosageDescription: { type: 'string', example: '1000 IU' },
          times: { type: 'array', items: { type: 'string' }, example: ['09:00', '21:00'] },
          weekdays: { type: 'array', items: { type: 'integer' } },
          startDate: { type: 'string', example: '2026-10-01' },
          active: { type: 'boolean', example: true }
        }
      }
    }
  },
  paths: {
    '/health': {
      get: {
        summary: 'Application Health Check',
        responses: {
          200: { description: 'Server and database status' }
        }
      }
    },
    '/auth/register': {
      post: {
        summary: 'Register a new user account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'Jane Doe' },
                  email: { type: 'string', example: 'jane@example.com' },
                  password: { type: 'string', example: 'secret123' },
                  timezone: { type: 'string', example: 'UTC' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Registration successful, returns token and safe user object' },
          400: { description: 'Validation failed' },
          409: { description: 'Email already exists' }
        }
      }
    },
    '/auth/login': {
      post: {
        summary: 'Log in with credentials',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'jane@example.com' },
                  password: { type: 'string', example: 'secret123' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Login successful' },
          401: { description: 'Invalid credentials' }
        }
      }
    },
    '/auth/me': {
      get: {
        summary: 'Get current authenticated user profile',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'User profile retrieved' },
          401: { description: 'Unauthorized' }
        }
      }
    },
    '/meals': {
      get: {
        summary: 'Get all meal schedules for user',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'List of meal schedules' } }
      },
      post: {
        summary: 'Create a new meal schedule',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'time'],
                properties: {
                  name: { type: 'string', example: 'Breakfast' },
                  category: { type: 'string', example: 'breakfast' },
                  time: { type: 'string', example: '08:30' },
                  weekdays: { type: 'array', items: { type: 'integer' }, example: [0, 1, 2, 3, 4, 5, 6] }
                }
              }
            }
          }
        },
        responses: { 201: { description: 'Meal schedule created' } }
      }
    },
    '/meal-occurrences': {
      get: {
        summary: 'Get meal occurrences (supports date, status, mealId filters)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'date', in: 'query', schema: { type: 'string', example: '2026-10-04' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'completed', 'skipped', 'missed', 'postponed'] } }
        ],
        responses: { 200: { description: 'Occurrences list' } }
      }
    },
    '/meal-occurrences/{id}/complete': {
      patch: {
        summary: 'Mark meal occurrence as completed',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Meal marked completed' } }
      }
    },
    '/meal-occurrences/{id}/skip': {
      patch: {
        summary: 'Mark meal occurrence as skipped',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Meal marked skipped' } }
      }
    },
    '/meal-occurrences/{id}/postpone': {
      patch: {
        summary: 'Postpone meal occurrence',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  minutes: { type: 'integer', example: 30 },
                  postponedUntil: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        responses: { 200: { description: 'Meal postponed' } }
      }
    },
    '/foods': {
      get: {
        summary: 'Get foods columns in ordered sequence',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'List of foods' } }
      },
      post: {
        summary: 'Add a new food item',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', example: 'Oatmeal' },
                  category: { type: 'string', example: 'Grains' }
                }
              }
            }
          }
        },
        responses: { 201: { description: 'Food created' } }
      }
    },
    '/food-tracking': {
      get: {
        summary: 'Get spreadsheet matrix food tracking for a month',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'month', in: 'query', schema: { type: 'string', example: '2026-10' } }
        ],
        responses: { 200: { description: 'Spreadsheet food tracking data' } }
      }
    },
    '/food-tracking/{date}/{foodId}': {
      put: {
        summary: 'Atomic upsert for daily food tracking cell',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'date', in: 'path', required: true, schema: { type: 'string', example: '2026-10-04' } },
          { name: 'foodId', in: 'path', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['consumed', 'not_consumed'] },
                  notes: { type: 'string' }
                }
              }
            }
          }
        },
        responses: { 200: { description: 'Cell updated' } }
      },
      delete: {
        summary: 'Clear food tracking cell (reverts to unrecorded)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'date', in: 'path', required: true, schema: { type: 'string', example: '2026-10-04' } },
          { name: 'foodId', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: { 200: { description: 'Cell cleared' } }
      }
    },
    '/doses': {
      get: {
        summary: 'Get all dose schedules',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'List of dose schedules' } }
      },
      post: {
        summary: 'Create a dose schedule',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['itemName', 'dosageDescription', 'times', 'startDate'],
                properties: {
                  itemName: { type: 'string', example: 'Omega 3' },
                  dosageDescription: { type: 'string', example: '1000mg capsule' },
                  times: { type: 'array', items: { type: 'string' }, example: ['08:00', '20:00'] },
                  startDate: { type: 'string', example: '2026-10-01' }
                }
              }
            }
          }
        },
        responses: { 201: { description: 'Dose schedule created' } }
      }
    },
    '/analytics/dashboard': {
      get: {
        summary: 'Get aggregated dashboard metrics for today',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Dashboard metrics' } }
      }
    },
    '/export/food-tracking': {
      get: {
        summary: 'Export food tracking history as CSV',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'CSV file download' } }
      }
    }
  }
};
