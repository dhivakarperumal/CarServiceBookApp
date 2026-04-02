import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../contexts/AuthContext";

import './global.css';

export default function RootLayout() {
  return (
    <AuthProvider>
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

        {/* Other Screens */}
      </Stack>

      <StatusBar style="light" />
    </AuthProvider>
  );
}