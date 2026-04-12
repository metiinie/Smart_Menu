import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3001';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
  } else if (!socket.connected) {
    socket.connect();
  }
  return socket;
}

export function joinRoom(room: string) {
  const s = getSocket();
  s.emit('join-room', room);
}

export function leaveRoom(room: string) {
  if (socket) {
    socket.emit('leave-room', room);
  }
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
