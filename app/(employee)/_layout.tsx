import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs, useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import EmployeeHeaderDropdown from "../../components/EmployeeHeaderDropdown";
import { useAuth } from "../../contexts/AuthContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function EmployeeAdminLayout() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#0f172a]">
        <ActivityIndicator size="large" color="#0EA5E9" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  const role = user.role?.toLowerCase();
  if (role !== "mechanic" && role !== "employee" && role !== "admin") {
    return <Redirect href="/(tabs)/home" />;
  }

  const headerLabels = {
    staff: { title: "Dashboard", subtitle: "Overview of assigned work" },
    assigned: { title: "Assigned", subtitle: "Current work orders" },
    servicecenter: {
      title: "Service Center",
      subtitle: "Service requests and status",
    },
    billing: { title: "Billing", subtitle: "Invoices, payments, and receipts" },
    completed: { title: "Completed", subtitle: "Completed work archive" },
  };

  const renderHeaderTitle = (routeName: string) => {
    const headerInfo = headerLabels[routeName] ?? {
      title: "Cars",
      subtitle: "Employee control panel",
    };

    return (
      <View className="flex-row items-center">
        <Image
          source={require("../../assets/images/logo_no_bg.png")}
          className="w-14 h-10"
          resizeMode="contain"
        />
        <View className="ml-3">
          <Text className="text-2xl font-black text-white">
            {headerInfo.title}
          </Text>
          {/* <Text className="text-[11px] text-slate-400 uppercase tracking-[0.15px]">
            {headerInfo.subtitle}
          </Text> */}
        </View>
      </View>
    );
  };

  const renderHeaderRight = (routeName: string) => (
    <View className="flex-row items-center gap-3 pr-2">
      <TouchableOpacity
        onPress={() => router.push("/(employee)/staff")}
        activeOpacity={0.7}
        className="p-2 bg-[#111827] rounded-2xl border border-[#334155]"
      >
        <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
      </TouchableOpacity>
      <EmployeeHeaderDropdown />
    </View>
  );

  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: "#0EA5E9",
        tabBarInactiveTintColor: "#64748b",
        tabBarStyle: {
          backgroundColor: "#0f172a",
          borderTopColor: "#334155",
          borderTopWidth: 1,
          height: 80 + insets.bottom,
          paddingBottom: 20 + insets.bottom,
          paddingTop: 8,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          marginTop: 2,
        },
        headerStyle: {
          backgroundColor: "#0f172a",
        },
        headerTitle: () => renderHeaderTitle(route.name),
        headerTitleAlign: "left",
        headerRight: () => renderHeaderRight(route.name),
        headerTintColor: "#fff",
      })}
    >
      <Tabs.Screen
        name="staff"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="apps" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="assigned"
        options={{
          title: "Assigned",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="clipboard" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="servicecenter"
        options={{
          title: "Center",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="build" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="billing"
        options={{
          title: "Billing",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="completed"
        options={{
          title: "Completed",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkmark-done" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="service-details"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="add-billing"
        options={{
          href: null,
          title: "New Bill",
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="add-parts"
        options={{
          href: null,
          title: "Add Parts",
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
