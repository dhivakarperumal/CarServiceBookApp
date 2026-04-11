import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

export const useNotifications = () => {
  const router = useRouter();
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => {
    // Listen for notifications when app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
    });

    // Listen for user interaction with notification (tapping on it)
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const { notification } = response;
      const data = notification.request.content.data;

      console.log('Notification response:', data);

      // Navigate based on notification type
      if (data.type === 'booking' && data.bookingId) {
        router.push(`/(tabs)/booking`);
      } else if (data.type === 'appointment' && data.appointmentId) {
        router.push(`/(adminPages)/add-appointment`);
      } else if (data.type === 'vehicle' && data.vehicleBookingId) {
        router.push(`/(tabs)/vehicles`);
      } else if (data.type === 'order' && data.orderId) {
        router.push(`/(tabs)/products`);
      }
    });

    // Cleanup listeners
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove?.();
      }
      if (responseListener.current) {
        responseListener.current.remove?.();
      }
    };
  }, [router]);
};
