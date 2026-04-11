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

  const getUserIdentifiers = () => {
    const username = user?.username?.toString().toLowerCase() || '';
    const email = user?.email?.toString().toLowerCase() || '';
    const id = user?.id?.toString() || '';
    const uid = user?.uid?.toString() || '';

    return { username, email, id, uid };
  };

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

  const filterServiceItemsForUser = (items: any[], userBookings: any[]) =>
    items.filter((item) => {
      const hasBookingMatch = userBookings.some(
        (booking) =>
          booking.bookingId === item.bookingId ||
          booking.id === item.bookingId ||
          booking.booking_id === item.bookingId ||
          booking.orderId === item.orderId
      );

      return (
        hasBookingMatch ||
        item.uid === user.id ||
        item.uid === user.uid ||
        item.userId === user.id ||
        item.email?.toLowerCase() === user.email?.toLowerCase() ||
        item.customerEmail?.toLowerCase() === user.email?.toLowerCase()
      );
    });

  const checkForUpdates = async () => {
    if (!user?.id) return;

    const role = (user.role || '').toString().toLowerCase();
    const isAdmin = role === 'admin';
    const isEmployee = ['employee', 'mechanic', 'staff'].includes(role);
    const isCustomer = !isAdmin && !isEmployee;

    try {
      const allStatuses: statusTracker.CachedStatus[] = [];
      let bookingsData: any[] = [];
      let appointmentData: any[] = [];
      let vehicleData: any[] = [];
      let orderData: any[] = [];
      let servicesData: any[] = [];

      if (isCustomer || isAdmin) {
        const [bookingsRes, appointmentsRes, vehicleRes, ordersRes] = await Promise.all([
          api.get('/bookings').catch(() => ({ data: [] })),
          api.get('/appointments/my', { params: { uid: user.uid } }).catch(() => ({ data: [] })),
          api.get(`/vehicle-bookings/user/${user.id}`).catch(() => ({ data: [] })),
          api.get(`/orders/user/${user.id}`).catch(() => ({ data: [] })),
        ]);

        bookingsData = Array.isArray(bookingsRes.data)
          ? bookingsRes.data
          : bookingsRes.data?.bookings || bookingsRes.data?.data || [];

        appointmentData = Array.isArray(appointmentsRes.data)
          ? appointmentsRes.data
          : appointmentsRes.data?.appointments || appointmentsRes.data?.data || [];

        vehicleData = Array.isArray(vehicleRes.data)
          ? vehicleRes.data
          : vehicleRes.data?.vehicleBookings || vehicleRes.data?.data || [];

        orderData = Array.isArray(ordersRes.data)
          ? ordersRes.data
          : ordersRes.data?.orders || ordersRes.data?.data || [];

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
      }

      if (isCustomer || isAdmin || isEmployee) {
        const servicesRes = await api.get('/all-services').catch(() => ({ data: [] }));
        servicesData = Array.isArray(servicesRes.data)
          ? servicesRes.data
          : servicesRes.data?.services || servicesRes.data?.data || [];
      }

      if (isEmployee) {
        const { username, email, id: employeeId, uid } = getUserIdentifiers();

        servicesData
          .filter((service) => {
            const assignedId =
              service.assignedEmployeeId ||
              service.assigned_employee_id ||
              service.assigned_to ||
              service.assignedTo ||
              service.assignedEmployee?.id ||
              service.assignedEmployeeId?.toString?.();

            const assignedName =
              (service.assignedEmployeeName || service.assignedEmployee || service.assigned_employee_name || '')
                .toString()
                .toLowerCase();

            const assignedEmail =
              (service.assignedEmployeeEmail || service.assigned_email || '').toString().toLowerCase();

            const idMatch =
              assignedId?.toString() === employeeId ||
              assignedId?.toString() === uid;
            const nameMatch =
              (username && (assignedName === username || assignedName.includes(username))) ||
              (email && (assignedName === email || assignedName.includes(email)));
            const emailMatch = assignedEmail && (assignedEmail === email || assignedEmail.includes(email));

            return Boolean(idMatch || nameMatch || emailMatch);
          })
          .forEach((service: any) => {
            const status = statusTracker.createCachedServiceStatus(service, 'assignment');
            if (status) allStatuses.push(status);
          });
      }

      if (isAdmin) {
        servicesData.forEach((service: any) => {
          const status = statusTracker.createCachedServiceStatus(service, 'admin');
          if (status) allStatuses.push(status);
        });
      }

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
