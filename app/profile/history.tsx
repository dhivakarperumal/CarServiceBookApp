import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { api, apiService } from "../../services/api";
import { COLORS } from "../../theme/colors";

const STATUS_LABELS = {
  "Service Completed": "✅ Completed",
  "Bill Completed": "✅ Completed",
  "Cancelled": "❌ Cancelled",
};

const History = () => {
  const { user } = useAuth();
  const [completedServices, setCompletedServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedService, setExpandedService] = useState(null);

  const fetchCompletedServices = React.useCallback(async () => {
    try {
      setLoading(true);

      if (!user?.uid) {
        setCompletedServices([]);
        setLoading(false);
        return;
      }

      const allServices = await apiService.getAllServices(user.email);

      const userServices = (allServices || []).filter(
        (s) =>
          (s.customerEmail || s.email)?.toLowerCase() ===
          user?.email?.toLowerCase()
      );

      const completed = (userServices || []).filter((s) =>
        ["Service Completed", "Bill Completed"].includes(s.serviceStatus)
      );

      // Fetch billing records
      const billRes = await api.get("/billings");
      const bills = billRes.data || [];
      const billMapByBookingId = {};
      const billMapByServiceId = {};
      const billMapByAppointmentId = {};

      bills.forEach((bill) => {
        if (bill.bookingId) billMapByBookingId[bill.bookingId.toString()] = bill;
        if (bill.serviceId) billMapByServiceId[bill.serviceId.toString()] = bill;
        if (bill.appointmentId) billMapByAppointmentId[bill.appointmentId.toString()] = bill;
      });

      const enrichedServices = await Promise.all(
        completed.map(async (service) => {
          try {
            const detailsRes = await api.get(`/all-services/${service.id}`);
            const details = detailsRes.data || {};
            let matchedBill = null;

            if (service.bookingId && billMapByBookingId[service.bookingId.toString()]) {
              matchedBill = billMapByBookingId[service.bookingId.toString()];
            } else if (service.id && billMapByServiceId[service.id.toString()]) {
              matchedBill = billMapByServiceId[service.id.toString()];
            } else if (service.appointmentId && billMapByAppointmentId[service.appointmentId.toString()]) {
              matchedBill = billMapByAppointmentId[service.appointmentId.toString()];
            }

            const parts = details.parts || [];
            const issues = details.issues || [];
            const totalSpareAmount = parts.reduce((sum, p) => sum + Number(p.total || 0), 0);
            const totalIssueAmount = issues.reduce((sum, issue) => sum + Number(issue.issueAmount || 0), 0);
            const labourAmount = Number(matchedBill?.labour ?? service.labour ?? service.labourAmount ?? 0);
            const finalBill = Number(matchedBill?.grandTotal ?? totalSpareAmount + totalIssueAmount + labourAmount);

            return {
              ...service,
              ...details,
              parts,
              issues,
              matchedBill,
              totalSpareAmount,
              totalIssueAmount,
              labourAmount,
              finalBill,
            };
          } catch (err) {
            console.error(`Failed to fetch service details for ${service.id}`, err);
            return {
              ...service,
              parts: [],
              issues: [],
              totalSpareAmount: 0,
              totalIssueAmount: 0,
              labourAmount: Number(service.labour ?? service.labourAmount ?? 0),
              finalBill: Number(service.labour ?? service.labourAmount ?? 0),
            };
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

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchCompletedServices();
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text className="mt-2 text-base text-text-secondary">
            Loading service history...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (completedServices.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 justify-center items-center">
          <Text className="text-2xl font-bold text-text-secondary text-center">
            No service history yet
          </Text>
          <Text className="text-sm text-text-secondary text-center mt-2">
            Your completed services will appear here
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1 p-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        <Text className="text-3xl font-bold text-sky text-center mb-6">
          📜 Service History
        </Text>

        <View className="gap-4">
          {completedServices.map((service) => {
            const isExpanded = expandedService === service.id;
            const totalSpareAmount = service.parts?.length > 0
              ? service.parts.reduce((sum, p) => sum + Number(p.total || 0), 0)
              : Number(service.partsTotal || 0);
            const totalIssueAmount = service.issues?.length > 0
              ? service.issues.reduce((sum, issue) => sum + Number(issue.issueAmount || 0), 0)
              : Number(service.issueAmount || 0);
            const labourAmount = Number(service.labourAmount ?? service.labour ?? 0);
            const computedTotal = totalSpareAmount + totalIssueAmount + labourAmount;
            const totalAmount = Number(service.finalBill ?? computedTotal);

            return (
              <View
                key={service.id}
                className="border border-sky/30 rounded-xl bg-card overflow-hidden"
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
                          color={COLORS.success}
                        />
                        <Text className="text-lg font-bold text-text-primary">
                          {service.bookingId}
                        </Text>
                      </View>

                      <View className="gap-1">
                        <Text className="text-sm text-text-secondary">
                          <Text className="text-text-primary font-medium">
                            Vehicle:
                          </Text>{" "}
                          {service.brand} {service.model}
                        </Text>

                        <Text className="text-sm text-text-secondary">
                          <Text className="text-text-primary font-medium">
                            Number:
                          </Text>{" "}
                          {service.vehicleNumber}
                        </Text>

                        <Text className="text-sm text-text-secondary">
                          <Text className="text-text-primary font-medium">
                            Issue:
                          </Text>{" "}
                          {service.issue}
                        </Text>

                        <Text className="text-sm text-text-secondary">
                          <Text className="text-text-primary font-medium">
                            Status:
                          </Text>{" "}
                          <Text className="text-success font-bold">
                            {STATUS_LABELS[service.serviceStatus] ||
                              service.serviceStatus}
                          </Text>
                        </Text>
                      </View>
                    </View>

                    <View className="items-end">
                      <Text className="text-2xl font-bold text-sky">
                        ₹{totalAmount.toFixed(2)}
                      </Text>
                      <Text className="text-xs text-text-secondary mt-1">
                        {isExpanded ? "▼ Collapse" : "▶ Expand"}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Expanded */}
                {isExpanded && (
                  <View className="border-t border-sky/20 p-4 gap-4">
                    {/* Service Details */}
                    <View className="bg-gray-800 rounded-lg p-4">
                      <Text className="text-base font-bold text-sky mb-3">
                        📋 Service Details
                      </Text>

                      <View className="gap-1">
                        <Text className="text-sm text-text-secondary">
                          <Text className="text-text-primary">
                            Customer Name:
                          </Text>{" "}
                          {service.name}
                        </Text>

                        <Text className="text-sm text-text-secondary">
                          <Text className="text-text-primary">Phone:</Text>{" "}
                          {service.phone}
                        </Text>

                        <Text className="text-sm text-text-secondary">
                          <Text className="text-text-primary">Email:</Text>{" "}
                          {service.email}
                        </Text>

                        <Text className="text-sm text-text-secondary">
                          <Text className="text-text-primary">Address:</Text>{" "}
                          {service.address}
                        </Text>
                      </View>
                    </View>

                    {/* Parts */}
                    {service.parts?.length > 0 ? (
                      <View className="bg-gray-800 rounded-lg p-4">
                        <Text className="text-base font-bold text-sky mb-3">
                          🔧 Spare Parts / Materials Used
                        </Text>

                        <View className="gap-3">
                          {service.parts.map((part, idx) => (
                            <View
                              key={idx}
                              className="flex-row justify-between items-center bg-gray-700 p-3 rounded-lg border border-gray-600"
                            >
                              <View className="flex-1">
                                <Text className="text-text-primary font-bold">
                                  {part.partName}
                                </Text>
                                <Text className="text-xs text-text-secondary">
                                  Qty: {part.qty} × ₹{Number(part.price).toFixed(2)}
                                </Text>
                              </View>

                              <View className="items-end gap-1">
                                <Text className="text-lg font-bold text-rating">
                                  ₹{Number(part.total).toFixed(2)}
                                </Text>
                                <Text className={`text-xs font-bold px-2 py-1 rounded ${part.status === "approved"
                                  ? "bg-green-500/20 text-green-400"
                                  : part.status === "pending"
                                    ? "bg-yellow-500/20 text-yellow-400"
                                    : "bg-red-500/20 text-red-400"
                                  }`}>
                                  {(part.status || "completed").toUpperCase()}
                                </Text>
                              </View>
                            </View>
                          ))}
                        </View>

                        <View className="mt-4 pt-4 border-t border-gray-600 gap-4">
                          <View className="flex-row justify-between items-end">
                            <View>
                              <Text className="text-xs text-text-secondary">Total Spare Cost</Text>
                              <Text className="text-xl font-bold text-rating">
                                ₹{totalSpareAmount.toFixed(2)}
                              </Text>
                            </View>
                            <View>
                              <Text className="text-xs text-text-secondary">Total Issue Cost</Text>
                              <Text className="text-xl font-bold text-amber-400">
                                ₹{totalIssueAmount.toFixed(2)}
                              </Text>
                            </View>
                            <View>
                              <Text className="text-xs text-text-secondary">Labour Cost</Text>
                              <Text className="text-xl font-bold text-emerald-400">
                                ₹{labourAmount.toFixed(2)}
                              </Text>
                            </View>
                          </View>
                          <View className="bg-sky/20 rounded-lg p-3 flex-row justify-between items-center">
                            <Text className="text-text-primary font-bold">Final Bill</Text>
                            <Text className="text-2xl font-bold text-sky">
                              ₹{totalAmount.toFixed(2)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ) : (
                      <Text className="text-center text-text-secondary">
                        No spare parts recorded
                      </Text>
                    )}

                    {/* Issue Costs */}
                    {service.issues?.length > 0 ? (
                      <View className="bg-gray-800 rounded-lg p-4">
                        <Text className="text-base font-bold text-sky mb-3">
                          🧾 Issue Costs
                        </Text>

                        <View className="gap-3">
                          {service.issues.map((issue, idx) => (
                            <View
                              key={idx}
                              className="flex-row justify-between items-center bg-gray-700 p-3 rounded-lg border border-gray-600"
                            >
                              <View className="flex-1">
                                <Text className="text-text-primary font-bold">
                                  {issue.issue || issue.issueName || `Issue ${idx + 1}`}
                                </Text>
                                <Text className="text-xs text-text-secondary">
                                  Status: {(issue.issueStatus || "completed").toUpperCase()}
                                </Text>
                              </View>

                              <View className="items-end">
                                <Text className="text-lg font-bold text-amber-400">
                                  ₹{Number(issue.issueAmount || 0).toFixed(2)}
                                </Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      </View>
                    ) : (
                      <Text className="text-center text-text-secondary">
                        No issue costs recorded
                      </Text>
                    )}

                    {/* Service Information */}
                    <View className="bg-gray-800 rounded-lg p-4">
                      <Text className="text-base font-bold text-sky mb-3">
                        ℹ️ Service Information
                      </Text>

                      <View className="gap-2">
                        <Text className="text-sm text-text-secondary">
                          <Text className="text-text-primary font-medium">
                            Issue Reported:
                          </Text>{" "}
                          {service.issue}
                        </Text>

                        <Text className="text-sm text-text-secondary">
                          <Text className="text-text-primary font-medium">
                            Service Status:
                          </Text>{" "}
                          <Text className="text-success font-medium">
                            {service.serviceStatus}
                          </Text>
                        </Text>

                        {service.otherIssue && (
                          <Text className="text-sm text-text-secondary">
                            <Text className="text-text-primary font-medium">
                              Additional Notes:
                            </Text>{" "}
                            {service.otherIssue}
                          </Text>
                        )}
                      </View>
                    </View>
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