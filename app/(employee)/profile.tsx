import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { SafeAreaView, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../contexts/AuthContext";

export default function EmployeeProfile() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="p-5 flex-1">
        <View className="items-center mt-10 mb-8">
          <View className="w-24 h-24 bg-primary/20 rounded-full border-2 border-primary justify-center items-center mb-4">
            <Ionicons name="person" size={40} color="#0EA5E9" />
          </View>
          <Text className="text-text-primary text-2xl font-bold">
            {user?.username || "Employee"}
          </Text>
          <Text className="text-text-secondary mt-1 uppercase tracking-widest text-xs">
            Service Admin
          </Text>
        </View>

        <View className="bg-card rounded-2xl border border-card overflow-hidden">
          <View className="p-4 border-b border-card flex-row items-center justify-between">
            <Text className="text-text-primary">Email Address</Text>
            <Text className="text-text-secondary">
              {user?.email || "employee@qtechx.com"}
            </Text>
          </View>
          <View className="p-4 flex-row items-center justify-between">
            <Text className="text-text-primary">Staff ID</Text>
            <Text className="text-text-secondary">EMP-29001</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleLogout}
          className="mt-8 bg-error/20 border border-error/40 p-4 rounded-xl flex-row items-center justify-center gap-2"
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text className="text-error font-bold">Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
