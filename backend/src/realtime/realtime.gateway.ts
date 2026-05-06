import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { WsJwtGuard } from './ws-jwt.guard';

@WebSocketGateway({
  cors: { 
    origin: true,
    credentials: true,
    methods: ['GET', 'POST'],
  },
  namespace: '/',
  allowEIO3: true,
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
    this.logger.debug(`Handshake Query: ${JSON.stringify(client.handshake.query)}`);
    this.logger.debug(`Handshake Auth: ${JSON.stringify(client.handshake.auth)}`);
    
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

  @UseGuards(WsJwtGuard)
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
  handleCallWaiter(_client: Socket, data: { tableNumber: number; tableId: string; branchId: string; requestType: string }) {
    this.logger.log(`🔔 Call Waiter: Branch ${data.branchId} Table ${data.tableNumber} — ${data.requestType}`);
    
    // Broadcast to staff and admin rooms for this branch
    const payload = {
      tableNumber: data.tableNumber,
      tableId: data.tableId,
      branchId: data.branchId,
      requestType: data.requestType,
      timestamp: new Date().toISOString(),
    };

    this.server.to(`staff:${data.branchId}`).emit('waiter-call', payload);
    this.server.to(`admin:${data.branchId}`).emit('waiter-call', payload);
    
    // Also support tenant-namespaced rooms if present
    this.server.to(`rest:any:staff:${data.branchId}`).emit('waiter-call', payload);
  }

  /** Emit to kitchen and staff rooms when new order arrives */
  emitNewOrder(order: any, branchId?: string) {
    const restaurantId = order.restaurantId || 'any';
    
    if (branchId) {
      this.logger.log(`📢 REALTIME: Emitting 'new-order' to room: [rest:${restaurantId}:kitchen:${branchId}]`);
      
      const rooms = [
        `rest:${restaurantId}:kitchen:${branchId}`,
        `kitchen:${branchId}`,
      ];

      rooms.forEach(room => this.server.to(room).emit('new-order', order));
    } else {
      this.logger.warn('⚠️ emitNewOrder called without branchId, falling back to tenant global broadcast');
      this.server.to(`rest:${restaurantId}:global`).emit('new-order', order);
    }
  }

  /** Emit to order-specific room and staff/kitchen when status changes */
  emitOrderUpdated(order: any) {
    const restaurantId = order.restaurantId || 'any';
    const bId = order.table?.branchId;
    
    if (bId) {
      const rooms = [
        `rest:${restaurantId}:kitchen:${bId}`,
        `rest:${restaurantId}:admin:${bId}`,
        `rest:${restaurantId}:staff:${bId}`,
        `kitchen:${bId}`,
        `admin:${bId}`,
        `staff:${bId}`,
      ];

      rooms.forEach(room => this.server.to(room).emit('order-updated', order));
    } else {
      this.server.to(`rest:${restaurantId}:global`).emit('order-updated', order);
    }
    
    this.server.to(`order:${order.id}`).emit('order-updated', order);
  }
}
