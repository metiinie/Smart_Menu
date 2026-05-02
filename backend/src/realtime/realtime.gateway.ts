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
  handleCallWaiter(_client: Socket, data: { tableNumber: number; tableId: string; requestType: string }) {
    this.logger.log(`🔔 Call Waiter: Table ${data.tableNumber} — ${data.requestType}`);
    // Tenant isolation: Call waiter should be scoped to branch/restaurant
    // Broadcast to the branch admin room instead of global
    this.server.to(`kitchen:${data.tableId}`).emit('waiter-call', {
      tableNumber: data.tableNumber,
      tableId: data.tableId,
      requestType: data.requestType,
      timestamp: new Date().toISOString(),
    });
  }

  /** Emit to kitchen room when new order arrives */
  emitNewOrder(order: any, branchId?: string) {
    const restaurantId = order.restaurantId || 'legacy';
    
    if (branchId) {
      this.logger.log(`📢 REALTIME: Emitting 'new-order' to room: [rest:${restaurantId}:kitchen:${branchId}]`);
      this.server.to(`rest:${restaurantId}:kitchen:${branchId}`).emit('new-order', order);
      this.server.to(`rest:${restaurantId}:admin:${branchId}`).emit('new-order', order);
      
      // Backward compatibility during migration
      this.server.to(`kitchen:${branchId}`).emit('new-order', order);
      this.server.to(`admin:${branchId}`).emit('new-order', order);
    } else {
      this.logger.warn('⚠️ emitNewOrder called without branchId, falling back to tenant global broadcast');
      this.server.to(`rest:${restaurantId}:global`).emit('new-order', order);
    }
  }

  /** Emit to order-specific room when status changes */
  emitOrderUpdated(order: any) {
    const restaurantId = order.restaurantId || 'legacy';
    
    if (order.table?.branchId) {
      this.server.to(`rest:${restaurantId}:kitchen:${order.table.branchId}`).emit('order-updated', order);
      this.server.to(`rest:${restaurantId}:admin:${order.table.branchId}`).emit('order-updated', order);
      
      // Backward compatibility
      this.server.to(`kitchen:${order.table.branchId}`).emit('order-updated', order);
      this.server.to(`admin:${order.table.branchId}`).emit('order-updated', order);
    } else {
      this.server.to(`rest:${restaurantId}:global`).emit('order-updated', order);
    }
    
    this.server.to(`order:${order.id}`).emit('order-updated', order);
  }
}
