import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: { 
    origin: true, // true allows all origins in Socket.io
    credentials: true 
  },
  namespace: '/',
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  afterInit() {
    this.logger.log('🔌 Socket.io gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    // Auto-join rooms based on query params
    const { room } = client.handshake.query;
    if (room && typeof room === 'string') {
      client.join(room);
      this.logger.log(`Client ${client.id} joined room: ${room}`);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(client: Socket, room: string) {
    client.join(room);
    this.logger.log(`Client ${client.id} joined room: ${room}`);
  }

  @SubscribeMessage('leave-room')
  handleLeaveRoom(client: Socket, room: string) {
    client.leave(room);
    this.logger.log(`Client ${client.id} left room: ${room}`);
  }

  /** Emit to kitchen room when new order arrives */
  emitNewOrder(order: unknown) {
    this.server.emit('new-order', order);
  }

  /** Emit to order-specific room when status changes */
  emitOrderUpdated(order: { id: string; [key: string]: unknown }) {
    this.server.emit('order-updated', order);
    this.server.to(`order:${order.id}`).emit('order-updated', order);
  }
}
