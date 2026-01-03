import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import env from '../src/config/env.js';

beforeAll(async () => {
  if (!env.mongoUri) {
    throw new Error('MONGODB_URI not set');
  }
  await mongoose.connect(env.mongoUri);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe('auth', () => {
  it('registers and logs in', async () => {
    const register = await request(app).post('/api/auth/register').send({
      username: 'player1',
      password: 'password123',
    });
    expect(register.status).toBe(201);
    expect(register.body.token).toBeTruthy();

    const login = await request(app).post('/api/auth/login').send({
      username: 'player1',
      password: 'password123',
    });
    expect(login.status).toBe(200);
    expect(login.body.token).toBeTruthy();
  });
});
