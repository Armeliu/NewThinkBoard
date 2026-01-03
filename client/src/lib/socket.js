import { io } from 'socket.io-client';

let socket;

export const connectSocket = (token) => {
  if (socket) {
    socket.disconnect();
  }

  socket = io('/', {
    auth: { token },
  });

  return socket;
};

export const getSocket = () => socket;
