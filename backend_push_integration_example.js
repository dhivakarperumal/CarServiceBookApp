// 🚀 Test Script for Push Notifications
// Run this to test your push notification setup

const pushService = require('./pushNotificationService');
const db = require('../database'); // Your database connection

async function testPushNotifications() {
  console.log('🧪 Testing Push Notifications...\n');

  try {
    // Test 1: Check if push tokens exist
    console.log('1️⃣ Checking stored push tokens...');
    const tokens = await db.query('SELECT COUNT(*) as count FROM push_tokens');
    console.log(`   Found ${tokens[0].count} push tokens in database\n`);

    // Test 2: Get a test user with push token
    console.log('2️⃣ Finding test user with push token...');
    const testUser = await db.query(`
      SELECT u.id, u.email, pt.push_token
      FROM users u
      JOIN push_tokens pt ON u.id = pt.user_id
      LIMIT 1
    `);

    if (testUser.length === 0) {
      console.log('❌ No users with push tokens found!');
      console.log('   Make sure a user has logged into the app first.\n');
      return;
    }

    const user = testUser[0];
    console.log(`   Found user: ${user.email} (ID: ${user.id})`);
    console.log(`   Push token: ${user.push_token.substring(0, 50)}...\n`);

    // Test 3: Send test notification
    console.log('3️⃣ Sending test notification...');
    const result = await pushService.sendToUser(
      user.id,
      '🧪 Test Notification',
      'This is a test push notification from your backend!',
      { test: true, timestamp: new Date().toISOString() }
    );

    console.log('✅ Test notification sent!');
    console.log('   Check your device for the notification.\n');

    // Test 4: Test booking notification
    console.log('4️⃣ Testing booking notification...');
    await pushService.sendBookingNotification('TEST-123', 'completed', user.id);
    console.log('✅ Booking notification sent!\n');

    console.log('🎉 All tests completed!');
    console.log('   If you received notifications, your setup is working!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check your database connection');
    console.log('   2. Verify push_tokens table exists');
    console.log('   3. Ensure Expo Server SDK is installed');
    console.log('   4. Check your EAS project ID in app.json');
  }
}

// Run the test
if (require.main === module) {
  testPushNotifications();
}

module.exports = { testPushNotifications };</content>
<parameter name="filePath">d:\Thenuga\CarServiceBookApp\services\testPushNotifications.js