import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";

export default function EmployeeProfile() {
  const { user, logout } = useAuth();

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

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 100 }}
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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
