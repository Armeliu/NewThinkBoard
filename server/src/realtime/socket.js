import { Server } from 'socket.io';
import { z } from 'zod';
import Room from '../db/models/Room.js';
import User from '../db/models/User.js';
import { verifyToken } from '../utils/jwt.js';
import { createRoom, joinRoom, setReady } from '../features/rooms/roomService.js';
import matchEngine from './matchEngine.js';

const createSocketServer = (httpServer, clientOrigin) => {
  const io = new Server(httpServer, {
    cors: {
      origin: clientOrigin,
    },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error('Missing token'));
      }
      const payload = verifyToken(token);
      socket.data.user = { userId: payload.userId, username: payload.username };
      return next();
    } catch (error) {
      return next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const { userId } = socket.data.user;

    const existingRoom = await Room.findOne({ 'players.userId': userId });
    if (existingRoom) {
      socket.data.roomCode = existingRoom.code;
      socket.join(existingRoom.code);
      const matchState = matchEngine.getMatchState(existingRoom.code);
      if (matchState) {
        matchEngine.handleReconnect(io, matchState, userId);
        matchEngine.sendSnapshot(socket, matchState, userId);
      }
    }

    socket.on('room:create', async () => {
      const room = await createRoom(userId);
      socket.data.roomCode = room.code;
      await Room.updateOne(
        { _id: room._id, 'players.userId': userId },
        { $set: { 'players.$.socketId': socket.id } }
      );
      socket.join(room.code);
      io.to(room.code).emit('room:state', room);
    });

    socket.on('room:join', async (payload) => {
      const schema = z.object({ code: z.string().length(5) });
      const parsed = schema.safeParse(payload);
      if (!parsed.success) {
        socket.emit('room:error', { message: 'Invalid room code' });
        return;
      }

      const { room, error } = await joinRoom(parsed.data.code, userId);
      if (error) {
        socket.emit('room:error', { message: error });
        return;
      }
      socket.data.roomCode = room.code;
      await Room.updateOne(
        { _id: room._id, 'players.userId': userId },
        { $set: { 'players.$.socketId': socket.id } }
      );
      socket.join(room.code);
      io.to(room.code).emit('room:state', room);
    });

    socket.on('room:ready', async (payload) => {
      const schema = z.object({ code: z.string().length(5), ready: z.boolean() });
      const parsed = schema.safeParse(payload);
      if (!parsed.success) {
        socket.emit('room:error', { message: 'Invalid ready payload' });
        return;
      }

      const { room, error } = await setReady(parsed.data.code, userId, parsed.data.ready);
      if (error) {
        socket.emit('room:error', { message: error });
        return;
      }

      io.to(room.code).emit('room:state', room);
      const playersReady = room.players.length === 2 && room.players.every((p) => p.ready);
      if (playersReady && room.status === 'OPEN') {
        room.status = 'IN_MATCH';
        await room.save();
        const players = await Promise.all(
          room.players.map(async (player) => {
            const user = await User.findById(player.userId);
            return { userId: player.userId.toString(), username: user.username };
          })
        );
        await matchEngine.startMatch(io, room, players);
      }
    });

    socket.on('match:submit', async (payload) => {
      const schema = z.object({ roomCode: z.string().length(5), answer: z.string().min(1) });
      const parsed = schema.safeParse(payload);
      if (!parsed.success) {
        socket.emit('match:error', { message: 'Invalid submission' });
        return;
      }

      const state = matchEngine.getMatchState(parsed.data.roomCode);
      if (!state) {
        socket.emit('match:error', { message: 'Match not found' });
        return;
      }

      const result = await matchEngine.handleSubmission(
        io,
        state,
        userId,
        parsed.data.answer
      );
      if (result.error) {
        socket.emit('match:error', { message: result.error });
      }
    });

    socket.on('disconnect', () => {
      const roomCode = socket.data.roomCode;
      const room = matchEngine.getMatchState(roomCode);
      if (room) {
        matchEngine.handleDisconnect(io, room, userId);
      }
    });
  });

  return io;
};

export default createSocketServer;
