# 🚀 Backend Push Notifications Setup Guide

## 🎯 Problem: Notifications Only Work When App Is Open

**Current Status**: Your app sends local notifications only when it's running. You need backend push notifications to work when the app is closed or in background (like WhatsApp).

## ✅ What You Need To Do

### Step 1: Backend Database Setup

Create a table to store push tokens:

```sql
-- Add this table to your database
CREATE TABLE push_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  push_token VARCHAR(500) NOT NULL,
  platform VARCHAR(50) DEFAULT 'expo', -- 'expo', 'android', 'ios'
  app VARCHAR(100) DEFAULT 'carservicebookapp',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_token (push_token)
);
```

### Step 2: Backend API Endpoints

Add these endpoints to your backend:

#### POST `/users/push-tokens`
Store user's push token:

```javascript
// Node.js/Express example
app.post('/users/push-tokens', async (req, res) => {
  try {
    const { userId, pushToken, platform, app } = req.body;

    // Check if token already exists
    const existing = await db.query(
      'SELECT id FROM push_tokens WHERE push_token = ?',
      [pushToken]
    );

    if (existing.length > 0) {
      // Update existing
      await db.query(
        'UPDATE push_tokens SET updated_at = NOW() WHERE push_token = ?',
        [pushToken]
      );
    } else {
      // Insert new
      await db.query(
        'INSERT INTO push_tokens (user_id, push_token, platform, app) VALUES (?, ?, ?, ?)',
        [userId, pushToken, platform, app]
      );
    }

    res.json({ success: true, message: 'Push token stored' });
  } catch (error) {
    console.error('Error storing push token:', error);
    res.status(500).json({ error: 'Failed to store push token' });
  }
});
```

#### PUT `/users/:id/push-token` (Optional)
Update push token for a user:

```javascript
app.put('/users/:id/push-token', async (req, res) => {
  try {
    const { id } = req.params;
    const { pushToken } = req.body;

    await db.query(
      'UPDATE push_tokens SET push_token = ?, updated_at = NOW() WHERE user_id = ?',
      [pushToken, id]
    );

    res.json({ success: true, message: 'Push token updated' });
  } catch (error) {
    console.error('Error updating push token:', error);
    res.status(500).json({ error: 'Failed to update push token' });
  }
});
```

### Step 3: Install Expo Server SDK

In your backend project:

```bash
npm install expo-server-sdk
```

### Step 4: Create Push Notification Service

Create a file `services/pushNotificationService.js`:

```javascript
const { Expo } = require('expo-server-sdk');
const db = require('../database'); // Your database connection

class PushNotificationService {
  constructor() {
    this.expo = new Expo();
  }

  // Send notification to a specific user
  async sendToUser(userId, title, body, data = {}) {
    try {
      // Get user's push tokens
      const tokens = await db.query(
        'SELECT push_token FROM push_tokens WHERE user_id = ? AND push_token IS NOT NULL',
        [userId]
      );

      if (tokens.length === 0) {
        console.log(`No push tokens found for user ${userId}`);
        return;
      }

      // Create messages
      const messages = tokens.map(token => ({
        to: token.push_token,
        sound: 'default',
        title: title,
        body: body,
        data: data,
        priority: 'default',
      }));

      // Send notifications
      const chunks = this.expo.chunkPushNotifications(messages);
      const tickets = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
          console.log('Push notification sent:', ticketChunk);
        } catch (error) {
          console.error('Error sending push notification chunk:', error);
        }
      }

      return tickets;
    } catch (error) {
      console.error('Error sending push notification:', error);
      throw error;
    }
  }

  // Send booking status notification
  async sendBookingNotification(bookingId, newStatus, userId) {
    const title = 'Booking Status Updated';
    const body = `Your booking #${bookingId} is now ${newStatus}`;

    return this.sendToUser(userId, title, body, {
      bookingId: bookingId.toString(),
      status: newStatus,
      type: 'booking',
    });
  }

  // Send appointment notification
  async sendAppointmentNotification(appointmentId, status, userId) {
    const title = 'Appointment Status Updated';
    const body = `Your appointment #${appointmentId} status is ${status}`;

    return this.sendToUser(userId, title, body, {
      appointmentId: appointmentId.toString(),
      status,
      type: 'appointment',
    });
  }

  // Send vehicle booking notification
  async sendVehicleBookingNotification(vehicleBookingId, status, userId) {
    const title = 'Vehicle Booking Status Updated';
    const body = `Your vehicle booking #${vehicleBookingId} is now ${status}`;

    return this.sendToUser(userId, title, body, {
      vehicleBookingId: vehicleBookingId.toString(),
      status,
      type: 'vehicle',
    });
  }

  // Send order notification
  async sendOrderNotification(orderId, status, userId) {
    const title = 'Order Status Updated';
    const body = `Your order #${orderId} status is ${status}`;

    return this.sendToUser(userId, title, body, {
      orderId: orderId.toString(),
      status,
      type: 'order',
    });
  }
}

module.exports = new PushNotificationService();
```

### Step 5: Integrate with Booking Status Updates

Update your booking status update logic:

```javascript
// In your booking controller or service
const pushService = require('../services/pushNotificationService');

async function updateBookingStatus(bookingId, newStatus) {
  try {
    // Update booking in database
    await db.query(
      'UPDATE bookings SET status = ?, updated_at = NOW() WHERE id = ?',
      [newStatus, bookingId]
    );

    // Get booking details with user_id
    const booking = await db.query(
      'SELECT user_id FROM bookings WHERE id = ?',
      [bookingId]
    );

    if (booking.length > 0) {
      // Send push notification
      await pushService.sendBookingNotification(bookingId, newStatus, booking[0].user_id);
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating booking status:', error);
    throw error;
  }
}
```

### Step 6: Test the Integration

1. **Start your backend server**
2. **Open your app and login** (this registers the push token)
3. **Update a booking status from backend/admin panel**
4. **Check if notification arrives when app is closed**

## 🔧 Frontend Changes (Already Done)

Your app is already configured to:
- ✅ Register push tokens on login
- ✅ Send tokens to `/users/push-tokens` endpoint
- ✅ Handle incoming notifications
- ✅ Navigate to correct screens when tapped

## 🚀 Production Deployment Requirements

### For APK/AAB Production Builds:

1. **Add EAS Project ID to `app.json`:**
```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "your-eas-project-id-here"
      }
    }
  }
}
```

2. **Build with EAS:**
```bash
# Install EAS CLI
npm install -g @expo/cli

# Login to EAS
eas login

# Build for production
eas build --platform android --profile production
```

3. **Or use Expo Build Service:**
```bash
expo build:android --type app-bundle
```

## 🧪 Testing Push Notifications

### Test with Expo CLI:
```bash
# Send test notification
npx expo send --push-token YOUR_PUSH_TOKEN --message "Test notification"
```

### Test with Backend:
1. Login to app (registers token)
2. Check database for stored token
3. Update booking status
4. Notification should arrive even if app is closed

## 📋 Checklist

- [ ] Database table `push_tokens` created
- [ ] API endpoints `/users/push-tokens` implemented
- [ ] Expo Server SDK installed (`npm install expo-server-sdk`)
- [ ] Push notification service created
- [ ] Booking status updates integrated with push notifications
- [ ] EAS Project ID added to `app.json`
- [ ] Production build created and tested

## 🔍 Troubleshooting

### Notifications not arriving when app is closed:

1. **Check push token storage:**
```sql
SELECT * FROM push_tokens WHERE user_id = YOUR_USER_ID;
```

2. **Verify Expo project ID:**
```json
// app.json should have:
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

3. **Check backend logs** for push notification errors

4. **Test with Expo CLI:**
```bash
npx expo send --push-token YOUR_TOKEN --message "Test"
```

### Common Issues:

- **"No projectId found"**: Add EAS project ID to app.json
- **"Invalid push token"**: Token format issue, check database storage
- **"Notification not delivered"**: Check device notification permissions

## 🎯 Final Result

After implementing this backend setup:

- ✅ **App Open**: Local notifications work
- ✅ **App Background**: Push notifications work
- ✅ **App Closed**: Push notifications work
- ✅ **WhatsApp-style**: Notifications arrive anytime

## 📞 Need Help?

If you need help implementing any of these backend changes, provide your backend technology (Node.js, PHP, Python, etc.) and I can give you specific code examples.

---

**Status**: Backend implementation required for closed-app notifications
**Frontend**: ✅ Ready
**Backend**: 🔄 Needs implementation</content>
<parameter name="filePath">d:\Thenuga\CarServiceBookApp\BACKEND_PUSH_NOTIFICATIONS_GUIDE.md