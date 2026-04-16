# Push Notification Setup Guide

## Overview
This guide explains how to implement and use push notifications in your Expo Car Service Booking App.

## ✅ Completed Setup

### 1. **Installed Packages**
```bash
npx expo install expo-notifications expo-device expo-constants expo-background-fetch expo-task-manager
```

### 2. **Updated app.json**
Your `app.json` already includes:
```json
"plugins": [
  [
    "expo-notifications",
    {
      "icon": "./assets/images/logo_no_bg.png",
      "color": "#ffffff"
    }
  ]
]
```

### 3. **Created Notification Services**

#### `/services/notificationService.ts`
- `configureNotifications()` - Configures how notifications are displayed
- `registerForPushNotificationsAsync()` - Gets device push token
- `sendLocalNotification()` - Sends generic local notifications
- `sendBookingNotification()` - Sends booking status notifications
- `sendAppointmentNotification()` - Sends appointment notifications
- `sendVehicleBookingNotification()` - Sends vehicle booking notifications
- `sendOrderNotification()` - Sends order notifications

#### `/services/statusTracker.ts`
- Tracks booking status changes using AsyncStorage
- Automatically sends notifications when status changes
- Prevents duplicate notifications

#### `/services/backgroundTaskService.ts`
- `registerBackgroundTask()` - Registers the app to check for updates every 15 mins while closed
- Runs autonomously in the background via `expo-task-manager`

### 4. **Created Hooks**

#### `/hooks/useNotifications.ts`
- Listens for incoming notifications
- Handles user interaction with notifications
- Navigates to relevant screens when notification is tapped

#### `/hooks/useStatusPolling.ts`
- Periodically checks for status updates (every 5 minutes)
- Automatically sends notifications on status changes
- Can be added to any component

### 5. **Updated App Layout**
The `_layout.tsx` now:
- Initializes push notifications on app startup
- Sets up notification listeners
- Registers for push notifications automatically
- **NEW**: Registers Background Status Tracker to work while app is closed
- **NEW**: Sends push token to server automatically when user logs in

### 6. **Updated Header Component**
The `Header.tsx` now:
- Tracks booking status changes
- Sends notifications automatically when statuses change
- Shows notification badge with count

## 📱 How to Use

### Option 1: Automatic Status Notifications (Recommended)
The system tracks status changes every time the Header loads status counts:

```typescript
// This happens automatically when:
// 1. App loads
// 2. User opens notification panel in Header
// 3. User navigates or refreshes
```

### Option 2: Enable Periodic Polling
Add this to any component that should always be running (like your tab layout):

```typescript
import { useStatusPolling } from '../hooks/useStatusPolling';

export default function YourComponent() {
  useStatusPolling(); // Checks every 5 minutes

  return (
    // Your component JSX
  );
}
```

### Option 3: Manual Notification Trigger
Send a notification programmatically:

```typescript
import { sendBookingNotification } from '../services/notificationService';

// Send booking notification
sendBookingNotification('12345', 'completed', 'Your booking is ready!');

// Or use specific notification functions
import { 
  sendAppointmentNotification,
  sendVehicleBookingNotification,
  sendOrderNotification 
} from '../services/notificationService';
```

## 🔧 Backend Integration (Optional)

To send push notifications from your backend:

### 1. Get Expiration for Registered Devices
When a user registers, they get a push token. Store this token:

```typescript
// In your registration/login flow
import { registerForPushNotificationsAsync } from '../services/notificationService';

const token = await registerForPushNotificationsAsync();
// Send this token to your backend and associate with user
await api.post('/users/register-push-token', { token, userId: user.id });
```

### 2. Send Notifications from Backend
Your backend can send notifications using Expo Push Notification Service. This is the **BEST** way to ensure notifications arrive while the app is closed.

```bash
# Backend Example (Node.js)
const expo = require('expo-server-sdk').default;
const client = new expo.Expo();

client.sendPushNotificationsAsync([
  {
    to: expoToken,
    sound: 'default',
    title: 'Booking Updated',
    body: `Booking #${bookingId} is now ${status}`,
    data: {
      bookingId: bookingId,
      status: status,
      type: 'booking',
    },
  },
]);
```

## 📧 Notification Types

### Booking Notification
```typescript
sendBookingNotification('1001', 'completed');
// Title: "Booking Status Updated"
// Body: "Your booking #1001 is now completed"
```

### Appointment Notification
```typescript
sendAppointmentNotification('APT-001', 'confirmed');
// Title: "Appointment Status Updated"
// Body: "Your appointment #APT-001 status is confirmed"
```

### Vehicle Booking Notification
```typescript
sendVehicleBookingNotification('VEH-001', 'ready');
// Title: "Vehicle Booking Status Updated"
// Body: "Your vehicle booking #VEH-001 is now ready"
```

### Order Notification
```typescript
sendOrderNotification('ORD-001', 'shipped');
// Title: "Order Status Updated"
// Body: "Your order #ORD-001 status is shipped"
```

### Employee Assignment Notification
```typescript
sendEmployeeAssignmentNotification('SVC-001', employeeId, 'John Doe', 'Oil Change');
// Title: "New Service Assignment"
// Body: "You have been assigned to service for John Doe"
```

### Spare Parts Status Notification
```typescript
sendSparePartsApprovalNotification('SVC-001', employeeId, 'approved', 'Brake Pads x4');
// Title: "Spare Parts Approved"
// Body: "Your spare parts request for service #SVC-001 has been approved"
```

### Admin Order Notification
```typescript
sendNewOrderNotification('ORD-001', 'John Doe', 'pending');
// Title: "New Order Placed"
// Body: "Order #ORD-001 placed by John Doe - Status: pending"
```

### Admin Employee Status Update Notification
```typescript
sendEmployeeStatusUpdateNotification('booking', 'BK-001', 'Mike Johnson', 'completed');
// Title: "Employee Updated Status"
// Body: "Mike Johnson updated booking #BK-001 to completed"
```

### Admin Vehicle Booking Notification
```typescript
sendNewVehicleBookingNotification('VB-001', 'Jane Smith', 'confirmed');
// Title: "New Vehicle Booking"
// Body: "Vehicle booking #VB-001 by Jane Smith - Status: confirmed"
```

## 👷 Employee Notifications

### Overview
Employees receive push notifications for:
1. **Service Assignments** - When a customer service is assigned to them
2. **Spare Parts Approvals** - When their requested spare parts are approved or rejected by customers

### Backend Implementation
Add these methods to your backend push notification service:

```javascript
// Send assignment notification
async sendEmployeeAssignmentNotification(serviceId, employeeId, customerName, serviceDetails) {
  const title = 'New Service Assignment';
  const body = `You have been assigned to service for ${customerName}`;
  
  return this.sendToUser(employeeId, title, body, {
    serviceId: serviceId.toString(),
    customerName,
    serviceDetails,
    type: 'employee_assignment',
  });
}

// Send spare parts status notification
async sendSparePartsApprovalNotification(serviceId, employeeId, status, partDetails) {
  const title = status === 'approved' ? 'Spare Parts Approved' : 'Spare Parts Rejected';
  const body = `Your spare parts request for service #${serviceId} has been ${status}`;
  
  return this.sendToUser(employeeId, title, body, {
    serviceId: serviceId.toString(),
    status,
    partDetails,
    type: 'spare_parts_status',
  });
}
```

### Integration Points
Call these functions when:
- **Assignment**: When updating service records with `assignedEmployeeId`
### Parts Approval**: When customers approve/reject spare parts requests in the app

## 👨‍💼 Admin Notifications

### Overview
Admins receive push notifications for:
1. **New Orders** - When users place orders with order ID, user name, and status
2. **Employee Status Updates** - When employees update booking/appointment statuses
3. **New Vehicle Bookings** - When users make vehicle bookings

### Backend Implementation
Add these methods to your backend push notification service:

```javascript
// Send new order notification to admins
async sendNewOrderNotification(orderId, userName, status) {
  const title = 'New Order Placed';
  const body = `Order #${orderId} placed by ${userName} - Status: ${status}`;
  
  return this.sendToAdmins(title, body, {
    orderId: orderId.toString(),
    userName,
    status,
    type: 'admin_order',
  });
}

// Send employee status update notification to admins
async sendEmployeeStatusUpdateNotification(serviceType, serviceId, employeeName, newStatus) {
  const title = 'Employee Updated Status';
  const body = `${employeeName} updated ${serviceType} #${serviceId} to ${newStatus}`;
  
  return this.sendToAdmins(title, body, {
    serviceType,
    serviceId: serviceId.toString(),
    employeeName,
    newStatus,
    type: 'admin_employee_update',
  });
}

// Send new vehicle booking notification to admins
async sendNewVehicleBookingNotification(vehicleBookingId, userName, status) {
  const title = 'New Vehicle Booking';
  const body = `Vehicle booking #${vehicleBookingId} by ${userName} - Status: ${status}`;
  
  return this.sendToAdmins(title, body, {
    vehicleBookingId: vehicleBookingId.toString(),
    userName,
    status,
    type: 'admin_vehicle_booking',
  });
}

// Helper method to send to all admins
async sendToAdmins(title, body, data = {}) {
  // Get all admin user IDs from your database
  const adminUserIds = await db.query('SELECT id FROM users WHERE role = ?', ['admin']);
  
  // Send notification to each admin
  const notifications = adminUserIds.map(admin => 
    this.sendToUser(admin.id, title, body, data)
  );
  
  return Promise.all(notifications);
}
```

### Integration Points
Call these functions when:
- **New Orders**: When users place orders via `/orders` endpoint
- **Employee Updates**: When employees update booking/appointment status
- **Vehicle Bookings**: When users create vehicle bookings

## 🎯 Notification Flow

```
1. Status changes on backend
   ↓
2. User opens Header or polling interval triggers
   ↓
3. App fetches latest bookings/appointments/vehicles/orders
   ↓
4. statusTracker compares with cached statuses
   ↓
5. If status changed:
   - Send notification
   - Update cache
   - Update Header UI
   ↓
6. User sees notification badge and notification message
   ↓
7. User taps notification
   ↓
8. App navigates to relevant screen
```

## 🔔 Notification Handling

### When App is Closed
- Notification appears in device notification center
- User can tap to open app and navigate to relevant screen

### When App is Open (Foreground)
- Notification appears as alert
- User can tap to navigate to relevant screen

### Notification Badge
- Header shows total count of pending bookings/appointments/vehicles/orders
- Updates when notification panel is opened

## ⚙️ Configuration

### Polling Interval
Edit `/hooks/useStatusPolling.ts`:
```typescript
const POLLING_INTERVAL = 5 * 60 * 1000; // Change this (in milliseconds)
```

### Notification Sound
Edit `/services/notificationService.ts`:
```typescript
sound: 'default', // Change to custom sound name or null
```

### Notification Android Channel
Edit `/services/notificationService.ts`:
```typescript
await Notifications.setNotificationChannelAsync('default', {
  name: 'default',
  importance: Notifications.AndroidImportance.MAX, // Adjust importance
  lightColor: '#FF231F7C', // Your brand color
  // ...
});
```

## 🐛 Troubleshooting

### Notifications not appearing
1. Check if app has notification permissions
2. Verify user is logged in (notifications only work for authenticated users)
3. Check device notification settings
4. Ensure status actually changed (check `statusTracker` logs)

### Duplicate notifications
- The app uses AsyncStorage to cache statuses and prevent duplicates
- Clear cache if needed: `await AsyncStorage.removeItem('@booking_statuses_cache')`

### Token registration issues
- Ensure device has internet connection
- Check if using physical device (not emulator)
- Verify `expo-constants` and `expo-device` are properly installed

## 📝 Example: Add to Tab Navigator

```typescript
// In (tabs)/_layout.tsx
import { useStatusPolling } from '../../hooks/useStatusPolling';

export default function TabsLayout() {
  useStatusPolling(); // Enable automatic status checking

  return (
    <Tabs>
      {/* Your tabs */}
    </Tabs>
  );
}
```

## 🚀 Testing Notifications Locally

```typescript
// Add this to any screen for testing
import { sendBookingNotification } from '../services/notificationService';

export default function TestScreen() {
  return (
    <Button
      title="Test Notification"
      onPress={() => {
        sendBookingNotification('TEST-123', 'pending', 'This is a test notification');
      }}
    />
  );
}
```

---

## Summary

Your push notification system is now complete! It will:

✅ Automatically detect booking status changes  
✅ Send notifications to the user  
✅ Handle user interaction  
✅ Navigate to relevant screens  
✅ Cache statuses to prevent duplicates  
✅ Support all booking types (booking, appointment, vehicle, order)  

The system works with your existing Header component and requires no additional setup to start receiving notifications!
