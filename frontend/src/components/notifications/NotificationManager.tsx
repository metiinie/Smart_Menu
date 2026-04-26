'use client';

import { useEffect, useState } from 'react';
import { useCartStore } from '@/stores/cartStore';
import { Bell, BellOff } from 'lucide-react';
import { notificationsApi } from '@/lib/api';

export function NotificationManager() {
  const { customerRef } = useCartStore();
  const [isSubscribed, setIsSubscribed] = useState(false);


  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {

      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    setIsSubscribed(!!subscription);
  };

  const subscribe = async () => {
    try {
      const permission = await Notification.requestPermission();

      
      if (permission !== 'granted') return;

      const registration = await navigator.serviceWorker.ready;
      
      // Get VAPID public key from env (must be public)
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        console.error('VAPID public key missing');
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      if (customerRef) {
        await notificationsApi.subscribe(customerRef, subscription);
        setIsSubscribed(true);
      }
    } catch (error) {
      console.error('Failed to subscribe to push notifications', error);
    }
  };

  if (!('Notification' in window)) return null;

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 mt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSubscribed ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
            {isSubscribed ? <Bell size={20} /> : <BellOff size={20} />}
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">Order Updates</h4>
            <p className="text-[10px] text-slate-400">
              {isSubscribed ? 'Notifications enabled' : 'Get notified when order is ready'}
            </p>
          </div>
        </div>
        {!isSubscribed && (
          <button
            onClick={subscribe}
            className="px-4 py-2 bg-brand-500 text-white text-[10px] font-bold rounded-xl shadow-lg shadow-brand-500/20"
          >
            Enable
          </button>
        )}
      </div>
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
