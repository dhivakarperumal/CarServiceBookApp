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
        router.push(`/profile/service-status`);
      } else if (data.type === 'appointment' && data.appointmentId) {
        router.push(`/profile/service-status`);
      } else if (data.type === 'vehicle' && data.vehicleBookingId) {
        router.push(`/profile/VehicleBookings`);
      } else if (data.type === 'order' && data.orderId) {
        router.push(`/profile/orders`);
      } else if (data.type === 'employee_assignment' && data.serviceId) {
        router.push(`/(employee)/assigned`);
      } else if (data.type === 'spare_parts_status' && data.serviceId) {
        router.push(`/(employee)/assigned`);
      } else if (data.type === 'admin_order' && data.orderId) {
        router.push(`/(admin)/orders`);
      } else if (data.type === 'admin_employee_update' && data.serviceId) {
        router.push(`/(admin)/bookings`);
      } else if (data.type === 'admin_vehicle_booking' && data.vehicleBookingId) {
        router.push(`/(admin)/booked-vehicles`);
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
