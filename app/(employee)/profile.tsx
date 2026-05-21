import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { apiService } from "../../services/api";

export default function EmployeeProfile() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);

  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "N/A";

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
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

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 100,
        }}
      >
        <View className="flex-1">
          {/* Profile Header */}
          <View className="bg-card border border-card rounded-3xl p-6 items-center shadow-lg mt-6">
            <View className="w-28 h-28 rounded-full bg-primary/20 border-2 border-primary items-center justify-center mb-4">
              <Ionicons name="person" size={44} color="#0EA5E9" />
            </View>

            <Text className="text-text-primary text-2xl font-bold">
              {user?.username || "Employee"}
            </Text>

            <Text className="text-text-secondary text-xs uppercase tracking-widest mt-1">
              {user?.role || "Service Staff"}
            </Text>

            <View className="flex-row items-center gap-2 mt-3">
              <Ionicons name="calendar-outline" size={16} color="#94A3B8" />
              <Text className="text-text-secondary text-xs">
                Joined {joinedDate}
              </Text>
            </View>
          </View>

          {/* Info Section */}
          <View className="mt-8 bg-card border border-card rounded-2xl overflow-hidden">
            {/* Email */}
            <View className="flex-row items-center justify-between p-5 border-b border-card">
              <View className="flex-row items-center gap-3">
                <Ionicons name="mail-outline" size={20} color="#38BDF8" />
                <Text className="text-text-primary">Email</Text>
              </View>

              <Text className="text-text-secondary">
                {user?.email || "employee@qtechx.com"}
              </Text>
            </View>

            {/* Mobile */}
            <View className="flex-row items-center justify-between p-5 border-b border-card">
              <View className="flex-row items-center gap-3">
                <Ionicons name="call-outline" size={20} color="#38BDF8" />
                <Text className="text-text-primary">Mobile</Text>
              </View>

              <Text className="text-text-secondary">{user?.mobile}</Text>
            </View>

            {/* Role */}
            <View className="flex-row items-center justify-between p-5 border-b border-card">
              <View className="flex-row items-center gap-3">
                <Ionicons
                  name="shield-checkmark-outline"
                  size={20}
                  color="#38BDF8"
                />
                <Text className="text-text-primary">Role</Text>
              </View>

              <Text className="text-text-secondary">{user?.role}</Text>
            </View>

            {/* Joined Date */}
            <View className="flex-row items-center justify-between p-5">
              <View className="flex-row items-center gap-3">
                <Ionicons name="time-outline" size={20} color="#38BDF8" />
                <Text className="text-text-primary">Joined Date</Text>
              </View>

              <Text className="text-text-secondary">{joinedDate}</Text>
            </View>
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            onPress={handleLogout}
            className="mt-10 bg-error/20 border border-error/40 p-4 rounded-xl flex-row items-center justify-center gap-2"
          >
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text className="text-error font-bold text-base">Logout</Text>
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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
