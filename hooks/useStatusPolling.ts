import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import * as statusTracker from '../services/statusTracker';

const POLLING_INTERVAL = 5 * 60 * 1000; // 5 minutes

/**
 * Hook to periodically check for status updates and send notifications
 * Call this in your main app layout or any component that should always run
 */
export const useStatusPolling = () => {
  const { user } = useAuth() as any;
  const pollingInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkForUpdates = async () => {
    if (!user?.id) return;

    try {
      const [bookingsRes, appointmentsRes, vehicleRes, ordersRes] = await Promise.all([
        api.get("/bookings").catch(() => ({ data: [] })),
        api.get("/appointments/my", { params: { uid: user.uid } }).catch(() => ({ data: [] })),
        api.get(`/vehicle-bookings/user/${user.id}`).catch(() => ({ data: [] })),
        api.get(`/orders/user/${user.id}`).catch(() => ({ data: [] })),
      ]);

      const bookingsData = Array.isArray(bookingsRes.data)
        ? bookingsRes.data
        : bookingsRes.data?.bookings || bookingsRes.data?.data || [];

      const appointmentData = Array.isArray(appointmentsRes.data)
        ? appointmentsRes.data
        : appointmentsRes.data?.appointments || appointmentsRes.data?.data || [];

      const vehicleData = Array.isArray(vehicleRes.data)
        ? vehicleRes.data
        : vehicleRes.data?.vehicleBookings || vehicleRes.data?.data || [];

      const orderData = Array.isArray(ordersRes.data)
        ? ordersRes.data
        : ordersRes.data?.orders || ordersRes.data?.data || [];

      // Filter data for current user
      const filterByUser = (items: any[]) =>
        items.filter(
          (item) =>
            item.user_id === user.id ||
            item.userId === user.id ||
            item.uid === user.id ||
            item.uid === user.uid ||
            item.email?.toLowerCase() === user.email?.toLowerCase() ||
            item.customerEmail?.toLowerCase() === user.email?.toLowerCase()
        );

      const allStatuses: statusTracker.CachedStatus[] = [];

      filterByUser(bookingsData).forEach((item: any) => {
        allStatuses.push(statusTracker.createCachedStatus(item, 'booking'));
      });

      filterByUser(appointmentData).forEach((item: any) => {
        allStatuses.push(statusTracker.createCachedStatus(item, 'appointment'));
      });

      filterByUser(vehicleData).forEach((item: any) => {
        allStatuses.push(statusTracker.createCachedStatus(item, 'vehicle'));
      });

      filterByUser(orderData).forEach((item: any) => {
        allStatuses.push(statusTracker.createCachedStatus(item, 'order'));
      });

      // Check for changes and send notifications
      await statusTracker.checkStatusChanges(allStatuses);
    } catch (error) {
      console.error('Error checking for status updates:', error);
    }
  };

  useEffect(() => {
    if (!user?.id) {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
        pollingInterval.current = null;
      }
      return;
    }

    // Check immediately on mount
    checkForUpdates();

    // Then check periodically
    pollingInterval.current = setInterval(checkForUpdates, POLLING_INTERVAL);

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
        pollingInterval.current = null;
      }
    };
  }, [user?.id]);
};
