import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../contexts/AuthContext";
import { CartProvider } from "../contexts/CartContext";
import { FavoriteProvider } from "../contexts/FavoriteContext";

import './global.css';

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <FavoriteProvider>
          <Stack
            screenOptions={{
              headerStyle: {
                backgroundColor: "#2563eb",
              },
              headerTintColor: "#fff",
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

            <Stack.Screen
              name="service/[id]"
              options={({ route }) => ({
                title: route.params?.title || "Service Details",
              })}
            />

            {/* Other Screens */}
          </Stack>

          <StatusBar style="light" />
        </FavoriteProvider>
      </CartProvider>
    </AuthProvider>
  );
}