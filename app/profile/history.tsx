import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { api, apiService } from "../../services/api";

const STATUS_LABELS = {
  "Service Completed": "✅ Completed",
  "Bill Completed": "✅ Completed",
  "Cancelled": "❌ Cancelled",
};

const History = () => {
  const { user } = useAuth();
  const [completedServices, setCompletedServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedService, setExpandedService] = useState(null);

  const fetchCompletedServices = React.useCallback(async () => {
    try {
      setLoading(true);

      if (!user?.uid) {
        setCompletedServices([]);
        setLoading(false);
        return;
      }

      const allServices = await apiService.getAllServices(user.uid);

      const completed = (allServices || []).filter((s) =>
        ["Service Completed", "Bill Completed"].includes(s.serviceStatus)
      );

      const enrichedServices = await Promise.all(
        completed.map(async (service) => {
          try {
            const partsRes = await api.get(`/all-services/${service.id}`);
            return {
              ...service,
              parts: partsRes.data?.parts || [],
            };
          } catch {
            return { ...service, parts: [] };
          }
        })
      );

      setCompletedServices(enrichedServices);
    } catch (err) {
      Alert.alert("Error", "Failed to load service history");
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (user?.uid) fetchCompletedServices();
    else {
      setCompletedServices([]);
      setLoading(false);
    }
  }, [user?.uid, fetchCompletedServices]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#0B1120]">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0EA5E9" />
          <Text className="mt-2 text-base text-gray-400">
            Loading service history...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (completedServices.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-[#0B1120]">
        <View className="flex-1 justify-center items-center">
          <Text className="text-2xl font-bold text-gray-400 text-center">
            No service history yet
          </Text>
          <Text className="text-sm text-gray-400 text-center mt-2">
            Your completed services will appear here
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#0B1120]">
      <ScrollView className="flex-1 p-4">
        <Text className="text-3xl font-bold text-sky-500 text-center mb-6">
          📜 Service History
        </Text>

        <View className="gap-4">
          {completedServices.map((service) => {
            const isExpanded = expandedService === service.id;

            const totalSpareAmount =
              service.parts?.reduce(
                (sum, p) => sum + Number(p.total || 0),
                0
              ) || 0;

            return (
              <View
                key={service.id}
                className="border border-sky-500/30 rounded-xl bg-gray-900 overflow-hidden"
              >
                {/* Header */}
                <TouchableOpacity
                  onPress={() =>
                    setExpandedService(isExpanded ? null : service.id)
                  }
                  className="p-4"
                >
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2 mb-2">
                        <Ionicons
                          name="checkmark-circle"
                          size={16}
                          color="#10B981"
                        />
                        <Text className="text-lg font-bold text-white">
                          {service.bookingId}
                        </Text>
                      </View>

                      <View className="gap-1">
                        <Text className="text-sm text-gray-400">
                          <Text className="text-white font-medium">
                            Vehicle:
                          </Text>{" "}
                          {service.brand} {service.model}
                        </Text>

                        <Text className="text-sm text-gray-400">
                          <Text className="text-white font-medium">
                            Number:
                          </Text>{" "}
                          {service.vehicleNumber}
                        </Text>

                        <Text className="text-sm text-gray-400">
                          <Text className="text-white font-medium">
                            Issue:
                          </Text>{" "}
                          {service.issue}
                        </Text>

                        <Text className="text-sm text-gray-400">
                          <Text className="text-white font-medium">
                            Status:
                          </Text>{" "}
                          <Text className="text-green-500 font-bold">
                            {STATUS_LABELS[service.serviceStatus] ||
                              service.serviceStatus}
                          </Text>
                        </Text>
                      </View>
                    </View>

                    <View className="items-end">
                      <Text className="text-2xl font-bold text-sky-500">
                        ₹{totalSpareAmount.toFixed(2)}
                      </Text>
                      <Text className="text-xs text-gray-400 mt-1">
                        {isExpanded ? "▼ Collapse" : "▶ Expand"}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Expanded */}
                {isExpanded && (
                  <View className="border-t border-sky-500/20 p-4 gap-4">
                    {/* Service Details */}
                    <View className="bg-gray-800 rounded-lg p-4">
                      <Text className="text-base font-bold text-sky-500 mb-3">
                        📋 Service Details
                      </Text>

                      <View className="gap-1">
                        <Text className="text-sm text-gray-400">
                          <Text className="text-white">
                            Customer Name:
                          </Text>{" "}
                          {service.name}
                        </Text>

                        <Text className="text-sm text-gray-400">
                          <Text className="text-white">Phone:</Text>{" "}
                          {service.phone}
                        </Text>

                        <Text className="text-sm text-gray-400">
                          <Text className="text-white">Email:</Text>{" "}
                          {service.email}
                        </Text>

                        <Text className="text-sm text-gray-400">
                          <Text className="text-white">Address:</Text>{" "}
                          {service.address}
                        </Text>
                      </View>
                    </View>

                    {/* Parts */}
                    {service.parts?.length > 0 ? (
                      <View className="bg-gray-800 rounded-lg p-4">
                        <Text className="text-base font-bold text-sky-500 mb-3">
                          🔧 Spare Parts
                        </Text>

                        <View className="gap-3">
                          {service.parts.map((part, idx) => (
                            <View
                              key={idx}
                              className="flex-row justify-between items-center bg-gray-700 p-3 rounded-lg border border-gray-600"
                            >
                              <View>
                                <Text className="text-white font-bold">
                                  {part.partName}
                                </Text>
                                <Text className="text-xs text-gray-400">
                                  Qty: {part.qty} × ₹{part.price}
                                </Text>
                              </View>

                              <View className="items-end">
                                <Text className="text-lg font-bold text-amber-400">
                                  ₹{part.total}
                                </Text>
                              </View>
                            </View>
                          ))}
                        </View>

                        <View className="mt-4 pt-4 border-t border-gray-600 flex-row justify-between">
                          <Text className="text-gray-400">
                            Total Spare Cost
                          </Text>
                          <Text className="text-2xl font-bold text-amber-400">
                            ₹{totalSpareAmount.toFixed(2)}
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <Text className="text-center text-gray-400">
                        No spare parts recorded
                      </Text>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default History;