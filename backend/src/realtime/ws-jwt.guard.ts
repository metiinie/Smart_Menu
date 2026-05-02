import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtGuard.name);

  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const client: Socket = context.switchToWs().getClient<Socket>();
    const data = context.switchToWs().getData();
    
    // The payload of join-room is the room string itself
    const room = typeof data === 'string' ? data : data?.room;

    // Only protect admin and kitchen rooms (tenant scoped)
    // Examples: 'admin:branchId', 'kitchen:branchId', 'rest:restaurantId:kitchen:branchId'
    if (!room || (!room.includes('admin:') && !room.includes('kitchen:'))) {
      return true; // Allow public rooms (e.g. order:id) to pass without JWT
    }

    try {
      const token = client.handshake.auth?.token;
      if (!token) {
        throw new WsException('Unauthorized: Missing token');
      }

      // We explicitly pass the secret to ensure it verifies correctly against the main app secret
      const payload = this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
      
      // Store payload in socket data for subsequent operations if needed
      client.data.restaurantId = payload.restaurantId;
      client.data.branchId = payload.branchId;

      // Validate branch ID matches the room being joined
      if (payload.branchId && !room.includes(payload.branchId)) {
        this.logger.warn(`Client ${client.id} tried to join unauthorized room: ${room}`);
        client.disconnect();
        return false;
      }

      return true;
    } catch (err: any) {
      this.logger.error(`WebSocket Auth failed: ${err.message}`);
      client.disconnect();
      return false;
    }
  }
}
