import { useCallback } from 'react';
import { supabase } from '../lib/supabase';

// Helper for converting the VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const subscribeToPush = useCallback(async (userId) => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Web Push not supported.');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('Push permission denied.');
        return false;
      }

      // Ensure service worker is registered
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Subscribe to PushManager
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      const subJSON = subscription.toJSON();

      // Save to Supabase
      const { error } = await supabase.from('push_subscriptions').upsert({
        user_id: userId,
        endpoint: subJSON.endpoint,
        p256dh: subJSON.keys.p256dh,
        auth: subJSON.keys.auth,
        updated_at: new Date().toISOString()
      }, { onConflict: 'endpoint' });

      if (error) {
        console.error('Error saving push subscription:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      return false;
    }
  }, []);

  return { subscribeToPush };
}
