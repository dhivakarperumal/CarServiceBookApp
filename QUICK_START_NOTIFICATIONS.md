# Push Notifications - Quick Start

## ⚠️ Expo Go Limitations

**Important**: Push notifications do NOT work in Expo Go on Android (SDK 53+).
- Use **Development Build** for testing push notifications
- Local notifications work in Expo Go for basic testing

### Testing with Local Notifications (Expo Go):
```typescript
import { 
  sendEmployeeAssignmentNotification,
  sendSparePartsStatusNotification,
  sendAdminOrderNotification,
  sendAdminEmployeeUpdateNotification,
  sendAdminVehicleBookingNotification
} from '../services/notificationService';

// Test employee notifications
sendEmployeeAssignmentNotification('SVC-001', 'John Doe', 'Oil Change');
sendSparePartsStatusNotification('SVC-001', 'approved', 'Brake Pads x4');

// Test admin notifications  
sendAdminOrderNotification('ORD-001', 'Jane Smith', 'pending');
sendAdminEmployeeUpdateNotification('booking', 'BK-001', 'Mike Johnson', 'completed');
sendAdminVehicleBookingNotification('VB-001', 'Bob Wilson', 'confirmed');
```

### Quick Test Script:
```typescript
// Import the test script
import { testNotifications } from '../scripts/testNotifications';

// Run all notification tests
testNotifications();
```

## ✅ What's Already Done

Everything is automatically set up! Your push notification system is **ready to go**. Here's what was implemented:

### Features Implemented:
1. ✅ Push notification service and local notifications
2. ✅ Automatic notification listening on app startup
3. ✅ Status tracking and change detection
4. ✅ Booking notifications with booking ID and status
5. ✅ Support for: Bookings, Appointments, Vehicle Bookings, Orders
6. ✅ **NEW**: Employee assignment notifications
7. ✅ **NEW**: Spare parts approval/rejection notifications
8. ✅ **NEW**: Admin order notifications
9. ✅ **NEW**: Admin employee status update notifications
10. ✅ **NEW**: Admin vehicle booking notifications
11. ✅ Notification badge counter in Header
12. ✅ Tap-to-navigate functionality

## 🚀 Start Using It Now

### The notifications work automatically when:

1. **App Starts** - Push notifications are initialized
2. **Header Opens** - Status is checked and notifications are sent if anything changed
3. **Every 5 minutes** - (Optional) If you enable polling

### What Happens:
- When a booking/appointment status changes → **Notification is sent**
- Notification shows: **Booking ID** + **New Status**
- Example: "Your booking #1001 is now completed"
- Tap notification → App navigates to relevant screen

### Employee Notifications:
- When assigned to a service → **"New Service Assignment" notification**
- When spare parts are approved/rejected → **"Spare Parts Approved/Rejected" notification**
- Tap notification → Navigate to assigned services page

### Admin Notifications:
- When users place orders → **"New Order Placed" notification with order ID and user name**
- When employees update statuses → **"Employee Updated Status" notification**
- When users book vehicles → **"New Vehicle Booking" notification**
- Tap notification → Navigate to relevant admin panel screens

## 📋 Files Created

```
services/
  ├── notificationService.ts      (Core notification functions)
  └── statusTracker.ts            (Status change detection)

hooks/
  ├── useNotifications.ts         (Listen for notifications)
  └── useStatusPolling.ts         (Optional: 5-min auto-check)

app/
  └── _layout.tsx                 (Updated: Initializes notifications)

components/
  └── Header.tsx                  (Updated: Tracks status changes)
```

## 🔧 Optional: Enable Auto-Polling

To check for status updates every 5 minutes automatically:

**Edit: `app/(tabs)/_layout.tsx`**

```typescript
import { useStatusPolling } from '../../hooks/useStatusPolling';

export default function TabLayout() {
  useStatusPolling(); // Add this line
  
  return (
    <Tabs>
      {/* Your existing tabs */}
    </Tabs>
  );
}
```

## 📱 Test It

### Manual Test:
1. Open your app
2. Go to Bookings/Appointments page
3. Change a booking status from backend (or use test button if available)
4. Click notification badge in Header
5. **You'll see the notification!**

### See the Notification:
- Notification badge appears in Header with count
- Click the badge to see list of pending bookings/appointments
- Each shows: **Booking ID** • **Status**

## 🎯 Complete Notification Flow

```
User Updates Booking Status → App Checks → Status Changed? → Send Notification → User Sees Alert
                                   ↑                                                  ↓
                                   └──────────────── User Taps → Navigate ←──────────┘
```

## 💡 Need Notifications from Backend?

If you want to send notifications from your server instead of local notifications, see the backend integration section in `PUSH_NOTIFICATIONS_SETUP.md`.

## 📝 Booking Notification Example

**Current Implementation:**
- Checks when Header loads
- Shows: `Booking #1001 • Completed`
- Sends notification automatically

**Example Notification Message:**
```
Title: Booking Status Updated
Body: Your booking #1001 is now completed
```

## 🎉 That's It!

Your app now has fully working push notifications! 

- Booking status changes are automatically detected
- Notifications are sent with booking ID and status
- No further configuration needed
- Just test and deploy!

---

**Next Steps:**
1. Test with your actual bookings
2. (Optional) Add polling hook to tabs for 5-min auto-check
3. (Optional) Integrate with backend to send server-side notifications

**Questions?** See `PUSH_NOTIFICATIONS_SETUP.md` for detailed documentation.
