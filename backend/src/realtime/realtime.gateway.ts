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

  handleDisconnect(_client: Socket) {
    this.logger.log(`Client disconnected: ${_client.id}`);
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

  @SubscribeMessage('call-waiter')
  handleCallWaiter(_client: Socket, data: { tableNumber: number; tableId: string; requestType: string }) {
    this.logger.log(`🔔 Call Waiter: Table ${data.tableNumber} — ${data.requestType}`);
    // Broadcast to all connected clients (admin + kitchen)
    this.server.emit('waiter-call', {
      tableNumber: data.tableNumber,
      tableId: data.tableId,
      requestType: data.requestType,
      timestamp: new Date().toISOString(),
    });
  }

  /** Emit to kitchen room when new order arrives */
  emitNewOrder(order: any, branchId?: string) {
    if (branchId) {
      this.logger.log(`📢 Emitting new-order to rooms: kitchen:${branchId}, admin:${branchId}`);
      this.server.to(`kitchen:${branchId}`).emit('new-order', order);
      this.server.to(`admin:${branchId}`).emit('new-order', order);
    } else {
      this.logger.warn('⚠️ emitNewOrder called without branchId, falling back to global broadcast');
      this.server.emit('new-order', order);
    }
  }

  /** Emit to order-specific room when status changes */
  emitOrderUpdated(order: { id: string; table?: { branchId: string }; [key: string]: unknown }) {
    if (order.table?.branchId) {
      this.server.to(`kitchen:${order.table.branchId}`).emit('order-updated', order);
      this.server.to(`admin:${order.table.branchId}`).emit('order-updated', order);
    } else {
      this.server.emit('order-updated', order);
    }
    this.server.to(`order:${order.id}`).emit('order-updated', order);
  }
}
