import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/authStore';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3001';

let socket: Socket | null = null;

/**
 * Returns the shared Socket.io singleton.
 * Creates it on first call; reconnects if disconnected.
 * The token is attached lazily so it picks up the latest auth state.
 */
export function getSocket(): Socket {
  if (!socket) {
    console.log('[Socket] 🔌 Initializing connection to:', WS_URL);
    socket = io(WS_URL, {
      transports: ['websocket', 'polling'], // Try websocket first, then fallback to polling
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      auth: (cb) => {
        const token = useAuthStore.getState().token;
        cb({ token: token ?? '' });
      },
    });

    // Debug listener for connection failures
    socket.on('connect_error', (err) => {
      console.error(`[Socket] ❌ Connection error to ${WS_URL}:`, err.message);
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
  branchId: string;
  requestType: 'WAITER' | 'BILL' | 'HELP';
}): void {
  getSocket().emit('call-waiter', data);
}
