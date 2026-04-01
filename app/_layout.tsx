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
        {/* Tabs (Main App) */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* Auth Screens */}
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />

        {/* Other Screens */}
        <Stack.Screen name="home" options={{ title: "Home" }} />
      </Stack>

      <StatusBar style="light" />
    </AuthProvider>
  );
}