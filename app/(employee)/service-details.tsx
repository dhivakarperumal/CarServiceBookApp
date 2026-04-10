import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import { COLORS } from "../../theme/colors";

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
      <View className="p-5 mt-6">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-3 bg-card rounded-2xl border border-card"
          >
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View className="flex-1 min-w-0">
            <Text
              className="text-4xl font-black text-text-primary tracking-tight"
              numberOfLines={1}
            >
              Service Details
            </Text>
          </View>
        </View>
      </View>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 100,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading && !service ? (
          <View className="py-20 justify-center items-center">
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text className="text-text-secondary mt-4 font-bold tracking-widest text-[10px] uppercase">
              Retrieving dossier...
            </Text>
          </View>
        ) : !service ? (
          <View className="py-20 justify-center items-center">
            <Text className="text-text-secondary italic">Record not found.</Text>
          </View>
        ) : (
          <>
            {/* TOP BADGE & STATUS */}
            <View className="items-center mb-8">
              <View className="bg-primary/20 px-6 py-2 rounded-full border border-primary/30 mb-3 shadow-lg">
                <Text className="text-primary font-black text-[10px] uppercase tracking-widest">
                  {service.serviceStatus || "Active Service"}
                </Text>
              </View>
              <Text className="text-text-primary font-black text-md uppercase tracking-[4px]">
                ID: {service.bookingId || `SER-${service.id}`}
              </Text>
            </View>

            {/* CUSTOMER SECTION */}
            <View className="bg-card rounded-3xl p-6 mb-6 border border-card shadow-xl backdrop-blur-lg">
              <View className="flex-row items-center mb-6">
                <View className="w-12 h-12 bg-primary rounded-2xl items-center justify-center mr-4 shadow-md">
                  <Ionicons name="person" size={24} color="#FFFFFF" />
                </View>
                <View>
                  <Text className="text-text-secondary text-[10px] font-black uppercase tracking-widest">
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
                  className="flex-row items-center bg-background p-4 rounded-2xl border border-card shadow-sm"
                >
                  <Ionicons name="call" size={18} color={COLORS.primary} />
                  <Text className="text-text-primary font-bold ml-3">
                    {service.phone || service.mobile}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() =>
                    Linking.openURL(`mailto:${service.email || "N/A"}`)
                  }
                  className="flex-row items-center bg-background p-4 rounded-2xl border border-card shadow-sm"
                >
                  <Ionicons name="mail" size={18} color={COLORS.accent} />
                  <Text className="text-text-primary font-bold ml-3">
                    {service.email || "No Email Provided"}
                  </Text>
                </TouchableOpacity>
                <View className="flex-row items-start bg-background p-4 rounded-2xl border border-card shadow-sm">
                  <Ionicons name="location" size={18} color={COLORS.success} />
                  <Text className="text-text-primary font-bold ml-3 flex-1">
                    {service.address || "No address recorded."}
                  </Text>
                </View>
              </View>
            </View>

            {/* VEHICLE SECTION */}
            <View className="bg-card rounded-3xl p-6 mb-6 border border-card shadow-xl backdrop-blur-lg">
              <View className="flex-row items-center mb-6">
                <View className="w-12 h-12 bg-warning rounded-2xl items-center justify-center mr-4 shadow-md">
                  <Ionicons name="car" size={24} color="#FFFFFF" />
                </View>
                <View>
                  <Text className="text-text-secondary text-[10px] font-black uppercase tracking-widest">
                    Vehicle Specifications
                  </Text>
                  <Text className="text-text-primary text-xl font-black">
                    {service.brand} {service.model}
                  </Text>
                </View>
              </View>

              <View className="grid grid-cols-2 gap-3 mb-2">
                <View className="bg-background p-4 rounded-2xl border border-card shadow-sm">
                  <Text className="text-text-muted text-[8px] font-black uppercase tracking-widest mb-1">
                    Plate Number
                  </Text>
                  <Text className="text-text-primary font-black">
                    {service.vehicleNumber || service.vehicle_number || "N/A"}
                  </Text>
                </View>
                <View className="bg-background p-4 rounded-2xl border border-card shadow-sm">
                  <Text className="text-text-muted text-[8px] font-black uppercase tracking-widest mb-1">
                    Year
                  </Text>
                  <Text className="text-text-primary font-black">
                    {service.year || "N/A"}
                  </Text>
                </View>
              </View>

              <View className="grid grid-cols-2 gap-3 mt-3">
                <View className="bg-background p-4 rounded-2xl border border-card shadow-sm">
                  <Text className="text-text-muted text-[8px] font-black uppercase tracking-widest mb-1">
                    Fuel Type
                  </Text>
                  <Text className="text-text-primary font-black uppercase">
                    {service.fuelType || "N/A"}
                  </Text>
                </View>
                <View className="bg-background p-4 rounded-2xl border border-card shadow-sm">
                  <Text className="text-text-muted text-[8px] font-black uppercase tracking-widest mb-1">
                    Kilometers
                  </Text>
                  <Text className="text-text-primary font-black">
                    {service.km || 0} KM
                  </Text>
                </View>
              </View>
            </View>

            {/* JOB DETAILS */}
            <View className="bg-card rounded-3xl p-6 mb-24 border border-card shadow-xl backdrop-blur-lg">
              <Text className="text-text-secondary text-[10px] font-black uppercase tracking-widest mb-6">
                Service Breakdown
              </Text>

              <View className="mb-6">
                <Text className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-3">
                  Primary Diagnosis
                </Text>
                <View className="bg-background p-4 rounded-2xl border border-card shadow-sm">
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
                      className="bg-background p-4 rounded-2xl border border-card mb-3 flex-row justify-between items-center shadow-sm"
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
                      className="bg-background p-4 rounded-2xl border border-card mb-2 flex-row justify-between items-center shadow-sm"
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
      </ScrollView>
    </SafeAreaView>
  );
}
