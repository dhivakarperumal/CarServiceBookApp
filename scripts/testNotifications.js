// 🧪 Notification Testing Script for Expo Go
// Run this in Expo Go to test local notifications

import {
  sendEmployeeAssignmentNotification,
  sendSparePartsStatusNotification,
  sendAdminOrderNotification,
  sendAdminEmployeeUpdateNotification,
  sendAdminVehicleBookingNotification,
  sendBookingNotification,
  sendAppointmentNotification,
  sendOrderNotification,
  sendVehicleBookingNotification
} from '../services/notificationService';

export const testNotifications = () => {
  console.log('🧪 Testing notifications in Expo Go...');

  // Test employee notifications
  setTimeout(() => {
    console.log('📱 Sending employee assignment notification...');
    sendEmployeeAssignmentNotification('SVC-001', 'John Doe', 'Oil Change Service');
  }, 1000);

  setTimeout(() => {
    console.log('📱 Sending spare parts approval notification...');
    sendSparePartsStatusNotification('SVC-001', 'approved', 'Brake Pads x4, Oil Filter x1');
  }, 3000);

  setTimeout(() => {
    console.log('📱 Sending spare parts rejection notification...');
    sendSparePartsStatusNotification('SVC-002', 'rejected', 'Custom Part XYZ');
  }, 5000);

  // Test admin notifications
  setTimeout(() => {
    console.log('📱 Sending admin order notification...');
    sendAdminOrderNotification('ORD-001', 'Jane Smith', 'pending');
  }, 7000);

  setTimeout(() => {
    console.log('📱 Sending admin employee update notification...');
    sendAdminEmployeeUpdateNotification('booking', 'BK-001', 'Mike Johnson', 'completed');
  }, 9000);

  setTimeout(() => {
    console.log('📱 Sending admin vehicle booking notification...');
    sendAdminVehicleBookingNotification('VB-001', 'Bob Wilson', 'confirmed');
  }, 11000);

  // Test user notifications
  setTimeout(() => {
    console.log('📱 Sending user booking notification...');
    sendBookingNotification('BK-001', 'confirmed');
  }, 13000);

  setTimeout(() => {
    console.log('📱 Sending user appointment notification...');
    sendAppointmentNotification('APT-001', 'scheduled');
  }, 15000);

  setTimeout(() => {
    console.log('📱 Sending user order notification...');
    sendOrderNotification('ORD-001', 'shipped');
  }, 17000);

  setTimeout(() => {
    console.log('📱 Sending user vehicle booking notification...');
    sendVehicleBookingNotification('VB-001', 'ready');
  }, 19000);

  console.log('✅ All test notifications scheduled!');
  console.log('📲 Check your device for notifications...');
};

// Usage: Import and call testNotifications() in any component
// import { testNotifications } from '../scripts/testNotifications';
// testNotifications();