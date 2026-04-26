import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3001';

let socket: Socket | null = null;

/**
 * Returns the shared Socket.io singleton.
 * Creates it on first call; reconnects if disconnected.
 * The token is attached lazily so it picks up the latest auth state.
 */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,   // keep trying forever — kitchen screens must stay live
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10_000,
      auth: (cb) => {
        // Lazily attach the JWT token on every connect/reconnect attempt
        const token =
          typeof window !== 'undefined'
            ? localStorage.getItem('arifsmart_token')
            : null;
        cb({ token: token ?? '' });
      },
    });
  } else if (!socket.connected) {
    socket.connect();
  }
  return socket;
}

/** Join a named room on the server. */
export function joinRoom(room: string): void {
  if (!room) return;
  getSocket().emit('join-room', room);
}

/** Leave a named room on the server. */
export function leaveRoom(room: string): void {
  if (socket && room) {
    socket.emit('leave-room', room);
  }
}

/** Cleanly disconnect and destroy the singleton (call on full logout). */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/** Emit a waiter/bill/help call from the customer table. */
export function callWaiter(data: {
  tableNumber: number;
  tableId: string;
  requestType: 'WAITER' | 'BILL' | 'HELP';
}): void {
  getSocket().emit('call-waiter', data);
}
