import AsyncStorage from '@react-native-async-storage/async-storage';
import * as notificationService from './notificationService';

const STATUS_CACHE_KEY = '@booking_statuses_cache';

export interface CachedStatus {
  bookingId: string | number;
  type:
    | 'booking'
    | 'appointment'
    | 'vehicle'
    | 'order'
    | 'service'
    | 'assignment'
    | 'admin';
  status: string;
  message?: string;
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
        sendCachedStatusNotification(newStatus);

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

export const createCachedServiceStatus = (
  service: any,
  type: 'service' | 'assignment' | 'admin'
): CachedStatus | null => {
  const id =
    service.id ||
    service.serviceId ||
    service.bookingId ||
    service.booking_id ||
    service.orderId ||
    'N/A';

  const issues = Array.isArray(service.issues) ? service.issues : [];
  const parts = Array.isArray(service.parts) ? service.parts : [];
  const assignedName =
    service.assignedEmployeeName ||
    service.assignedEmployee ||
    service.assigned_employee_name ||
    service.assignedEmployeeId ||
    service.assigned_employee_id ||
    '';

  const issueSnapshot = issues
    .map(
      (issue: any) =>
        `${issue.id || issue._id || issue.issueId || issue.issue_id || 'unknown'}:${
          issue.issueStatus || 'pending'
        }`
    )
    .join(',');

  const partSnapshot = parts
    .map((part: any) => `${part.id || part.partName || 'unknown'}:${part.status || 'pending'}`)
    .join(',');

  const statusParts = [];
  if (issueSnapshot) statusParts.push(`issues:${issueSnapshot}`);
  if (partSnapshot) statusParts.push(`parts:${partSnapshot}`);
  if (assignedName) statusParts.push(`assigned:${assignedName}`);

  if (statusParts.length === 0) return null;

  const status = statusParts.join('|');

  let message = '';

  const bookingRef =
    service.bookingId || service.booking_id || service.bookingId || service.orderId || service.appointmentId || service.appointment_id || id;
  const formattedRef = bookingRef ? bookingRef.toString() : id.toString();
  const customerName = service.name || service.customerName || service.customer_name || service.customer || 'Customer';
  const isAppointment = Boolean(service.appointmentId || service.appointment_id || service.isAppointment);

  if (type === 'service') {
    message = `Service #${formattedRef} has been updated.`;
  } else if (type === 'assignment') {
    const itemLabel = isAppointment ? 'Appointment' : 'Booking';
    message = `${customerName}, ${itemLabel} #${formattedRef} is assigned to you.`;
  } else {
    message = `Service #${formattedRef} has been updated.`;
  }

  return {
    bookingId: id,
    type,
    status,
    message,
  };
};

const sendCachedStatusNotification = (newStatus: CachedStatus) => {
  switch (newStatus.type) {
    case 'booking':
      notificationService.sendBookingNotification(
        newStatus.bookingId,
        newStatus.status,
        newStatus.message
      );
      break;
    case 'appointment':
      notificationService.sendAppointmentNotification(
        newStatus.bookingId,
        newStatus.status,
        newStatus.message
      );
      break;
    case 'vehicle':
      notificationService.sendVehicleBookingNotification(
        newStatus.bookingId,
        newStatus.status,
        newStatus.message
      );
      break;
    case 'order':
      notificationService.sendOrderNotification(
        newStatus.bookingId,
        newStatus.status,
        newStatus.message
      );
      break;
    case 'service':
      notificationService.sendServiceNotification(
        newStatus.bookingId,
        newStatus.message || `Service #${newStatus.bookingId} has updates.`
      );
      break;
    case 'assignment':
      notificationService.sendAssignmentNotification(
        newStatus.bookingId,
        newStatus.message || `A service has been assigned to you.`
      );
      break;
    case 'admin':
      notificationService.sendAdminNotification(
        newStatus.bookingId,
        newStatus.message || `Service #${newStatus.bookingId} has been updated.`
      );
      break;
  }
};
