import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { apiService } from "../../services/api";

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
  const [notifications, setNotifications] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const [bookings, appointments] = await Promise.all([
          apiService.getBookings().catch(() => []),
          apiService.getAppointments().catch(() => [])
        ]);

        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const isWithin24h = (dateStr: string) => {
          if (!dateStr) return false;
          const d = new Date(dateStr);
          return d >= twentyFourHoursAgo && d <= now;
        };
        
        const recentBookings = (bookings || []).filter((b: any) => 
          isWithin24h(b.createdAt || b.created_at || b.date || "")
        ).map((b: any) => ({
          id: `b-${b.id || b._id}`,
          displayId: b.bookingId || b.id || b._id,
          name: b.name || b.customerName || 'Customer',
          title: "New Booking Added",
          message: `${b.brand || 'Vehicle'} ${b.model || ''} - ${b.name || 'Customer'}`,
          time: new Date(b.createdAt || b.created_at || new Date()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          icon: "car-outline",
          color: "bg-blue-500/20",
          iconColor: "#0EA5E9"
        }));

        const recentAppts = (appointments || []).filter((a: any) => 
          isWithin24h(a.createdAt || a.created_at || a.preferredDate || "")
        ).map((a: any) => ({
          id: `a-${a.id || a._id}`,
          displayId: a.appointmentId || a.id || a._id,
          name: a.name || a.customerName || 'Customer',
          title: "Appointment Received",
          message: `APT-${a.id || a._id} from ${a.name || 'Customer'}`,
          time: new Date(a.createdAt || a.created_at || new Date()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          icon: "time-outline",
          color: "bg-purple-500/20",
          iconColor: "#a855f7"
        }));

        setNotifications([...recentBookings, ...recentAppts]);
      } catch (e) {
        console.error("Failed to fetch notifications:", e);
      }
    };
    fetchNotifications();
  }, []);

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
            activeOpacity={0.7}
            style={{ width: 40, height: 40, borderRadius: 16, backgroundColor: '#0f172a', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons
              name="notifications-outline"
              size={20}
              color="#FFFFFF"
            />
            {/* Notification Badge with Count */}
            {notifications.length > 0 && (
              <View style={{ position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18, backgroundColor: '#f97316', borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderWidth: 2, borderColor: '#0f172a' }} pointerEvents="none">
                <Text style={{ color: '#fff', fontSize: 9, fontWeight: '900' }}>{notifications.length > 99 ? '99+' : notifications.length}</Text>
              </View>
            )}
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
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
          <View className="bg-slate-900 border border-white/10 rounded-3xl w-72 overflow-hidden shadow-2xl">
            <View className="p-4 border-b border-white/5 bg-gradient-to-r from-sky-500/10 to-transparent">
              <Text className="text-white font-black text-sm">
                Notifications
              </Text>
              <Text className="text-slate-500 text-[9px] font-bold uppercase tracking-wider mt-0.5">
                {notifications.length} new updates today
              </Text>
            </View>

            {/* Notification Items */}
            <ScrollView style={{ maxHeight: 300 }}>
              {notifications.length === 0 ? (
                 <View className="p-8 items-center justify-center opacity-50">
                    <Ionicons name="notifications-off-outline" size={32} color="white" />
                    <Text className="text-white text-[10px] uppercase font-black tracking-widest mt-3">All caught up!</Text>
                 </View>
              ) : (
                notifications.map((n) => (
                  <TouchableOpacity key={n.id} className="p-4 border-b border-white/5 active:bg-slate-800/50">
                    <View className="flex-row gap-3 items-start">
                      <View className={`w-8 h-8 rounded-full ${n.color} items-center justify-center mt-0.5 flex-shrink-0`}>
                        <Ionicons name={n.icon} size={16} color={n.iconColor} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-white font-bold text-sm">
                          {n.name}
                        </Text>
                        <Text className="text-white text-[10px] font-black mt-0.5">
                          {n.displayId}
                        </Text>
                        <Text className="text-slate-500 text-xs mt-0.5">
                          {n.message}
                        </Text>
                        <Text className="text-slate-600 text-[9px] mt-1 font-black uppercase tracking-widest">
                          {n.time}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            <View className="h-px bg-white/5" />
            <TouchableOpacity className="p-4 items-center active:bg-slate-800/50">
              <Text className="text-white font-bold text-sm">
                View All Notifications
              </Text>
            </TouchableOpacity>
          </View>
          </TouchableOpacity>
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
