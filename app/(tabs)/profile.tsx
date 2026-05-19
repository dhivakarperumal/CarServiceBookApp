import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { apiService } from "../../services/api";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
        style: "destructive",
      },
    ]);
  };

  const handleDeleteAccount = () => {
    const performDelete = async () => {
      if (!user?.id) {
        Alert.alert("Error", "Unable to delete account. Please try again.");
        return;
      }

      try {
        setLoading(true);
        await apiService.deleteAccount(user.id);

        Alert.alert(
          "Account Deleted",
          "Your account has been successfully deleted. You will be logged out.",
          [
            {
              text: "OK",
              onPress: async () => {
                await logout();
                router.replace("/(auth)/login");
              },
            },
          ]
        );
      } catch (err: any) {
        Alert.alert(
          "Error",
          err?.response?.data?.message || "Failed to delete account"
        );
      } finally {
        setLoading(false);
      }
    };

    if (Platform.OS === "ios") {
      Alert.prompt(
        "Confirm Deletion",
        "Type your email to confirm account deletion:",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Confirm",
            onPress: async (email) => {
              if (email !== user?.email) {
                Alert.alert("Error", "Email does not match");
                return;
              }
              await performDelete();
            },
          },
        ],
        "plain-text"
      );
    } else {
      Alert.alert(
        "Delete Account",
        "Are you sure you want to permanently delete your account? This action cannot be undone.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: performDelete,
          },
        ]
      );
    }
  };

  const MenuItem = ({ title, icon, route }: any) => (
    <TouchableOpacity
      onPress={() => router.push(route)}
      className="flex-row items-center justify-between px-5 py-4 rounded-2xl mb-4 bg-slate800/50 border border-white/5"
    >
      <View className="flex-row items-center gap-4">
        <Ionicons name={icon} size={22} color="#E5E7EB" />
        <Text className="text-text-primary text-base font-semibold">
          {title}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["left", "right"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 50 }}
      >
        {/* HEADER */}
        <View className="bg-slate800/60 rounded-3xl p-6 items-center mt-6">
          <Ionicons name="person-circle" size={100} color="#38bdf8" />

          <Text className="text-text-primary text-xl font-bold mt-3">
            {user?.username || "User"}
          </Text>

          <Text className="text-text-secondary text-sm mt-1">
            {user?.email || "email@example.com"}
          </Text>

          <Text className="text-white text-xs font-bold mt-3">
            {user?.role?.toUpperCase() || "CUSTOMER"}
          </Text>
        </View>

        {/* MENU ITEMS (SEPARATE CARDS) */}
        <View className="mt-6">
          <MenuItem
            title="Service Status"
            icon="construct-outline"
            route="/profile/service-status"
          />

          <MenuItem
            title="Personal Info"
            icon="person-outline"
            route="/profile/personal-info"
          />

          <MenuItem
            title="My Orders"
            icon="receipt-outline"
            route="/profile/orders"
          />

          <MenuItem
            title="Vehicle Bookings"
            icon="car-outline"
            route="/profile/VehicleBookings"
          />

          <MenuItem
            title="History"
            icon="time-outline"
            route="/profile/history"
          />

          <MenuItem
            title="Set Password"
            icon="lock-closed-outline"
            route="/profile/change-password"
          />
        </View>

        {/* LOGOUT */}
        <TouchableOpacity
          onPress={handleLogout}
          className="mt-4 py-4 rounded-2xl flex-row justify-center items-center bg-error-light border border-error-border"
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text className="text-error font-bold ml-2">Logout</Text>
        </TouchableOpacity>

        {/* DELETE ACCOUNT */}
        <TouchableOpacity
          onPress={handleDeleteAccount}
          disabled={loading}
          className="mt-2 py-4 rounded-2xl flex-row justify-center items-center bg-red-900/30 border border-red-700"
        >
          {loading ? (
            <>
              <ActivityIndicator color="#DC2626" size="small" />
              <Text className="text-red-500 font-bold ml-2">Deleting...</Text>
            </>
          ) : (
            <>
              <Ionicons name="trash-outline" size={20} color="#DC2626" />
              <Text className="text-red-500 font-bold ml-2">Delete Account</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
