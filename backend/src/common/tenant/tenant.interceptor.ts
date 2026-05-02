import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tenantStorage } from './tenant.storage';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TenantInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    // Attempt to extract restaurantId from user (set by JwtAuthGuard)
    // Fallback to a custom header for public endpoints that might resolve it differently
    const user = request.user;
    const headerRestaurantId = request.headers['x-restaurant-id'];
    
    let restaurantId = user?.restaurantId || headerRestaurantId;

    if (restaurantId) {
      // Run the request pipeline inside the tenant context
      return tenantStorage.run({ restaurantId, userId: user?.id, role: user?.role }, () => {
        return next.handle();
      });
    }

    // Run without tenant context (e.g. public platform endpoints, or SUPER_ADMIN cross-tenant calls)
    return next.handle();
  }
}
