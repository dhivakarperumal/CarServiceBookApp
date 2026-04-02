import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { COLORS } from "../../theme/colors";

export default function AdminDashboard() {
  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ padding: 20 }}
    >
      {/* 🔷 Header */}
      <View className="mb-6">
        <Text className="text-text-secondary text-sm">Welcome back 👋</Text>
        <Text className="text-text-primary text-2xl font-bold mt-1">
          Admin Dashboard
        </Text>
      </View>

      {/* 📊 Stats Cards */}
      <View className="flex-row justify-between mb-6">
        <View className="bg-card p-4 rounded-2xl w-[48%]">
          <Text className="text-text-secondary text-xs">Total Bookings</Text>
          <Text className="text-text-primary text-xl font-bold mt-1">
            120
          </Text>
        </View>

        <View className="bg-card p-4 rounded-2xl w-[48%]">
          <Text className="text-text-secondary text-xs">Users</Text>
          <Text className="text-text-primary text-xl font-bold mt-1">
            45
          </Text>
        </View>
      </View>

      <View className="flex-row justify-between mb-6">
        <View className="bg-card p-4 rounded-2xl w-[48%]">
          <Text className="text-text-secondary text-xs">Revenue</Text>
          <Text className="text-text-primary text-xl font-bold mt-1">
            ₹75K
          </Text>
        </View>

        <View className="bg-card p-4 rounded-2xl w-[48%]">
          <Text className="text-text-secondary text-xs">Pending</Text>
          <Text className="text-text-primary text-xl font-bold mt-1">
            8
          </Text>
        </View>
      </View>

      {/* ⚡ Quick Actions */}
      <Text className="text-text-primary text-lg font-semibold mb-3">
        Quick Actions
      </Text>

      <View className="space-y-4">
        {/* Bookings */}
        <TouchableOpacity
          onPress={() => router.push("/(admin)/bookings")}
          className="bg-card p-4 rounded-2xl flex-row items-center"
        >
          <Ionicons name="car-outline" size={22} color={COLORS.primary} />
          <Text className="text-text-primary ml-3 text-base font-medium">
            Manage Bookings
          </Text>
        </TouchableOpacity>

        {/* Users */}
        <TouchableOpacity
          onPress={() => router.push("/(admin)/users")}
          className="bg-card p-4 rounded-2xl flex-row items-center"
        >
          <Ionicons name="people-outline" size={22} color={COLORS.primary} />
          <Text className="text-text-primary ml-3 text-base font-medium">
            Manage Users
          </Text>
        </TouchableOpacity>

        {/* Services */}
        <TouchableOpacity
          onPress={() => router.push("/(admin)/services")}
          className="bg-card p-4 rounded-2xl flex-row items-center"
        >
          <Ionicons name="settings-outline" size={22} color={COLORS.primary} />
          <Text className="text-text-primary ml-3 text-base font-medium">
            Services & Pricing
          </Text>
        </TouchableOpacity>

        {/* Employees */}
        <TouchableOpacity
          onPress={() => router.push("/(admin)/employees")}
          className="bg-card p-4 rounded-2xl flex-row items-center"
        >
          <Ionicons name="construct-outline" size={22} color={COLORS.primary} />
          <Text className="text-text-primary ml-3 text-base font-medium">
            Mechanics Panel
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}