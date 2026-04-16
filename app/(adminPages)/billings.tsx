import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { apiService } from "../../services/api";
import { COLORS } from "../../theme/colors";

const StatusBadge = ({ status }: { status: string }) => {
  const isPaid = status.toLowerCase() === "paid";

  return (
    <View
      className={`px-2 py-1 rounded-md border ${
        isPaid
          ? "bg-emerald-500/10 border-emerald-500/20"
          : "bg-rose-500/10 border-rose-500/20"
      }`}
    >
      <Text
        className={`text-[8px] font-black uppercase ${
          isPaid ? "text-emerald-500" : "text-rose-500"
        }`}
      >
        {status}
      </Text>
    </View>
  );
};

export default function BillingsLedger() {
  const router = useRouter();
  const [billings, setBillings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchBillings = async () => {
    try {
      const data = await apiService.getBillings();
      setBillings(Array.isArray(data) ? [...data].reverse() : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBillings();
  }, []);

  const filteredBillings = billings.filter((b) => {
    if (statusFilter === "all") return true;
    return (b.paymentStatus || "Pending").toLowerCase().includes(statusFilter);
  });

  const handleMarkPaid = async (id: any) => {
    Alert.alert("Confirm Payment", "Mark this invoice as fully PAID?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        onPress: async () => {
          try {
            await apiService.updateBillingStatus(id, "Paid");
            fetchBillings();
          } catch {
            Alert.alert("Error", "Failed to update payment status");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Premium Header */}
      <View className="px-5 pt-8 pb-2">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity 
              onPress={() => router.back()}
              className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 items-center justify-center"
            >
              <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
            </TouchableOpacity>
            <View>
              <Text className="text-white text-2xl font-black uppercase tracking-tight">Billings</Text>
             
            </View>
          </View>
          <View className="items-end">
            <View className="bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
              <Text className="text-primary text-[10px] font-black uppercase">{filteredBillings.length} Invoices</Text>
            </View>
          </View>
        </View>
      </View>

      {/* STATS */}
      <View className="p-4 flex-row justify-between">
        <View className="bg-card border border-slate-700 rounded-3xl p-5 w-[48%]">
          <Text className="text-text-secondary text-[9px] font-black uppercase">
            Combined Total
          </Text>
          <Text className="text-white font-black text-lg mt-1">
            ₹
            {billings
              .reduce((s, b) => s + Number(b.grandTotal || 0), 0)
              .toLocaleString()}
          </Text>
        </View>

        <View className="bg-card border border-slate-700 rounded-3xl p-5 w-[48%]">
          <Text className="text-text-secondary text-[9px] font-black uppercase">
            Unpaid Count
          </Text>
          <Text className="text-rose-500 font-black text-lg mt-1">
            {
              billings.filter((b) => b.paymentStatus?.toLowerCase() !== "paid")
                .length
            }
          </Text>
        </View>
      </View>

      {/* FILTER */}
      <View className="px-4 mb-2">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {["all", "paid", "partial", "pending"].map((f) => (
              <TouchableOpacity
                key={f}
                onPress={() => setStatusFilter(f)}
                className={`px-5 h-10 rounded-2xl border items-center justify-center ${
                  statusFilter === f
                    ? "bg-primary border-primary"
                    : "bg-card border-slate-700"
                }`}
              >
                <Text
                  className={`text-[9px] font-black uppercase ${
                    statusFilter === f ? "text-black" : "text-white"
                  }`}
                >
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
          className="mt-20"
        />
      ) : (
        <ScrollView
          className="flex-1 p-4"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={fetchBillings}
              tintColor={COLORS.primary}
            />
          }
        >
          {filteredBillings.map((b) => (
            <View
              key={b.id}
              className="bg-card border border-slate-700 rounded-3xl p-5 mb-4"
            >
              {/* HEADER */}
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  <Text className="text-primary text-[9px] font-black uppercase">
                    {b.invoiceNo}
                  </Text>

                  <Text className="text-white font-black text-sm mt-1">
                    {b.customerName}
                  </Text>

                  <Text className="text-text-secondary text-[10px] mt-1">
                    {b.car || "Vehicle Details"}
                  </Text>
                </View>

                <StatusBadge status={b.paymentStatus || "Pending"} />
              </View>

              {/* DIVIDER */}
              <View className="h-[1px] bg-white/5 my-4" />

              {/* FOOTER */}
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="text-text-secondary text-[9px] uppercase font-black">
                    Grand Total
                  </Text>
                  <Text className="text-white font-black text-lg">
                    ₹{Number(b.grandTotal || 0).toLocaleString()}
                  </Text>
                </View>

                <View className="flex-row gap-2">
                  {b.paymentStatus?.toLowerCase() !== "paid" && (
                    <TouchableOpacity
                      onPress={() => handleMarkPaid(b.id)}
                      className="bg-emerald-500 px-4 h-10 rounded-xl items-center justify-center"
                    >
                      <Text className="text-black font-black text-[9px] uppercase">
                        Mark Paid
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity className="bg-slate-800 px-4 h-10 rounded-xl items-center justify-center">
                    <Text className="text-white font-black text-[9px] uppercase">
                      View
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}

          <View className="h-20" />
        </ScrollView>
      )}

      {/* FLOATING ADD BILLING BUTTON */}
      <TouchableOpacity
        onPress={() => router.push("/(adminPages)/add-billing" as any)}
        className="absolute bottom-10 mb-8 right-8 w-16 h-16 bg-primary rounded-full items-center justify-center shadow-2xl shadow-primary/30"
        style={{ elevation: 15 }}
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
