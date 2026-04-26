import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as webpush from 'web-push';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {
    const publicVapidKey = process.env.VAPID_PUBLIC_KEY;
    const privateVapidKey = process.env.VAPID_PRIVATE_KEY;
    const email = process.env.VAPID_EMAIL || 'mailto:admin@arifsmart.com';

    if (publicVapidKey && privateVapidKey) {
      webpush.setVapidDetails(email, publicVapidKey, privateVapidKey);
      this.logger.log('✅ VAPID details set for Push Notifications');
    } else {
      this.logger.warn('⚠️ VAPID keys missing. Push notifications will not work.');
    }
  }

  async subscribe(customerRef: string, subscription: any) {
    return this.prisma.pushSubscription.upsert({
      where: { customerRef },
      create: {
        customerRef,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      update: {
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });
  }

  async sendNotification(customerRef: string, title: string, body: string, data?: any) {
    const sub = await this.prisma.pushSubscription.findUnique({ where: { customerRef } });
    if (!sub) return;

    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
    };

    const payload = JSON.stringify({
      notification: {
        title,
        body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        data,
      },
    });

    try {
      await webpush.sendNotification(pushSubscription, payload);
      this.logger.log(`Sent push notification to ${customerRef}`);
    } catch (error: any) {
      this.logger.error(`Failed to send push notification to ${customerRef}`, error);
      if (error?.statusCode === 410 || error?.statusCode === 404) {
        // Subscription expired or gone
        await this.prisma.pushSubscription.delete({ where: { customerRef } });
      }
    }
  }
}
