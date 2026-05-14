import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { apiService } from './api';

// ✅ Check if running in Expo Go
const isExpoGo = (): boolean => {
  return Constants.appOwnership === 'expo';
};

// ✅ Configure how notifications are handled
export const configureNotifications = () => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
};

const getExpoProjectId = (): string | undefined => {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ||
    Constants.easConfig?.projectId ||
    Constants.expoConfig?.extra?.projectId
  );
};

// ✅ Get push notification token
export const registerForPushNotificationsAsync = async (): Promise<string | undefined> => {
  let token;

  // Skip push notification setup in Expo Go for Android
  if (isExpoGo() && Platform.OS === 'android') {
    console.log('Expo Go detected on Android - Push notifications not supported. Using local notifications only.');
    return undefined;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default',
    });
  }

  if (!Device.isDevice) {
    console.log('Must use a physical device for push notifications');
    return undefined;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification!');
    return undefined;
  }

  const projectId = getExpoProjectId();

  if (!projectId) {
    console.warn(
      'No Expo projectId found. Local notifications still work, but Expo push token registration is disabled.\n' +
      'Add your EAS projectId to app.json under expo.extra.eas.projectId or pass it here.'
    );
    return undefined;
  }

  token = (
    await Notifications.getExpoPushTokenAsync({
      projectId,
    })
  ).data;

  console.log('Push token:', token);
  return token;
};

export const sendPushTokenToServer = async (userId: number, pushToken: string) => {
  try {
    await apiService.api.post('/users/push-tokens', {
      userId,
      pushToken,
      platform: Platform.OS,
      app: 'carservicebookapp',
    });
    console.log('Push token sent to server');
  } catch (error) {
    console.warn('Failed to send push token to server:', error);
  }
};

export const registerDeviceForPushNotifications = async (userId: number) => {
  const token = await registerForPushNotificationsAsync();
  if (!token) {
    console.log('No push token available (possibly Expo Go) - local notifications will still work');
    return undefined;
  }

  await sendPushTokenToServer(userId, token);
  return token;
};

// ✅ Send local notification
export const sendLocalNotification = (
  title: string,
  body: string,
  data?: Record<string, string>
) => {
  Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
      sound: 'default',
      badge: 1,
    },
    trigger: null, // Immediate notification
  });
};

// ✅ Send notification for booking status change
export const sendBookingNotification = (
  bookingId: string | number,
  status: string,
  message?: string
) => {
  const title = 'Booking Status Updated';
  const body = message || `Your booking #${bookingId} is now ${status}`;

  sendLocalNotification(title, body, {
    bookingId: bookingId.toString(),
    status,
    type: 'booking',
  });
};

// ✅ Send notification for appointment status change
export const sendAppointmentNotification = (
  appointmentId: string | number,
  status: string,
  message?: string
) => {
  const title = 'Appointment Status Updated';
  const body = message || `Your appointment #${appointmentId} status is ${status}`;

  sendLocalNotification(title, body, {
    appointmentId: appointmentId.toString(),
    status,
    type: 'appointment',
  });
};

// ✅ Send notification for vehicle booking status change
export const sendVehicleBookingNotification = (
  vehicleBookingId: string | number,
  status: string,
  message?: string
) => {
  const title = 'Vehicle Booking Status Updated';
  const body = message || `Your vehicle booking #${vehicleBookingId} is now ${status}`;

  sendLocalNotification(title, body, {
    vehicleBookingId: vehicleBookingId.toString(),
    status,
    type: 'vehicle',
  });
};

// ✅ Send notification for order status change
export const sendOrderNotification = (
  orderId: string | number,
  status: string,
  message?: string
) => {
  const title = 'Order Status Updated';
  const body = message || `Your order #${orderId} status is ${status}`;

  sendLocalNotification(title, body, {
    orderId: orderId.toString(),
    status,
    type: 'order',
  });
};

// ✅ Send notification for employee assignment
export const sendEmployeeAssignmentNotification = (
  serviceId: string | number,
  customerName: string,
  serviceDetails?: string
) => {
  const title = 'New Service Assignment';
  const body = `You have been assigned to service for ${customerName}`;

  sendLocalNotification(title, body, {
    serviceId: serviceId.toString(),
    customerName,
    serviceDetails: serviceDetails || '',
    type: 'employee_assignment',
  });
};

// ✅ Send notification for spare parts status
export const sendSparePartsStatusNotification = (
  serviceId: string | number,
  status: 'approved' | 'rejected',
  partDetails?: string
) => {
  const title = status === 'approved' ? 'Spare Parts Approved' : 'Spare Parts Rejected';
  const body = `Your spare parts request for service #${serviceId} has been ${status}`;

  sendLocalNotification(title, body, {
    serviceId: serviceId.toString(),
    status,
    partDetails: partDetails || '',
    type: 'spare_parts_status',
  });
};

// ✅ Send notification for admin - new order
export const sendAdminOrderNotification = (
  orderId: string | number,
  userName: string,
  status: string
) => {
  const title = 'New Order Placed';
  const body = `Order #${orderId} placed by ${userName} - Status: ${status}`;

  sendLocalNotification(title, body, {
    orderId: orderId.toString(),
    userName,
    status,
    type: 'admin_order',
  });
};

// ✅ Send notification for admin - employee status update
export const sendAdminEmployeeUpdateNotification = (
  serviceType: string,
  serviceId: string | number,
  employeeName: string,
  newStatus: string
) => {
  const title = 'Employee Updated Status';
  const body = `${employeeName} updated ${serviceType} #${serviceId} to ${newStatus}`;

  sendLocalNotification(title, body, {
    serviceType,
    serviceId: serviceId.toString(),
    employeeName,
    newStatus,
    type: 'admin_employee_update',
  });
};

// ✅ Send notification for admin - new vehicle booking
export const sendAdminVehicleBookingNotification = (
  vehicleBookingId: string | number,
  userName: string,
  status: string
) => {
  const title = 'New Vehicle Booking';
  const body = `Vehicle booking #${vehicleBookingId} by ${userName} - Status: ${status}`;

  sendLocalNotification(title, body, {
    vehicleBookingId: vehicleBookingId.toString(),
    userName,
    status,
    type: 'admin_vehicle_booking',
  });
};
