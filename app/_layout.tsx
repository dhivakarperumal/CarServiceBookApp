import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../contexts/AuthContext";
import { CartProvider } from "../contexts/CartContext";
import { FavoriteProvider } from "../contexts/FavoriteContext";
import { useNotifications } from "../hooks/useNotifications";
import { useStatusPolling } from "../hooks/useStatusPolling";
import * as notificationService from "../services/notificationService";

import './global.css';

// ✅ Notification wrapper component
function NotificationWrapper({ children }: { children: React.ReactNode }) {
  useNotifications();
  useStatusPolling();

  useEffect(() => {
    // Configure and register for push notifications
    notificationService.configureNotifications();
    notificationService.registerForPushNotificationsAsync().catch((error) => {
      console.error('Failed to register for push notifications:', error);
    });
  }, []);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NotificationWrapper>
          <CartProvider>
            <FavoriteProvider>
          <Stack
            screenOptions={{
              headerStyle: {
                backgroundColor: "#1F2A3A",
              },
              headerTintColor: "#E5E7EB",
              headerTitleStyle: {
                fontWeight: "bold",
              },
            }}
          >
            {/* Initial Redirect */}
            <Stack.Screen name="index" options={{ headerShown: false }} />

            {/* Tabs (Main App) */}
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

            {/* Auth Screens */}
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />

            {/* Employee Dashboard */}
            <Stack.Screen name="(employee)" options={{ headerShown: false }} />

            {/* Admin Dashboard */}
            <Stack.Screen name="(admin)" options={{ headerShown: false }} />

            {/* Admin Utility Pages */}
            <Stack.Screen name="(adminPages)" options={{ headerShown: false }} />

            <Stack.Screen
              name="service/[id]"
              options={({ route }) => ({
                title: route.params?.title || "Service Details",
              })}
            />

            {/* PROFILE SCREENS */}
            <Stack.Screen
              name="profile/service-status"
              options={{ title: "Service Status" }}
            />

            <Stack.Screen
              name="profile/personal-info"
              options={{ title: "Personal Info" }}
            />

            <Stack.Screen
              name="profile/orders"
              options={{ title: "My Orders" }}
            />

            <Stack.Screen
              name="profile/VehicleBookings"
              options={{ title: "Vehicle Bookings" }}
            />

            <Stack.Screen
              name="profile/history"
              options={{ title: "History" }}
            />

            <Stack.Screen
              name="profile/change-password"
              options={{ title: "Set / Change Password" }}
            />
          </Stack>

          <StatusBar style="light" />
            </FavoriteProvider>
          </CartProvider>
        </NotificationWrapper>
      </AuthProvider>
    </SafeAreaProvider>
  );
}