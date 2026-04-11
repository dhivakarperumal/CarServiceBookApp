// ✅ OPTIONAL: Backend Integration Example
// This shows how to integrate push notifications from your Expo backend

/**
 * Example 1: Store Push Token in Database
 * 
 * When user logs in, send their push token to backend:
 */

import { api } from '../services/api';
import { registerForPushNotificationsAsync } from '../services/notificationService';

export const storePushTokenOnLogin = async (userId: number, userEmail: string) => {
  try {
    const token = await registerForPushNotificationsAsync();
    
    if (token) {
      // Send token to your backend
      await api.post('/users/push-tokens', {
        userId,
        email: userEmail,
        pushToken: token,
        platform: 'expo',
      });
      
      console.log('Push token stored on backend');
    }
  } catch (error) {
    console.error('Failed to store push token:', error);
  }
};

/**
 * Example 2: Backend Node.js Code to Send Notifications
 * 
 * Install: npm install expo-server-sdk
 */

/*
const { Expo } = require('expo-server-sdk');
const db = require('./database');

const expo = new Expo();

// When booking status is updated
async function onBookingStatusChanged(bookingId, newStatus) {
  try {
    // Get user's push tokens
    const booking = await db.query('SELECT user_id FROM bookings WHERE id = ?', [bookingId]);
    const userTokens = await db.query(
      'SELECT pushToken FROM push_tokens WHERE userId = ?',
      [booking[0].user_id]
    );

    if (userTokens.length === 0) return;

    const messages = userTokens.map(entry => ({
      to: entry.pushToken,
      sound: 'default',
      title: 'Booking Status Updated',
      body: `Your booking #${bookingId} is now ${newStatus}`,
      data: {
        bookingId: bookingId.toString(),
        status: newStatus,
        type: 'booking',
        screen: 'booking', // Navigation hint
      },
    }));

    // Send all notifications
    const chunks = expo.chunkPushNotifications(messages);
    
    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        console.log('Notifications sent:', ticketChunk);
      } catch (error) {
        console.error('Error sending notifications:', error);
      }
    }
  } catch (error) {
    console.error('Error in onBookingStatusChanged:', error);
  }
}

module.exports = { onBookingStatusChanged };
*/

/**
 * Example 3: Handle Multiple Status Types
 */

/*
async function sendStatusNotification(type, itemId, status) {
  const typeConfig = {
    booking: {
      title: 'Booking Status Updated',
      table: 'bookings',
      field: 'user_id',
    },
    appointment: {
      title: 'Appointment Status Updated',
      table: 'appointments',
      field: 'user_id',
    },
    vehicle: {
      title: 'Vehicle Booking Status Updated',
      table: 'vehicle_bookings',
      field: 'user_id',
    },
    order: {
      title: 'Order Status Updated',
      table: 'orders',
      field: 'user_id',
    },
  };

  const config = typeConfig[type];
  const item = await db.query(
    `SELECT ${config.field} FROM ${config.table} WHERE id = ?`,
    [itemId]
  );

  const userTokens = await db.query(
    'SELECT pushToken FROM push_tokens WHERE userId = ?',
    [item[0][config.field]]
  );

  const messages = userTokens.map(entry => ({
    to: entry.pushToken,
    sound: 'default',
    title: config.title,
    body: `Your ${type} #${itemId} is now ${status}`,
    data: {
      [`${type}Id`]: itemId.toString(),
      status,
      type,
    },
  }));

  // Send notifications...
}
*/

/**
 * Example 4: Update Push Token on New Registration
 * 
 * After user creates account, store their token
 */

export const registerUserWithPushToken = async (userData: any) => {
  try {
    // Register user on backend
    const userResponse = await api.post('/auth/register', userData);
    const userId = userResponse.data.id;

    // Get push token and store it
    const token = await registerForPushNotificationsAsync();
    if (token) {
      await api.post('/users/push-tokens', {
        userId,
        email: userData.email,
        pushToken: token,
        platform: 'expo',
      });
    }

    return userResponse.data;
  } catch (error) {
    console.error('Registration failed:', error);
    throw error;
  }
};

/**
 * Example 5: Update Token When User Changes Device
 * 
 * Call this periodically or when user signs back in
 */

export const updatePushToken = async (userId: number, userEmail: string) => {
  try {
    const newToken = await registerForPushNotificationsAsync();
    
    if (newToken) {
      await api.put(`/users/${userId}/push-token`, {
        pushToken: newToken,
        email: userEmail,
        platform: 'expo',
      });
      
      console.log('Push token updated');
    }
  } catch (error) {
    console.error('Failed to update push token:', error);
  }
};

/**
 * DATABASE SCHEMA EXAMPLE
 * 
 * Create this table on your backend:
 * 
 * CREATE TABLE push_tokens (
 *   id INT PRIMARY KEY AUTO_INCREMENT,
 *   userId INT NOT NULL,
 *   email VARCHAR(255),
 *   pushToken VARCHAR(500) NOT NULL,
 *   platform VARCHAR(50), # 'expo', 'android', 'ios'
 *   createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 *   updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 *   FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
 *   UNIQUE KEY unique_token (pushToken)
 * );
 * 
 * CREATE TABLE notification_logs (
 *   id INT PRIMARY KEY AUTO_INCREMENT,
 *   userId INT NOT NULL,
 *   type VARCHAR(50), # 'booking', 'appointment', etc
 *   itemId INT,
 *   title VARCHAR(255),
 *   body TEXT,
 *   sentAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 *   FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
 * );
 */

/**
 * INTEGRATION CHECKLIST
 * 
 * ✓ Install: npm install expo-server-sdk
 * ✓ Create push_tokens table
 * ✓ Create API endpoint: POST /users/push-tokens
 * ✓ Create API endpoint: PUT /users/:id/push-token
 * ✓ Call storePushTokenOnLogin() after user logs in
 * ✓ Call sendStatusNotification() when status changes
 * ✓ Test with test token from Expo dashboard
 */
