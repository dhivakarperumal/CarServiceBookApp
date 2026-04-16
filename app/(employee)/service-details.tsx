import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "../../services/api";

export default function ServiceDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/all-services/${id}`);
      setService(res.data);
    } catch (err) {
      Alert.alert("Error", "Failed to load service details");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await api.get(`/all-services/${id}`);
      setService(res.data);
    } catch (err) {
      console.error("Refresh failed", err);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* FIXED HEADER */}
      <View className="px-6 pt-8 pb-4 bg-background border-b border-slate-800">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-3 bg-slate-900/30 rounded-2xl border border-slate-700"
          >
            <Ionicons name="chevron-back" size={20} color="#64748B" />
          </TouchableOpacity>

          <View className="flex-1 min-w-0">
            <Text
              className="text-text-primary text-[17px] font-black uppercase tracking-tight"
              numberOfLines={1}
            >
              Service Details
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingBottom: 200,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* CONTENT */}
        <View className="px-6 pt-7 pb-24">
          {loading && !service ? (
            <View className="py-20 items-center bg-card rounded-[32px] border border-dashed border-slate-700">
              <Ionicons name="refresh-circle" size={48} color="#0EA5E9" />
              <Text className="text-slate-500 font-black text-[10px] uppercase mt-4 tracking-[2px]">
                Retrieving dossier...
              </Text>
            </View>
          ) : !service ? (
            <View className="py-20 items-center bg-card rounded-[32px] border border-dashed border-slate-700">
              <Ionicons name="document" size={48} color="#64748B" />
              <Text className="text-slate-500 font-black text-[10px] uppercase mt-4 tracking-[2px]">
                Record not found
              </Text>
            </View>
          ) : (
            <>
              {/* TOP BADGE & STATUS */}
              <View className="items-center mb-8">
                <View className="bg-primary/20 px-6 py-2 rounded-full border border-primary/30 mb-3">
                  <Text className="text-primary font-black text-[10px] uppercase tracking-widest">
                    {service.serviceStatus || "Active Service"}
                  </Text>
                </View>
                <Text className="text-text-primary font-black text-md uppercase tracking-[4px]">
                  ID: {service.bookingId || `SER-${service.id}`}
                </Text>
              </View>

              {/* CUSTOMER SECTION */}
              <View className="bg-card rounded-[28px] border border-slate-700 p-6 mb-6">
                <View className="flex-row items-center mb-6">
                  <View className="w-12 h-12 bg-primary rounded-2xl items-center justify-center mr-4">
                    <Ionicons name="person" size={24} color="#FFFFFF" />
                  </View>
                  <View>
                    <Text className="text-[12px] font-black text-text-muted uppercase tracking-widest">
                      Customer Dossier
                    </Text>
                    <Text className="text-text-primary text-xl font-black">
                      {service.name || service.customer_name}
                    </Text>
                  </View>
                </View>

                <View className="gap-4">
                  <TouchableOpacity
                    onPress={() =>
                      Linking.openURL(`tel:${service.phone || service.mobile}`)
                    }
                    className="flex-row items-center bg-slate-900/30 p-4 rounded-2xl border border-slate-700"
                  >
                    <Ionicons name="call" size={18} color="#10B981" />
                    <Text className="text-text-primary font-bold ml-3">
                      {service.phone || service.mobile}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() =>
                      Linking.openURL(`mailto:${service.email || "N/A"}`)
                    }
                    className="flex-row items-center bg-slate-900/30 p-4 rounded-2xl border border-slate-700"
                  >
                    <Ionicons name="mail" size={18} color="#F59E0B" />
                    <Text className="text-text-primary font-bold ml-3">
                      {service.email || "No Email Provided"}
                    </Text>
                  </TouchableOpacity>
                  <View className="flex-row items-start bg-slate-900/30 p-4 rounded-2xl border border-slate-700">
                    <Ionicons name="location" size={18} color="#EF4444" />
                    <Text className="text-text-primary font-bold ml-3 flex-1">
                      {service.address || "No address recorded."}
                    </Text>
                  </View>
                </View>
              </View>

              {/* VEHICLE SECTION */}
              <View className="bg-card rounded-[28px] border border-slate-700 p-6 mb-6">
                <View className="flex-row items-center mb-6">
                  <View className="w-12 h-12 bg-warning rounded-2xl items-center justify-center mr-4">
                    <Ionicons name="car" size={24} color="#FFFFFF" />
                  </View>
                  <View>
                    <Text className="text-[12px] font-black text-text-muted uppercase tracking-widest">
                      Vehicle Specifications
                    </Text>
                    <Text className="text-text-primary text-xl font-black">
                      {service.brand} {service.model}
                    </Text>
                  </View>
                </View>

                <View className="mb-2">
                  <View className="bg-slate-900/30 p-4 rounded-2xl border border-slate-700">
                    <Text className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">
                      Plate Number
                    </Text>
                    <Text className="text-text-primary font-black">
                      {service.vehicleNumber || service.vehicle_number || "N/A"}
                    </Text>
                  </View>
                </View>
              </View>

              {/* JOB DETAILS */}
              <View className="bg-card rounded-[28px] border border-slate-700 p-6 mb-24">
                <Text className="text-[12px] font-black text-text-muted uppercase tracking-widest mb-6">
                  Service Breakdown
                </Text>

                <View className="mb-6">
                  <Text className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-3">
                    Primary Diagnosis
                  </Text>
                  <View className="bg-slate-900/30 p-4 rounded-2xl border border-slate-700">
                    <Text className="text-text-primary font-bold leading-5">
                      {service.carIssue ||
                        "No initial problem description recorded."}
                    </Text>
                  </View>
                </View>

                {service.issues?.length > 0 && (
                  <View className="mb-6">
                    <Text className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-3">
                      Itemized Tasks
                    </Text>
                    {service.issues.map((iss: any, idx: number) => (
                      <View
                        key={idx}
                        className="bg-slate-900/30 p-4 rounded-2xl border border-slate-700 mb-3 flex-row justify-between items-center"
                      >
                        <Text className="text-text-primary font-bold flex-1 pr-4">
                          {iss.issue}
                        </Text>
                        <Text className="text-success font-black">
                          ₹{Number(iss.issueAmount || 0).toFixed(2)}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {service.parts?.length > 0 && (
                  <View>
                    <Text className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-3">
                      Spares & Inventory
                    </Text>
                    {service.parts.map((p: any, idx: number) => (
                      <View
                        key={idx}
                        className="bg-slate-900/30 p-4 rounded-2xl border border-slate-700 mb-2 flex-row justify-between items-center"
                      >
                        <View>
                          <Text className="text-text-primary font-bold">
                            {p.partName}
                          </Text>
                          <Text className="text-text-muted mt-1 font-bold text-[14px]">
                            Qty: {p.qty || 1}
                          </Text>
                        </View>
                        <Text className="text-text-primary font-black">
                          ₹{Number(p.total || 0).toFixed(2)}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
