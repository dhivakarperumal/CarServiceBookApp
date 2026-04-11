import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { apiService } from './api';
import * as statusTracker from './statusTracker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKGROUND_FETCH_TASK = 'BACKGROUND_STATUS_CHECK';

// ✅ Define the task that will run in the background
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    const USER_KEY = '@user_data';
    const storedUser = await AsyncStorage.getItem(USER_KEY);
    
    if (!storedUser) {
      console.log('[Background Fetch] No user found, skipping check');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    const user = JSON.parse(storedUser);
    console.log('[Background Fetch] Checking status for user:', user.id);

    // Fetch all relevant data in background
    const [bookings, appointments, vehicles, orders] = await Promise.all([
      apiService.api.get('/bookings').then(res => res.data || []).catch(() => []),
      apiService.api.get('/appointments').then(res => res.data || []).catch(() => []),
      apiService.api.get('/vehicle-bookings').then(res => res.data || []).catch(() => []),
      apiService.api.get('/orders').then(res => res.data || []).catch(() => []),
    ]);

    // Create tracking list
    const newStatuses: statusTracker.CachedStatus[] = [
      ...bookings.map((item: any) => statusTracker.createCachedStatus(item, 'booking')),
      ...appointments.map((item: any) => statusTracker.createCachedStatus(item, 'appointment')),
      ...vehicles.map((item: any) => statusTracker.createCachedStatus(item, 'vehicle')),
      ...orders.map((item: any) => statusTracker.createCachedStatus(item, 'order')),
    ];

    // checkStatusChanges will automatically send notifications if things changed
    const finalStatuses = await statusTracker.checkStatusChanges(newStatuses);

    return finalStatuses.length > 0
      ? BackgroundFetch.BackgroundFetchResult.NewData
      : BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    console.error('[Background Fetch] Error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// ✅ Register the task
export const registerBackgroundTask = async () => {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
    if (isRegistered) {
      console.log('[Background Fetch] Task already registered');
    }

    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 15 * 60, // 15 minutes (minimum allowed by OS)
      stopOnTerminate: false, // Continue after app is closed
      startOnBoot: true, // Start after device reboot
    });
    
    console.log('[Background Fetch] Task registered successfully');
  } catch (err) {
    console.error('[Background Fetch] Registration failed:', err);
  }
};

// ✅ Optional: Manually unregister task if needed
export const unregisterBackgroundTask = async () => {
  if (await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK)) {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
  }
};
