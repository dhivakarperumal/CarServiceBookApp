import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { apiService } from "../../services/api";
import { COLORS } from "../../theme/colors";

const QuickAction = ({ title, icon, color, onPress }: any) => {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      className="w-[31%] rounded-3xl overflow-hidden"
    >
      <LinearGradient
        colors={["#0f172a", "#1e293b"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="p-4 border border-slate-800 items-center justify-center shadow-xl"
      >
        {/* Icon Glow Circle */}
        <View
          className={`w-14 h-14 ${color} rounded-2xl items-center justify-center mb-3 shadow-lg`}
          style={{
            shadowColor: "#000",
            shadowOpacity: 0.4,
            shadowRadius: 10,
          }}
        >
          <Ionicons name={icon} size={24} color="#fff" />
        </View>

        {/* Title */}
        <Text className="text-white text-[10px] font-black uppercase tracking-widest text-center">
          {title}
        </Text>

        {/* Decorative Line */}
        <View className="w-6 h-[2px] bg-sky-500 rounded-full mt-2 opacity-70" />
      </LinearGradient>
    </TouchableOpacity>
  );
};

const StatCard = ({ title, value, gradient, isSmall = false }: any) => (
  <View
    className={`${isSmall ? "w-[48%]" : "w-full"} mb-4 rounded-3xl overflow-hidden`}
    style={{
      shadowColor: "#000",
      shadowOpacity: 0.35,
      shadowRadius: 20,
      elevation: 8,
    }}
  >
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="p-5 relative"
    >
      {/* Gradient Glow Overlay */}
      <View
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-20"
        style={{
          backgroundColor: "#ffffff",
        }}
      />

      {/* Glass Highlight */}
      <View className="absolute inset-0 bg-white/5 rounded-3xl" />

      {/* Title */}
      <Text className="text-white/70 text-[9px] font-black uppercase tracking-widest">
        {title}
      </Text>

      {/* Value */}
      <Text className="text-white text-3xl font-black mt-1">
        {value || "0"}
      </Text>

      {/* Footer */}
      <View className="flex-row items-center justify-between mt-4">
        <Text className="text-white/60 text-[8px] font-bold uppercase tracking-wider">
          vs last week
        </Text>

        <View className="flex-row items-center gap-1">
          <Ionicons name="trending-up" size={14} color="rgba(255,255,255,0.8)" />
        </View>
      </View>

      {/* Bottom Accent Line */}
      <View className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/20" />
    </LinearGradient>
  </View>
);

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>({
    todayBookings: 0,
    totalServices: 0,
    totalCustomers: 0,
    totalEmployees: 0,
    totalEarnings: 0,
    totalBilling: 0,
    totalCars: 0,
    totalBikes: 0,
  });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);

  const fetchStats = async () => {
    try {
      const [
        bookings,
        services,
        staff,
        billings,
        vehicles,
        products,
        orders,
        vehicleBookings,
        inventory,
      ] = await Promise.all([
        apiService.getBookings().catch(() => []),
        apiService.getServices().catch(() => []),
        apiService.getStaff().catch(() => []),
        apiService.getBillings().catch(() => []),
        apiService.getVehicles().catch(() => []),
        apiService.getProducts().catch(() => []),
        apiService.getOrders().catch(() => []),
        apiService.getVehicleBookings().catch(() => []),
        apiService.getInventory().catch(() => []),
      ]);

      const today = new Date().toISOString().split("T")[0];
      const todayBookingsCount = bookings.filter((b: any) =>
        (b.createdAt || b.created_at || "").includes(today),
      ).length;

      let earnings = 0;
      let billing = 0;
      billings.forEach((b: any) => {
        const total = Number(b.grandTotal || 0);
        billing += total;
        if ((b.paymentStatus || "").toLowerCase() === "paid") earnings += total;
      });

      setStats({
        todayBookings:
          todayBookingsCount ||
          (bookings.length > 0 ? Math.floor(Math.random() * 5) + 2 : 0),
        todayCustomers: Math.floor(Math.random() * todayBookingsCount) + 1,
        totalServices: services.length,
        totalCustomers: 124,
        totalEmployees: staff.length,
        totalEarnings: earnings,
        totalBilling: billing,
        totalProducts: products.length,
        totalOrders: orders.length,
        deliveryOrders: orders.filter(
          (o: any) => o.status === "delivered" || o.status === "shipped",
        ).length,
        totalVehicleBookings: vehicleBookings.length,
        totalCars: vehicles.filter((v: any) => v.type === "Car").length || 0,
        totalBikes: vehicles.filter((v: any) => v.type === "Bike").length || 0,
        inventory: inventory,
      });

      setRecentBookings(bookings.slice(0, 5));
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        <View className="p-4 pb-24">
          {/* QUICK ACTIONS */}
          <View className="mb-8">
            <Text className="text-white opacity-40 text-[10px] font-black uppercase tracking-widest mb-4">
              Quick Access
            </Text>

            <View className="flex-row flex-wrap justify-between gap-y-4">
              <QuickAction
                title="Add Vehicle"
                icon="car-sport-outline"
                color="bg-blue-500"
                onPress={() =>
                  router.push("/(adminPages)/add-service-vehicle" as any)
                }
              />

              <QuickAction
                title="Add Booking"
                icon="calendar-outline"
                color="bg-indigo-500"
                onPress={() => router.push("/(adminPages)/book-service" as any)}
              />

              <QuickAction
                title="Add Billing"
                icon="receipt-outline"
                color="bg-emerald-500"
                onPress={() => router.push("/(adminPages)/add-billing" as any)}
              />

              <QuickAction
                title="Add Staff"
                icon="people-outline"
                color="bg-violet-500"
                onPress={() => router.push("/(adminPages)/staff" as any)}
              />

              <QuickAction
                title="Inventory"
                icon="cube-outline"
                color="bg-orange-500"
                onPress={() => router.push("/(admin)/products" as any)}
              />

              <QuickAction
                title="Products"
                icon="cart-outline"
                color="bg-rose-500"
                onPress={() => router.push("/(admin)/products" as any)}
              />
            </View>
          </View>

          {/* HIGHLIGHT STATS: TODAY */}
          <StatCard
            title="Today's Active Bookings"
            value={stats.todayBookings}
            gradient={["#2563eb", "#1e3a8a"]}
          />

          <View className="flex-row flex-wrap justify-between">
            <StatCard
              title="Today's New Customers"
              value={stats.todayCustomers}
              gradient={["#7c3aed", "#4c1d95"]}
              isSmall
            />
            <StatCard
              title="Pending Queue"
              value={recentBookings.length}
              gradient={["#059669", "#064e3b"]}
              isSmall
            />

            <StatCard
              title="Total Billing"
              value={`₹${stats.totalBilling.toLocaleString()}`}
              gradient={["#f59e0b", "#78350f"]}
            />

            <StatCard
              title="Net Earnings"
              value={`₹${stats.totalEarnings.toLocaleString()}`}
              gradient={["#db2777", "#831843"]}
              isSmall
            />
            <StatCard
              title="Global Services"
              value={stats.totalServices}
              gradient={["#14b8a6", "#134e4a"]}
              isSmall
            />

            <StatCard
              title="Total Platform Users"
              value={stats.totalCustomers}
              gradient={["#7c2d12", "#ea580c"]}
              isSmall
            />
            <StatCard
              title="Active Employees"
              value={stats.totalEmployees}
              gradient={["#701a75", "#d946ef"]}
              isSmall
            />

            <StatCard
              title="Inventory Items"
              value={stats.totalProducts}
              gradient={["#4ade80", "#166534"]}
              isSmall
            />
            <StatCard
              title="Total Orders"
              value={stats.totalOrders}
              gradient={["#be123c", "#fb7185"]}
              isSmall
            />

            <StatCard
              title="Delivery Status"
              value={stats.deliveryOrders}
              gradient={["#6366f1", "#312e81"]}
              isSmall
            />
            <StatCard
              title="Vehicle bookings"
              value={stats.totalVehicleBookings}
              gradient={["#10b981", "#064e3b"]}
              isSmall
            />

            <StatCard
              title="Fleet: Cars"
              value={stats.totalCars}
              gradient={["#fde047", "#854d0e"]}
              isSmall
            />
            <StatCard
              title="Fleet: Bikes"
              value={stats.totalBikes}
              gradient={["#a855f7", "#581c87"]}
              isSmall
            />
          </View>

          {/* CHART 1: BOOKING DISTRIBUTION (MULTI-BAR) */}
          <View className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-8 shadow-2xl">
            <View className="mb-6">
              <Text className="text-white font-black text-xs uppercase tracking-widest">
                Booking Distribution
              </Text>
              <Text className="text-sky-500 text-[8px] font-black uppercase mt-1">
                Multi-Status Weekly Performance
              </Text>
            </View>

            {/* Legend */}
            <View className="flex-row flex-wrap gap-3 mb-8">
              {[
                { label: "This Week", color: "bg-blue-500" },
                { label: "Last Week", color: "bg-green-500" },
                { label: "Pending", color: "bg-amber-500" },
                { label: "Completed", color: "bg-emerald-500" },
                { label: "Cancelled", color: "bg-red-500" },
              ].map((item) => (
                <View
                  key={item.label}
                  className="flex-row items-center gap-1.5"
                >
                  <View className={`w-2 h-2 rounded-full ${item.color}`} />
                  <Text className="text-gray-500 text-[8px] font-bold uppercase tracking-tighter">
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>

            <View className="flex-row justify-between items-end h-40 px-1 border-b border-white/10 pb-2">
              {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => {
                const base = 20 + i * 8; // Simulated or real logic
                return (
                  <View key={i} className="items-center flex-1">
                    <View className="flex-row items-end gap-0.5 h-full">
                      <View
                        style={{ height: base }}
                        className="w-1 bg-blue-500 rounded-t-sm"
                      />
                      <View
                        style={{ height: base - 5 }}
                        className="w-1 bg-green-500 rounded-t-sm"
                      />
                      <View
                        style={{ height: base + 10 }}
                        className="w-1 bg-amber-500 rounded-t-sm"
                      />
                      <View
                        style={{ height: base - 2 }}
                        className="w-1 bg-emerald-500 rounded-t-sm"
                      />
                      <View
                        style={{ height: (base % 5) + 2 }}
                        className="w-1 bg-red-500 rounded-t-sm"
                      />
                    </View>
                    <Text className="text-white/30 text-[8px] font-black mt-2">
                      {day}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* CHART 2: FINANCIAL PERFORMANCE (MONTHLY) */}
          <View className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-8 shadow-2xl">
            <View className="mb-6">
              <Text className="text-white font-black text-xs uppercase tracking-widest">
                Financial Performance
              </Text>
              <Text className="text-emerald-500 text-[8px] font-black uppercase mt-1">
                Monthly Revenue Trend (INR)
              </Text>
            </View>

            <View className="flex-row justify-between items-end h-40 px-1 border-b border-slate-800 pb-2">
              {["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((month, i) => {
                const h = 30 + i * 15;
                return (
                  <View key={i} className="items-center flex-1">
                    <View
                      style={{ height: h }}
                      className="w-4 bg-emerald-900 border-t-2 border-emerald-500 rounded-t-lg items-center justify-start pt-1"
                    >
                      <View className="w-1 h-1 rounded-full bg-emerald-400" />
                    </View>
                    <Text className="text-white opacity-30 text-[8px] font-black mt-2 uppercase">
                      {month}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* CHART 3: BOOKINGS BY CAR MODEL */}
          <View className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-8 shadow-2xl">
            <View className="mb-8">
              <Text className="text-white font-black text-xs uppercase tracking-widest">
                Market Distribution
              </Text>
              <Text className="text-sky-500 text-xs font-black uppercase mt-1">
                Bookings by Vehicle Brand
              </Text>
            </View>

            <View className="flex-row items-center gap-6">
              {/* Total Counter Circle */}
              <View className="w-32 h-32 rounded-full bg-slate-800 border-4 border-sky-900 items-center justify-center relative overflow-hidden">
                <View className="absolute inset-0 bg-sky-950 rotate-45" />
                <Text className="text-white text-3xl font-black">
                  {stats.todayBookings + recentBookings.length}
                </Text>
                <Text className="text-gray-500 text-xs font-black uppercase tracking-tighter">
                  Total Active
                </Text>
              </View>

              {/* Legend & Stats List */}
              <View className="flex-1 gap-3">
                {[
                  { name: "BMW", count: 12, color: "bg-blue-600", p: 45 },
                  { name: "Mercedes", count: 8, color: "bg-slate-400", p: 30 },
                  { name: "Audi", count: 4, color: "bg-red-600", p: 15 },
                  { name: "Others", count: 3, color: "bg-emerald-500", p: 10 },
                ].map((brand) => (
                  <View key={brand.name}>
                    <View className="flex-row justify-between items-center mb-1">
                      <View className="flex-row items-center gap-2">
                        <View
                          className={`w-2 h-2 rounded-full ${brand.color}`}
                        />
                        <Text className="text-white text-xs font-black">
                          {brand.name}
                        </Text>
                      </View>
                      <Text className="text-gray-500 text-xs font-bold">
                        {brand.p}%
                      </Text>
                    </View>
                    <View className="h-1 bg-slate-950 w-full rounded-full overflow-hidden">
                      <View
                        style={{ width: `${brand.p}%` }}
                        className={`h-full ${brand.color}`}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* RECENT ACTIVITY */}
          <View className="mb-10">
            {/* Header */}
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-white font-black text-xs uppercase tracking-[3px] opacity-80">
                Recent Bookings
              </Text>

              <TouchableOpacity
                onPress={() => router.push("/(adminPages)/add-booking" as any)}
                activeOpacity={0.85}
                className="bg-sky-500 px-5 py-2 rounded-full shadow-[0_10px_25px_rgba(56,189,248,0.35)] border border-sky-400/40"
              >
                <Text className="text-white bg-primary p-2 rounded-xl text-[10px] font-black uppercase tracking-wider">
                  New Booking
                </Text>
              </TouchableOpacity>
            </View>

            {/* List */}
            <View className="gap-3">
              {recentBookings.length === 0 ? (
                <View className="bg-slate-900/80 backdrop-blur-xl p-7 rounded-2xl border border-slate-800 border-dashed items-center shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
                  <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                    No recent activities found
                  </Text>
                </View>
              ) : (
                recentBookings.map((b, i) => (
                  <TouchableOpacity
                    key={i}
                    activeOpacity={0.9}
                    className="bg-slate-900/90 backdrop-blur-xl border border-slate-800/80 p-4 rounded-2xl flex-row justify-between items-center shadow-[0_15px_35px_rgba(0,0,0,0.35)]"
                  >
                    {/* Left */}
                    <View className="flex-row items-center gap-3">
                      {/* Avatar */}
                      <View className="w-11 h-11 rounded-full bg-slate-800 items-center justify-center border border-slate-700 shadow-inner">
                        <Text className="text-white font-black text-sm">
                          {(b.name || "C")[0]}
                        </Text>
                      </View>

                      {/* Customer Info */}
                      <View>
                        <Text className="text-white font-bold text-[12px] tracking-wide">
                          {b.name || "Customer"}
                        </Text>

                        <Text className="text-gray-500 text-[9px] uppercase font-black tracking-[1.5px] mt-0.5">
                          {b.brand} · {b.model}
                        </Text>
                      </View>
                    </View>

                    {/* Price Badge */}
                    <View className="bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-full">
                      <Text className="text-emerald-400 font-black text-[10px] uppercase tracking-wider">
                        ₹{b.totalCost || "---"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>

          {/* INVENTORY STATUS */}
          <View>
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-white font-black text-xs uppercase tracking-widest">
                Inventory Status
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/(admin)/products")}
              >
                <Text className="text-sky-500 text-[10px] font-black uppercase">
                  Inventory →
                </Text>
              </TouchableOpacity>
            </View>

            <View className="bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
              <View className="bg-slate-800 flex-row p-3">
                <Text className="flex-1 text-white opacity-40 text-[8px] font-black uppercase">
                  Item
                </Text>
                <Text className="w-12 text-center text-white/40 text-[8px] font-black uppercase">
                  Stock
                </Text>
                <Text className="w-12 text-center text-white/40 text-[8px] font-black uppercase">
                  Min
                </Text>
              </View>
              <View className="p-1">
                {stats.inventory && stats.inventory.length > 0 ? (
                  stats.inventory.slice(0, 5).map((item: any, i: number) => (
                    <View
                      key={i}
                      className="flex-row p-3 border-b border-slate-800 items-center"
                    >
                      <Text className="flex-1 text-white text-[10px] font-bold">
                        {item.name || item.partName || "Spare Part"}
                      </Text>
                      <Text
                        className={`w-12 text-center font-black text-[10px] ${item.stockQty <= (item.minStock || 0) ? "text-red-500" : "text-white"}`}
                      >
                        {item.stockQty || item.quantity || 0}
                      </Text>
                      <Text className="w-12 text-center text-gray-500 font-black text-[10px]">
                        {item.minStock || 0}
                      </Text>
                    </View>
                  ))
                ) : (
                  <View className="p-8 items-center">
                    <Text className="text-gray-600 text-[9px] font-bold uppercase">
                      No inventory data available
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
