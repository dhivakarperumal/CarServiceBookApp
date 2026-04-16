import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
   SafeAreaView,
   ScrollView,
   Switch,
   Text,
   TouchableOpacity,
   View,
} from "react-native";
import { COLORS } from "../../theme/colors";

export default function AdminSettings() {
  const router = useRouter();
  const [darkTheme, setDarkTheme] = React.useState(true);
  const [notifications, setNotifications] = React.useState(true);
  const [maintenanceMode, setMaintenanceMode] = React.useState(false);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingBottom: 100, flexGrow: 1 }}
      >
        <View className="gap-8">
          {/* ── Section: Account & Directory ── */}
          <Section label="Administration">
            <TouchableOpacity
              onPress={() => router.push("/(adminPages)/users" as any)}
              className="flex-row items-center justify-between p-5 bg-card border border-slate-700 rounded-3xl mt-2 shadow-2xl"
            >
              <View className="flex-row items-center gap-4 flex-1">
                <View className="w-12 h-12 bg-card rounded-2xl items-center justify-center border border-slate-700 shadow-lg shadow-primary/10">
                  <Ionicons name="people-outline" size={24} color={COLORS.primary} />
                </View>
                <View>
                  <Text className="text-white font-black text-sm uppercase tracking-tighter">Users & Directory</Text>
                  <Text className="text-text-secondary text-[8px] font-black uppercase tracking-widest mt-1">Manage Customers & Staff</Text>
                </View>
              </View>
              <View className="bg-card p-2 rounded-full border border-slate-700">
                <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
              </View>
            </TouchableOpacity>
          </Section>

          {/* ── Section: Product Management ── */}
          <Section label="Store Management">
            {/* Products Inventory */}
            <TouchableOpacity
              onPress={() => router.push("/(adminPages)/products" as any)}
              className="flex-row items-center justify-between p-5 bg-card border border-slate-700 rounded-3xl mt-2 shadow-2xl"
            >
              <View className="flex-row items-center gap-4 flex-1">
                <View className="w-12 h-12 bg-card rounded-2xl items-center justify-center border border-slate-700 shadow-lg shadow-primary/10">
                  <Ionicons name="grid-outline" size={24} color={COLORS.primary} />
                </View>
                <View>
                  <Text className="text-white font-black text-sm uppercase tracking-tighter">Products</Text>
                  <Text className="text-text-secondary text-[8px] font-black uppercase tracking-widest mt-1">Manage Store Items & Features</Text>
                </View>
              </View>
              <View className="bg-card p-2 rounded-full border border-slate-700">
                <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
              </View>
            </TouchableOpacity>

            {/* Stock Details */}
            <TouchableOpacity
              onPress={() => router.push("/(adminPages)/stock-details" as any)}
              className="flex-row items-center justify-between p-5 bg-card border border-slate-700 rounded-3xl mt-2 shadow-2xl"
            >
              <View className="flex-row items-center gap-4 flex-1">
                <View className="w-12 h-12 bg-card rounded-2xl items-center justify-center border border-slate-700 shadow-lg shadow-primary/10">
                  <Ionicons name="cube-outline" size={24} color={COLORS.primary} />
                </View>
                <View>
                  <Text className="text-white font-black text-sm uppercase tracking-tighter">Stock Details</Text>
                  <Text className="text-text-secondary text-[8px] font-black uppercase tracking-widest mt-1">Live Inventory Management</Text>
                </View>
              </View>
              <View className="bg-card p-2 rounded-full border border-slate-700">
                <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
              </View>
            </TouchableOpacity>

            {/* Product Billing */}
            <TouchableOpacity
              onPress={() => router.push("/(adminPages)/product-billing" as any)}
              className="flex-row items-center justify-between p-5 bg-card border border-slate-700 rounded-3xl mt-2 shadow-2xl"
            >
              <View className="flex-row items-center gap-4 flex-1">
                <View className="w-12 h-12 bg-card rounded-2xl items-center justify-center border border-slate-700 shadow-lg shadow-primary/10">
                  <Ionicons name="receipt-outline" size={24} color={COLORS.primary} />
                </View>
                <View>
                  <Text className="text-white font-black text-sm uppercase tracking-tighter">Product Billing</Text>
                  <Text className="text-text-secondary text-[8px] font-black uppercase tracking-widest mt-1">Generate Invoices & Bills</Text>
                </View>
              </View>
              <View className="bg-card p-2 rounded-full border border-slate-700">
                <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
              </View>
            </TouchableOpacity>
          </Section>

          {/* ── Section: Finance & Ledger ── */}
          <Section label="Finance">
            <TouchableOpacity
              onPress={() => router.push("/(adminPages)/billings" as any)}
              className="flex-row items-center justify-between p-5 bg-card border border-slate-700 rounded-3xl mt-2 shadow-2xl"
            >
              <View className="flex-row items-center gap-4 flex-1">
                <View className="w-12 h-12 bg-card rounded-2xl items-center justify-center border border-slate-700 shadow-lg shadow-success/10">
                  <Ionicons name="document-text-outline" size={24} color={COLORS.success} />
                </View>
                <View>
                  <Text className="text-white font-black text-sm uppercase tracking-tighter">Billings Ledger</Text>
                  <Text className="text-text-secondary text-[8px] font-black uppercase tracking-widest mt-1">Full Invoicing History</Text>
                </View>
              </View>
              <View className="bg-card p-2 rounded-full border border-slate-700">
                <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
              </View>
            </TouchableOpacity>
          </Section>

          {/* ── Section: Workshop & Service ── */}
          <Section label="Workshop Management">
            {/* Completed History */}
            <TouchableOpacity
              onPress={() => router.push('/(adminPages)/completed-history' as any)}
              className="flex-row items-center justify-between p-5 bg-card border border-slate-700 rounded-3xl mt-2 shadow-2xl"
            >
              <View className="flex-row items-center gap-4 flex-1">
                <View className="w-12 h-12 bg-emerald-950 rounded-2xl items-center justify-center border border-emerald-900 shadow-lg shadow-emerald-500/10">
                  <Ionicons name="checkmark-done-outline" size={24} color="#10b981" />
                </View>
                <View>
                  <Text className="text-white font-black text-sm uppercase tracking-tighter">Completed History</Text>
                  <Text className="text-gray-500 text-[8px] font-black uppercase tracking-widest mt-1">Archived Protocols</Text>
                </View>
              </View>
              <View className="bg-card p-2 rounded-full border border-slate-700">
                <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
              </View>
            </TouchableOpacity>

            {/* Spare Parts Inventory */}
            <TouchableOpacity
              onPress={() => router.push("/(adminPages)/inventory" as any)}
              className="flex-row items-center justify-between p-5 bg-card border border-slate-700 rounded-3xl mt-2 shadow-2xl"
            >
              <View className="flex-row items-center gap-4 flex-1">
                <View className="w-12 h-12 bg-card rounded-2xl items-center justify-center border border-slate-700 shadow-lg shadow-primary/10">
                  <Ionicons name="build-outline" size={24} color={COLORS.primary} />
                </View>
                <View>
                  <Text className="text-white font-black text-sm uppercase tracking-tighter">Spare Parts Inventory</Text>
                  <Text className="text-text-secondary text-[8px] font-black uppercase tracking-widest mt-1">Workshop Spares Management</Text>
                </View>
              </View>
              <View className="bg-card p-2 rounded-full border border-slate-700">
                <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
              </View>
            </TouchableOpacity>

            {/* Vehicles Registry */}
            <TouchableOpacity
              onPress={() => router.push("/(adminPages)/vehicles" as any)}
              className="flex-row items-center justify-between p-5 bg-card border border-slate-700 rounded-3xl mt-2 shadow-2xl"
            >
              <View className="flex-row items-center gap-4 flex-1">
                <View className="w-12 h-12 bg-card rounded-2xl items-center justify-center border border-slate-700 shadow-lg shadow-primary/10">
                  <Ionicons name="car-sport-outline" size={24} color={COLORS.primary} />
                </View>
                <View>
                  <Text className="text-white font-black text-sm uppercase tracking-tighter">Vehicles Registry</Text>
                  <Text className="text-text-secondary text-[8px] font-black uppercase tracking-widest mt-1">Full Inventory Management</Text>
                </View>
              </View>
              <View className="bg-card p-2 rounded-full border border-slate-700">
                <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
              </View>
            </TouchableOpacity>

            {/* Car Service Catalog */}
            <TouchableOpacity
              onPress={() => router.push("/(adminPages)/car-services" as any)}
              className="flex-row items-center justify-between p-5 bg-card border border-slate-700 rounded-3xl mt-2 shadow-2xl"
            >
              <View className="flex-row items-center gap-4 flex-1">
                <View className="w-12 h-12 bg-card rounded-2xl items-center justify-center border border-slate-700 shadow-lg shadow-primary/10">
                  <Ionicons name="construct-outline" size={24} color={COLORS.primary} />
                </View>
                <View>
                  <Text className="text-white font-black text-sm uppercase tracking-tighter">Service Catalog</Text>
                  <Text className="text-text-secondary text-[8px] font-black uppercase tracking-widest mt-1">Manage Service Tiers</Text>
                </View>
              </View>
              <View className="bg-card p-2 rounded-full border border-slate-700">
                <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
              </View>
            </TouchableOpacity>
          </Section>

          {/* ── Section: Service Logistics ── */}
          <Section label="Logistics">
            {/* Service Areas */}
            <TouchableOpacity
              onPress={() => router.push("/(adminPages)/service-areas" as any)}
              className="flex-row items-center justify-between p-5 bg-card border border-slate-700 rounded-3xl mt-2 shadow-2xl"
            >
              <View className="flex-row items-center gap-4 flex-1">
                <View className="w-12 h-12 bg-card rounded-2xl items-center justify-center border border-slate-700 shadow-lg shadow-success/10">
                  <Ionicons name="location-outline" size={24} color={COLORS.success} />
                </View>
                <View>
                  <Text className="text-white font-black text-sm uppercase tracking-tighter">Service Areas</Text>
                  <Text className="text-text-secondary text-[8px] font-black uppercase tracking-widest mt-1">Coverage & Pincodes</Text>
                </View>
              </View>
              <View className="bg-card p-2 rounded-full border border-slate-700">
                <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
              </View>
            </TouchableOpacity>

            {/* Customer Reviews */}
            <TouchableOpacity
              onPress={() => router.push("/(adminPages)/reviews" as any)}
              className="flex-row items-center justify-between p-5 bg-card border border-slate-700 rounded-3xl mt-2 shadow-2xl"
            >
              <View className="flex-row items-center gap-4 flex-1">
                <View className="w-12 h-12 bg-card rounded-2xl items-center justify-center border border-slate-700 shadow-lg shadow-primary/10">
                  <Ionicons name="star-outline" size={24} color={COLORS.primary} />
                </View>
                <View>
                  <Text className="text-white font-black text-sm uppercase tracking-tighter">Customer Reviews</Text>
                  <Text className="text-text-secondary text-[8px] font-black uppercase tracking-widest mt-1">Ratings & Feedback</Text>
                </View>
              </View>
              <View className="bg-card p-2 rounded-full border border-slate-700">
                <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
              </View>
            </TouchableOpacity>

            {/* Pricing Packages */}
            <TouchableOpacity
              onPress={() => router.push("/(adminPages)/pricing" as any)}
              className="flex-row items-center justify-between p-5 bg-card border border-slate-700 rounded-3xl mt-2 shadow-2xl"
            >
              <View className="flex-row items-center gap-4 flex-1">
                <View className="w-12 h-12 bg-card rounded-2xl items-center justify-center border border-slate-700 shadow-lg shadow-primary/10">
                  <Ionicons name="pricetags-outline" size={24} color={COLORS.primary} />
                </View>
                <View>
                  <Text className="text-white font-black text-sm uppercase tracking-tighter">Pricing Packages</Text>
                  <Text className="text-text-secondary text-[8px] font-black uppercase tracking-widest mt-1">Service Plans</Text>
                </View>
              </View>
              <View className="bg-card p-2 rounded-full border border-slate-700">
                <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
              </View>
            </TouchableOpacity>
          </Section>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const Section = ({ label, children }: any) => (
  <View className="gap-3">
    <Text className="text-primary text-[10px] font-black uppercase tracking-[2px] ml-2">
      {label}
    </Text>
    <View className="gap-2">{children}</View>
  </View>
);

const SettingItem = ({ icon, title, subtitle, value, onValueChange }: any) => (
  <View className="flex-row items-center justify-between p-4 bg-card border border-slate-700 rounded-2xl">
    <View className="flex-row items-center gap-4 flex-1">
      <View className="p-2 bg-card rounded-xl border border-slate-700">
        <Ionicons name={icon} size={18} color={COLORS.primary} />
      </View>
      <View>
        <Text className="text-white font-bold text-sm">{title}</Text>
        {subtitle && (
          <Text className="text-text-secondary text-[8px] uppercase tracking-wide mt-0.5">
            {subtitle}
          </Text>
        )}
      </View>
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      thumbColor="#fff"
      trackColor={{ false: COLORS.slate700, true: COLORS.primary }}
    />
  </View>
);
