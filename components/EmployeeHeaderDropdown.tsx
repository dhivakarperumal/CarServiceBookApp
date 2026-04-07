import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    Modal,
    Pressable,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { COLORS } from "../theme/colors";

export default function EmployeeHeaderDropdown() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
            router.replace("/(auth)/login");
          } catch (error) {
            console.error("Logout error:", error);
            Alert.alert("Error", "Failed to logout. Please try again.");
          }
        },
      },
    ]);
    setIsDropdownVisible(false);
  };

  const handleProfile = () => {
    router.push("/(employee)/profile");
    setIsDropdownVisible(false);
  };

  const getUserInitial = () => {
    if (user?.username) {
      return user.username.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "U";
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setIsDropdownVisible(true)}
        className="w-9 h-9 rounded-full bg-primary items-center justify-center"
        activeOpacity={0.7}
      >
        <Text className="text-white font-bold text-sm">{getUserInitial()}</Text>
      </TouchableOpacity>

      <Modal
        visible={isDropdownVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDropdownVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/60"
          onPress={() => setIsDropdownVisible(false)}
        />

        <View className="absolute top-20 right-5 w-48 bg-card rounded-2xl border border-primary/30 py-2 shadow-lg">
          {/* Profile Option */}
          <TouchableOpacity
            onPress={handleProfile}
            className="flex-row items-center px-4 py-3"
            activeOpacity={0.7}
          >
            <Ionicons
              name="person-outline"
              size={20}
              color={COLORS.primary}
              className="mr-3"
            />
            <Text className="text-white font-semibold">My Profile</Text>
          </TouchableOpacity>

          {/* Logout Option */}
          <TouchableOpacity
            onPress={handleLogout}
            className="flex-row items-center px-4 py-3"
            activeOpacity={0.7}
          >
            <Ionicons
              name="log-out-outline"
              size={20}
              color={COLORS.error}
              className="mr-3"
            />
            <Text className="text-error font-semibold">Logout</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}
