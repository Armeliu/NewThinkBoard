import Room from '../../db/models/Room.js';
import { generateRoomCode } from '../../utils/roomCode.js';

export const createRoom = async (userId) => {
  let code = generateRoomCode();
  let existing = await Room.findOne({ code });
  while (existing) {
    code = generateRoomCode();
    existing = await Room.findOne({ code });
  }

  const room = await Room.create({
    code,
    players: [{ userId, ready: false, lastSeen: new Date() }],
    status: 'OPEN',
  });

  return room;
};

export const joinRoom = async (code, userId) => {
  const room = await Room.findOne({ code });
  if (!room) {
    return { error: 'Room not found' };
  }

  if (room.players.length >= 2) {
    return { error: 'Room is full' };
  }

  const existing = room.players.find((player) => player.userId.toString() === userId);
  if (!existing) {
    room.players.push({ userId, ready: false, lastSeen: new Date() });
  }

  await room.save();
  return { room };
};

export const setReady = async (code, userId, ready) => {
  const room = await Room.findOne({ code });
  if (!room) {
    return { error: 'Room not found' };
  }

  room.players = room.players.map((player) => {
    if (player.userId.toString() === userId) {
      return { ...player.toObject(), ready };
    }
    return player;
  });

  await room.save();
  return { room };
};
