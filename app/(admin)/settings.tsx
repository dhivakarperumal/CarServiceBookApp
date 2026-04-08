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

export default function AdminSettings() {
  const router = useRouter();
  const [darkTheme, setDarkTheme] = React.useState(true);
  const [notifications, setNotifications] = React.useState(true);
  const [maintenanceMode, setMaintenanceMode] = React.useState(false);

   return (
      <SafeAreaView className="flex-1 bg-slate-950">
         <ScrollView 
            className="flex-1"
            contentContainerStyle={{ padding: 24, paddingBottom: 100, flexGrow: 1 }}
         >


            <View className="gap-6">


               <Section>

                  {/* ── Users & Directory ── */}
                  <TouchableOpacity
                     onPress={() => router.push('/(adminPages)/users' as any)}
                     className="flex-row items-center justify-between p-5 bg-slate-900 border border-slate-800 rounded-3xl mt-2 shadow-2xl"
                  >
                     <View className="flex-row items-center gap-4 flex-1">
                        <View className="w-12 h-12 bg-sky-950 rounded-2xl items-center justify-center border border-sky-900 shadow-lg shadow-sky-500/10">
                           <Ionicons name="people-outline" size={24} color="#0ea5e9" />
                        </View>
                        <View>
                           <Text className="text-white font-black text-sm uppercase tracking-tighter">Users & Directory</Text>
                           <Text className="text-gray-500 text-[8px] font-black uppercase tracking-widest mt-1">Manage Customers & Platform Accounts</Text>
                        </View>
                     </View>
                     <View className="bg-slate-800 p-2 rounded-full">
                        <Ionicons name="chevron-forward" size={16} color="#475569" />
                     </View>
                  </TouchableOpacity>

                  {/* ── Orders ── */}
                  <TouchableOpacity
                     onPress={() => router.push('/(adminPages)/orders' as any)}
                     className="flex-row items-center justify-between p-5 bg-slate-900 border border-slate-800 rounded-3xl mt-4 shadow-2xl"
                  >
                     <View className="flex-row items-center gap-4 flex-1">
                        <View className="w-12 h-12 bg-sky-950 rounded-2xl items-center justify-center border border-sky-900">
                           <Ionicons name="bag-handle-outline" size={24} color="#0ea5e9" />
                        </View>
                        <View>
                           <Text className="text-white font-black text-sm uppercase tracking-tighter">Orders</Text>
                           <Text className="text-gray-500 text-[8px] font-black uppercase tracking-widest mt-1">Manage & Track All Orders</Text>
                        </View>
                     </View>
                     <View className="bg-slate-800 p-2 rounded-full">
                        <Ionicons name="chevron-forward" size={16} color="#475569" />
                     </View>
                  </TouchableOpacity>

            {/* ── Product Stock Details ── */}
            <TouchableOpacity
              onPress={() => router.push("/(adminPages)/stock-details" as any)}
              className="flex-row items-center justify-between p-5 bg-slate-900 border border-slate-800 rounded-3xl mt-4 shadow-2xl"
            >
              <View className="flex-row items-center gap-4 flex-1">
                <View className="w-12 h-12 bg-sky-950 rounded-2xl items-center justify-center border border-sky-900">
                  <Ionicons name="cube-outline" size={24} color="#0ea5e9" />
                </View>
                <View>
                  <Text className="text-white font-black text-sm uppercase tracking-tighter">
                    Product Stock Details
                  </Text>
                  <Text className="text-gray-500 text-[8px] font-black uppercase tracking-widest mt-1">
                    Live Inventory Management
                  </Text>
                </View>
              </View>
              <View className="bg-slate-800 p-2 rounded-full">
                <Ionicons name="chevron-forward" size={16} color="#475569" />
              </View>
            </TouchableOpacity>

                  {/* ── Product Billing ── */}
                  <TouchableOpacity
                     onPress={() => router.push('/(adminPages)/product-billing' as any)}
                     className="flex-row items-center justify-between p-5 bg-slate-900 border border-slate-800 rounded-3xl mt-4 shadow-2xl"
                  >
                     <View className="flex-row items-center gap-4 flex-1">
                        <View className="w-12 h-12 bg-sky-950 rounded-2xl items-center justify-center border border-sky-900">
                           <Ionicons name="receipt-outline" size={24} color="#0ea5e9" />
                        </View>
                        <View>
                           <Text className="text-white font-black text-sm uppercase tracking-tighter">Product Billing</Text>
                           <Text className="text-gray-500 text-[8px] font-black uppercase tracking-widest mt-1">Generate Invoices & Bills</Text>
                        </View>
                     </View>
                     <View className="bg-slate-800 p-2 rounded-full">
                        <Ionicons name="chevron-forward" size={16} color="#475569" />
                     </View>
                  </TouchableOpacity>

                  {/* ── All Billings Ledger ── */}
                  <TouchableOpacity
                     onPress={() => router.push('/(adminPages)/billings' as any)}
                     className="flex-row items-center justify-between p-5 bg-slate-900 border border-slate-800 rounded-3xl mt-4 shadow-2xl"
                  >
                     <View className="flex-row items-center gap-4 flex-1">
                        <View className="w-12 h-12 bg-emerald-950 rounded-2xl items-center justify-center border border-emerald-900 shadow-lg shadow-emerald-500/10">
                           <Ionicons name="document-text-outline" size={24} color="#10b981" />
                        </View>
                        <View>
                           <Text className="text-white font-black text-sm uppercase tracking-tighter">Billings Ledger</Text>
                           <Text className="text-gray-500 text-[8px] font-black uppercase tracking-widest mt-1">Full Invoicing History & Stats</Text>
                        </View>
                     </View>
                     <View className="bg-slate-800 p-2 rounded-full">
                        <Ionicons name="chevron-forward" size={16} color="#475569" />
                     </View>
                  </TouchableOpacity>

            {/* ── Spare Parts Inventory ── */}
            <TouchableOpacity
              onPress={() => router.push("/(adminPages)/inventory" as any)}
              className="flex-row items-center justify-between p-5 bg-slate-900 border border-slate-800 rounded-3xl mt-4 shadow-2xl"
            >
              <View className="flex-row items-center gap-4 flex-1">
                <View className="w-12 h-12 bg-sky-950 rounded-2xl items-center justify-center border border-sky-900">
                  <Ionicons name="build-outline" size={24} color="#0ea5e9" />
                </View>
                <View>
                  <Text className="text-white font-black text-sm uppercase tracking-tighter">
                    Spare Parts Inventory
                  </Text>
                  <Text className="text-gray-500 text-[8px] font-black uppercase tracking-widest mt-1">
                    Manage Spares & Stock Alerts
                  </Text>
                </View>
              </View>
              <View className="bg-slate-800 p-2 rounded-full">
                <Ionicons name="chevron-forward" size={16} color="#475569" />
              </View>
            </TouchableOpacity>

            {/* ── Booked Vehicles ── */}
            <TouchableOpacity
              onPress={() =>
                router.push("/(adminPages)/booked-vehicles" as any)
              }
              className="flex-row items-center justify-between p-5 bg-slate-900 border border-slate-800 rounded-3xl mt-4 shadow-2xl"
            >
              <View className="flex-row items-center gap-4 flex-1">
                <View className="w-12 h-12 bg-sky-950 rounded-2xl items-center justify-center border border-sky-900">
                  <Ionicons name="car-outline" size={24} color="#0ea5e9" />
                </View>
                <View>
                  <Text className="text-white font-black text-sm uppercase tracking-tighter">
                    Booked Vehicles
                  </Text>
                  <Text className="text-gray-500 text-[8px] font-black uppercase tracking-widest mt-1">
                    Status & Sales Settlement
                  </Text>
                </View>
              </View>
              <View className="bg-slate-800 p-2 rounded-full">
                <Ionicons name="chevron-forward" size={16} color="#475569" />
              </View>
            </TouchableOpacity>

                  {/* ── Car Service Catalog ── */}
                  <TouchableOpacity
                     onPress={() => router.push('/(adminPages)/car-services' as any)}
                     className="flex-row items-center justify-between p-5 bg-slate-900 border border-slate-800 rounded-3xl mt-4 shadow-2xl"
                  >
                     <View className="flex-row items-center gap-4 flex-1">
                        <View className="w-12 h-12 bg-sky-950 rounded-2xl items-center justify-center border border-sky-900 shadow-lg shadow-sky-500/10">
                           <Ionicons name="construct-outline" size={24} color="#0ea5e9" />
                        </View>
                        <View>
                           <Text className="text-white font-black text-sm uppercase tracking-tighter">Car Service Catalog</Text>
                           <Text className="text-gray-500 text-[8px] font-black uppercase tracking-widest mt-1">Manage Service Tiers & Details</Text>
                        </View>
                     </View>
                     <View className="bg-slate-800 p-2 rounded-full">
                        <Ionicons name="chevron-forward" size={16} color="#475569" />
                     </View>
                  </TouchableOpacity>

                  {/* ── Service Areas ── */}
                  <TouchableOpacity
                     onPress={() => router.push('/(adminPages)/service-areas' as any)}
                     className="flex-row items-center justify-between p-5 bg-slate-900 border border-slate-800 rounded-3xl mt-4 shadow-2xl"
                  >
                     <View className="flex-row items-center gap-4 flex-1">
                        <View className="w-12 h-12 bg-emerald-950 rounded-2xl items-center justify-center border border-emerald-900">
                           <Ionicons name="location-outline" size={24} color="#10b981" />
                        </View>
                        <View>
                           <Text className="text-white font-black text-sm uppercase tracking-tighter">Service Areas</Text>
                           <Text className="text-gray-500 text-[8px] font-black uppercase tracking-widest mt-1">Manage Coverage & Pincodes</Text>
                        </View>
                     </View>
                     <View className="bg-slate-800 p-2 rounded-full">
                        <Ionicons name="chevron-forward" size={16} color="#475569" />
                     </View>
                  </TouchableOpacity>

                  {/* ── Customer Reviews ── */}
                  <TouchableOpacity
                     onPress={() => router.push('/(adminPages)/reviews' as any)}
                     className="flex-row items-center justify-between p-5 bg-slate-900 border border-slate-800 rounded-3xl mt-4 shadow-2xl"
                  >
                     <View className="flex-row items-center gap-4 flex-1">
                        <View className="w-12 h-12 bg-sky-950 rounded-2xl items-center justify-center border border-sky-900">
                           <Ionicons name="star-outline" size={24} color="#0ea5e9" />
                        </View>
                        <View>
                           <Text className="text-white font-black text-sm uppercase tracking-tighter">Customer Reviews</Text>
                           <Text className="text-gray-500 text-[8px] font-black uppercase tracking-widest mt-1">Manage Ratings & Feedback</Text>
                        </View>
                     </View>
                     <View className="bg-slate-800 p-2 rounded-full">
                        <Ionicons name="chevron-forward" size={16} color="#475569" />
                     </View>
                  </TouchableOpacity>

                  {/* ── Pricing Packages ── */}
                  <TouchableOpacity
                     onPress={() => router.push('/(adminPages)/pricing' as any)}
                     className="flex-row items-center justify-between p-5 bg-slate-900 border border-slate-800 rounded-3xl mt-4 shadow-2xl"
                  >
                     <View className="flex-row items-center gap-4 flex-1">
                        <View className="w-12 h-12 bg-sky-950 rounded-2xl items-center justify-center border border-sky-900 shadow-lg shadow-sky-500/10">
                           <Ionicons name="pricetags-outline" size={24} color="#0ea5e9" />
                        </View>
                        <View>
                           <Text className="text-white font-black text-sm uppercase tracking-tighter">Pricing Packages</Text>
                           <Text className="text-gray-500 text-[8px] font-black uppercase tracking-widest mt-1">Manage Service Plan & Pricing</Text>
                        </View>
                     </View>
                     <View className="bg-slate-800 p-2 rounded-full">
                        <Ionicons name="chevron-forward" size={16} color="#475569" />
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
    <Text className="text-sky-500 text-[10px] font-black uppercase tracking-[2px] ml-2">
      {label}
    </Text>
    <View className="gap-2">{children}</View>
  </View>
);

const SettingItem = ({ icon, title, subtitle, value, onValueChange }: any) => (
  <View className="flex-row items-center justify-between p-4 bg-slate-900 border border-white/5 rounded-2xl">
    <View className="flex-row items-center gap-4 flex-1">
      <View className="p-2 bg-white/5 rounded-xl border border-white/5">
        <Ionicons name={icon} size={18} color="#0ea5e9" />
      </View>
      <View>
        <Text className="text-white font-bold text-sm">{title}</Text>
        {subtitle && (
          <Text className="text-gray-500 text-[8px] uppercase tracking-wide mt-0.5">
            {subtitle}
          </Text>
        )}
      </View>
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      thumbColor="#fff"
      trackColor={{ false: "#334155", true: "#0ea5e9" }}
    />
  </View>
);
