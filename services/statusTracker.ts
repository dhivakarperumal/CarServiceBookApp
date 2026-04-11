import AsyncStorage from '@react-native-async-storage/async-storage';
import * as notificationService from './notificationService';

const STATUS_CACHE_KEY = '@booking_statuses_cache';

export interface CachedStatus {
  bookingId: string | number;
  type: 'booking' | 'appointment' | 'vehicle' | 'order';
  status: string;
}

// ✅ Get cached statuses
export const getCachedStatuses = async (): Promise<CachedStatus[]> => {
  try {
    const cached = await AsyncStorage.getItem(STATUS_CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  } catch (error) {
    console.error('Error reading cached statuses:', error);
    return [];
  }
};

// ✅ Save statuses to cache
export const saveCachedStatuses = async (statuses: CachedStatus[]) => {
  try {
    await AsyncStorage.setItem(STATUS_CACHE_KEY, JSON.stringify(statuses));
  } catch (error) {
    console.error('Error saving cached statuses:', error);
  }
};

// ✅ Check for status changes and send notifications
export const checkStatusChanges = async (newStatuses: CachedStatus[]) => {
  try {
    const cachedStatuses = await getCachedStatuses();

    // Create a map of cached statuses for quick lookup
    const cachedMap = new Map(
      cachedStatuses.map((s) => [`${s.type}-${s.bookingId}`, s])
    );

    const updates: CachedStatus[] = [];

    // Check for new or changed statuses
    for (const newStatus of newStatuses) {
      const key = `${newStatus.type}-${newStatus.bookingId}`;
      const cached = cachedMap.get(key);

      if (!cached || cached.status !== newStatus.status) {
        // Status changed or is new
        console.log(`Status change detected: ${key} => ${newStatus.status}`);

        // Send appropriate notification
        switch (newStatus.type) {
          case 'booking':
            notificationService.sendBookingNotification(
              newStatus.bookingId,
              newStatus.status
            );
            break;
          case 'appointment':
            notificationService.sendAppointmentNotification(
              newStatus.bookingId,
              newStatus.status
            );
            break;
          case 'vehicle':
            notificationService.sendVehicleBookingNotification(
              newStatus.bookingId,
              newStatus.status
            );
            break;
          case 'order':
            notificationService.sendOrderNotification(
              newStatus.bookingId,
              newStatus.status
            );
            break;
        }

        updates.push(newStatus);
      } else {
        updates.push(cached);
      }
    }

    // Clean up old statuses not in new list
    const keysInNewStatuses = new Set(
      newStatuses.map((s) => `${s.type}-${s.bookingId}`)
    );

    const finalStatuses = updates.filter(
      (s) => keysInNewStatuses.has(`${s.type}-${s.bookingId}`)
    );

    // Save updated cache
    await saveCachedStatuses(finalStatuses);

    return finalStatuses;
  } catch (error) {
    console.error('Error checking status changes:', error);
    return newStatuses;
  }
};

// ✅ Format status item for tracking
export const createCachedStatus = (
  item: any,
  type: 'booking' | 'appointment' | 'vehicle' | 'order'
): CachedStatus => {
  const id =
    item.bookingId ||
    item.orderId ||
    item.appointmentId ||
    item.id?.toString?.() ||
    item.booking_id ||
    item.appointment_id ||
    'N/A';

  const status =
    item.status ||
    item.bookingStatus ||
    item.paymentStatus ||
    item.serviceStatus ||
    item.orderStatus ||
    item.issueStatus ||
    'Unknown';

  return {
    bookingId: id,
    type,
    status: status.toString(),
  };
};
