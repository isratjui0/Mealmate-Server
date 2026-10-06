import { app } from '../src/app.js';
import mongoose from 'mongoose';

let server = null;
let baseUrl = '';

export const startTestServer = async () => {
  if (server) return baseUrl;

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}/api`;
      resolve();
    });
  });

  return baseUrl;
};

export const stopTestServer = async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
    server = null;
  }
};

export const apiRequest = async (endpoint, { method = 'GET', body, token, headers = {} } = {}) => {
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const reqHeaders = {
    'Content-Type': 'application/json',
    ...headers
  };

  if (token) {
    reqHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers: reqHeaders,
    body: body ? JSON.stringify(body) : undefined
  });

  const contentType = response.headers.get('content-type') || '';
  let data;
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  return {
    status: response.status,
    headers: response.headers,
    body: data
  };
};

export const clearCollections = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};
