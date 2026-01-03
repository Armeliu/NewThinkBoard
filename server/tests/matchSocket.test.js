import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'node:http';
import mongoose from 'mongoose';
import { io as Client } from 'socket.io-client';
import app from '../src/app.js';
import env from '../src/config/env.js';
import createSocketServer from '../src/realtime/socket.js';
import User from '../src/db/models/User.js';
import Room from '../src/db/models/Room.js';
import { signToken } from '../src/utils/jwt.js';

let server;
let port;

beforeAll(async () => {
  await mongoose.connect(env.mongoUri);
  server = http.createServer(app);
  createSocketServer(server, env.clientOrigin);
  await new Promise((resolve) => {
    server.listen(0, () => {
      port = server.address().port;
      resolve();
    });
  });
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await new Promise((resolve) => server.close(resolve));
});

describe('match socket flow', () => {
  it('runs a question start and result cycle', async () => {
    const user1 = await User.create({ username: 'playerx', passwordHash: 'hash' });
    const user2 = await User.create({ username: 'playery', passwordHash: 'hash' });
    const token1 = signToken({ userId: user1._id.toString(), username: user1.username });
    const token2 = signToken({ userId: user2._id.toString(), username: user2.username });

    const client1 = new Client(`http://localhost:${port}`, { auth: { token: token1 } });
    const client2 = new Client(`http://localhost:${port}`, { auth: { token: token2 } });

    const roomCode = await new Promise((resolve) => {
      client1.emit('room:create');
      client1.on('room:state', (payload) => {
        resolve(payload.code);
      });
    });

    await new Promise((resolve) => {
      client2.emit('room:join', { code: roomCode });
      client2.on('room:state', () => resolve());
    });

    await Room.updateOne({ code: roomCode }, { $set: { 'players.$[].ready': true } });
    client1.emit('room:ready', { code: roomCode, ready: true });
    client2.emit('room:ready', { code: roomCode, ready: true });

    const question = await new Promise((resolve) => {
      client1.on('question:start', (payload) => resolve(payload));
    });

    client1.emit('match:submit', { roomCode, answer: question.question.options?.[0] || 'answer' });
    client2.emit('match:submit', { roomCode, answer: question.question.options?.[0] || 'answer' });

    const result = await new Promise((resolve) => {
      client1.on('question:result', (payload) => resolve(payload));
    });

    client1.disconnect();
    client2.disconnect();

    expect(result.awarded.length).toBe(2);
  }, 20000);
});
