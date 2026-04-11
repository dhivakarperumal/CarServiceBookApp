import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

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

// ✅ Get push notification token
export const registerForPushNotificationsAsync = async (): Promise<string | undefined> => {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default',
    });
  }

  if (Device.isDevice) {
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

    token = (
      await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId,
      })
    ).data;

    console.log('Push token:', token);
  } else {
    console.log('Must use physical device for Push Notifications');
  }

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
