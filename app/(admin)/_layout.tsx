import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";

const MenuItem = ({ icon, title, onPress, color = "#94a3b8" }: any) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex-row items-center px-4 py-4 gap-4"
  >
    <Ionicons name={icon} size={20} color={color} />
    <Text
      style={{ color }}
      className="font-black text-xs uppercase tracking-widest"
    >
      {title}
    </Text>
  </TouchableOpacity>
);

function AdminHeader({ routeName }: { routeName: string }) {
  const { user, logout } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setMenuVisible(false);
    await logout();
    router.replace("/(auth)/login");
  };

  const initial = (user?.username || "A").charAt(0).toUpperCase();

  // Route titles mapping
  const headerLabels: Record<string, { title: string; subtitle: string }> = {
    dashboard: { title: "Dashboard", subtitle: "Overview & analytics" },
    bookings: { title: "Bookings", subtitle: "Service requests" },
    "assign-services": {
      title: "Assign Services",
      subtitle: "Staff assignments",
    },
    services: { title: "Services", subtitle: "Service management" },
    products: { title: "Products", subtitle: "Inventory management" },
    vehicles: { title: "Vehicles", subtitle: "Vehicle records" },
    users: { title: "Users", subtitle: "User management" },
    settings: { title: "Settings", subtitle: "Admin settings" },
  };

  const headerInfo = headerLabels[routeName] ?? {
    title: "Admin Panel",
    subtitle: "Management Suite",
  };

  return (
    <View className="bg-slate-950 px-6 pt-14 pb-5 border-b border-white/5">
      {/* Main Header */}
      <View className="flex-row justify-between items-center">
        {/* Left: Logo & Title */}
        <View className="flex-1 flex-row items-center gap-3">
          <Image
            source={require("../../assets/images/logo_no_bg.png")}
            className="w-12 h-10"
            resizeMode="contain"
          />
          <View className="flex-1">
            <Text className="text-2xl font-black text-white tracking-tight">
              {headerInfo.title}
            </Text>
            <Text className="text-slate-500 text-[10px] font-black uppercase tracking-wider mt-0.5">
              {headerInfo.subtitle}
            </Text>
          </View>
        </View>

        {/* Right: Notification & Profile */}
        <View className="flex-row items-center gap-2">
          {/* Notification Bell */}
          <TouchableOpacity
            onPress={() => setNotificationVisible(true)}
            className="relative"
          >
            <View className="w-10 h-10 rounded-2xl bg-slate-900 border border-white/10 items-center justify-center active:bg-slate-800">
              <Ionicons
                name="notifications-outline"
                size={20}
                color="#FFFFFF"
              />
              {/* Notification Badge */}
              <View className="absolute top-1 right-1 w-2.5 h-2.5 bg-orange-500 rounded-full shadow-lg shadow-orange-500/50" />
            </View>
          </TouchableOpacity>

          {/* Profile Avatar */}
          <TouchableOpacity
            onPress={() => setMenuVisible(true)}
            className="w-10 h-10 rounded-2xl bg-primary items-center justify-center border border-sky-400/30 active:opacity-90"
          >
            <Text className="text-white font-black text-sm">{initial}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Notifications Modal */}
      <Modal visible={notificationVisible} transparent animationType="fade">
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setNotificationVisible(false)}
          className="flex-1 bg-black/60 items-end pr-6 pt-24"
        >
          <View className="bg-slate-900 border border-white/10 rounded-3xl w-72 overflow-hidden shadow-2xl">
            <View className="p-4 border-b border-white/5 bg-gradient-to-r from-sky-500/10 to-transparent">
              <Text className="text-white font-black text-sm">
                Notifications
              </Text>
              <Text className="text-slate-500 text-[9px] font-bold uppercase tracking-wider mt-0.5">
                3 new updates
              </Text>
            </View>

            {/* Notification Items */}
            <TouchableOpacity className="p-4 border-b border-white/5 active:bg-slate-800/50">
              <View className="flex-row gap-3 items-start">
                <View className="w-8 h-8 rounded-full bg-blue-500/20 items-center justify-center mt-0.5 flex-shrink-0">
                  <Ionicons name="calendar" size={16} color="#0EA5E9" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-bold text-sm">
                    New Booking
                  </Text>
                  <Text className="text-slate-500 text-xs mt-0.5">
                    Vehicle BKG1712345 registered
                  </Text>
                  <Text className="text-slate-600 text-[9px] mt-1">
                    2 mins ago
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity className="p-4 border-b border-white/5 active:bg-slate-800/50">
              <View className="flex-row gap-3 items-start">
                <View className="w-8 h-8 rounded-full bg-emerald-500/20 items-center justify-center mt-0.5 flex-shrink-0">
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-bold text-sm">
                    Service Completed
                  </Text>
                  <Text className="text-slate-500 text-xs mt-0.5">
                    TN01AB1234 - Ready for pickup
                  </Text>
                  <Text className="text-slate-600 text-[9px] mt-1">
                    15 mins ago
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity className="p-4 active:bg-slate-800/50">
              <View className="flex-row gap-3 items-start">
                <View className="w-8 h-8 rounded-full bg-orange-500/20 items-center justify-center mt-0.5 flex-shrink-0">
                  <Ionicons name="alert-circle" size={16} color="#F59E0B" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-bold text-sm">
                    Payment Pending
                  </Text>
                  <Text className="text-slate-500 text-xs mt-0.5">
                    Invoice INV-2024-001 due today
                  </Text>
                  <Text className="text-slate-600 text-[9px] mt-1">
                    1 hour ago
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <View className="h-px bg-white/5" />
            <TouchableOpacity className="p-4 items-center active:bg-slate-800/50">
              <Text className="text-sky-500 font-bold text-sm">
                View All Notifications
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Profile Menu Modal */}
      <Modal visible={menuVisible} transparent animationType="fade">
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
          className="flex-1 bg-black/60 items-end pr-6 pt-24"
        >
          <View className="bg-slate-900 border border-white/10 rounded-3xl w-56 overflow-hidden shadow-2xl">
            <View className="p-4 border-b border-white/5 bg-gradient-to-r from-sky-500/10 to-transparent">
              <Text className="text-white font-black text-xs">
                {user?.username}
              </Text>
              <Text className="text-slate-500 text-[8px] font-bold uppercase tracking-wider mt-0.5">
                {user?.email}
              </Text>
            </View>

            <MenuItem
              icon="person-outline"
              title="Profile"
              onPress={() => {
                setMenuVisible(false);
                router.push("/(admin)/profile");
              }}
            />
            <MenuItem
              icon="home-outline"
              title="Home View"
              onPress={() => {
                setMenuVisible(false);
                router.replace("/(tabs)/home");
              }}
            />
            <MenuItem
              icon="settings-outline"
              title="Settings"
              onPress={() => setMenuVisible(false)}
            />

            <View className="h-px bg-white/5 mx-4" />

            <MenuItem
              icon="log-out-outline"
              title="Logout"
              onPress={handleLogout}
              color="#ef4444"
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

export default function AdminLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#0f172a",
        }}
      >
        <ActivityIndicator size="large" color="#0EA5E9" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  const role = user.role?.toLowerCase();
  if (role === "mechanic" || role === "employee") {
    return <Redirect href="/(employee)/staff" />;
  } else if (role !== "admin") {
    return <Redirect href="/(tabs)/home" />;
  }

  return (
    <Tabs
      screenOptions={({ route }) => ({
        header: () => <AdminHeader routeName={route.name} />,
        tabBarActiveTintColor: "#0EA5E9",
        tabBarInactiveTintColor: "#64748b",
        tabBarStyle: {
          backgroundColor: "#1e293b",
          borderTopColor: "#334155",
          borderTopWidth: 1,
        },
      })}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: "Bookings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="assign-services"
        options={{
          title: "Assign",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-add-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: "Services",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="construct-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: "Products",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="vehicles"
        options={{
          title: "Vehicles",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="car-sport" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: "Users",
          href: null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          href: null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
