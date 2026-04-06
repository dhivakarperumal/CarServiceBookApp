import React from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Bookings() {
  return (
    <SafeAreaView className="flex-1 bg-background items-center justify-center">
      <Text className="text-text-primary text-lg font-bold">
        Vehicle Bookings Page
      </Text>
    </SafeAreaView>
  );
}