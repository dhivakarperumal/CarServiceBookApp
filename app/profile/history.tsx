import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
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
  const [expandedService, setExpandedService] = useState(null);

  const fetchCompletedServices = React.useCallback(async () => {
    try {
      setLoading(true);

      if (!user?.uid) {
        console.warn('User UID not available');
        setCompletedServices([]);
        setLoading(false);
        return;
      }

      // Fetch all services for this user
      console.log('📋 Fetching all services...');
      const allServices = await apiService.getAllServices(user.uid);

      // Filter for completed services
      const completed = (allServices || []).filter((s) =>
        ['Service Completed', 'Bill Completed'].includes(s.serviceStatus)
      );

      console.log(`✅ Found ${completed.length} completed services`);

      // Fetch spare parts for each completed service
      const enrichedServices = await Promise.all(
        completed.map(async (service) => {
          try {
            const partsRes = await api.get(`/all-services/${service.id}`);
            return {
              ...service,
              parts: partsRes.data?.parts || [],
            };
          } catch (err) {
            console.error(`Failed to fetch parts for service ${service.id}`, err);
            return {
              ...service,
              parts: [],
            };
          }
        })
      );

      setCompletedServices(enrichedServices);
    } catch (err) {
      console.error('Error fetching completed services:', err);
      Alert.alert('Error', 'Failed to load service history');
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (user?.uid) {
      fetchCompletedServices();
    } else {
      setCompletedServices([]);
      setLoading(false);
    }
  }, [user?.uid, fetchCompletedServices]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading service history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (completedServices.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.title}>No service history yet</Text>
          <Text style={styles.subtitle}>Your completed services will appear here</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.header}>📜 Service History</Text>

        <View style={styles.servicesContainer}>
          {completedServices.map((service) => {
            const isExpanded = expandedService === service.id;
            const totalSpareAmount = service.parts?.reduce(
              (sum, p) => sum + Number(p.total || 0),
              0
            ) || 0;

            return (
              <View key={service.id} style={styles.serviceCard}>
                {/* Header - Click to Expand */}
                <TouchableOpacity
                  onPress={() =>
                    setExpandedService(isExpanded ? null : service.id)
                  }
                  style={styles.serviceHeader}
                >
                  <View style={styles.headerContent}>
                    <View style={styles.serviceInfo}>
                      <View style={styles.bookingIdRow}>
                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                        <Text style={styles.bookingId}>{service.bookingId}</Text>
                      </View>
                      <View style={styles.detailsGrid}>
                        <Text style={styles.detailText}>
                          <Text style={styles.detailLabel}>Vehicle:</Text> {service.brand} {service.model}
                        </Text>
                        <Text style={styles.detailText}>
                          <Text style={styles.detailLabel}>Number:</Text> {service.vehicleNumber}
                        </Text>
                        <Text style={styles.detailText}>
                          <Text style={styles.detailLabel}>Issue:</Text> {service.issue}
                        </Text>
                        <Text style={styles.detailText}>
                          <Text style={styles.detailLabel}>Status:</Text>{" "}
                          <Text style={styles.statusText}>
                            {STATUS_LABELS[service.serviceStatus] || service.serviceStatus}
                          </Text>
                        </Text>
                      </View>
                    </View>
                    <View style={styles.priceSection}>
                      <Text style={styles.totalPrice}>₹{totalSpareAmount.toFixed(2)}</Text>
                      <Text style={styles.expandText}>
                        {isExpanded ? "▼ Collapse" : "▶ Expand"}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Expanded Details */}
                {isExpanded && (
                  <View style={styles.expandedContent}>
                    {/* Service Details Section */}
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>📋 Service Details</Text>
                      <View style={styles.detailsGrid}>
                        <Text style={styles.detailText}>
                          <Text style={styles.detailLabel}>Customer Name:</Text> {service.name}
                        </Text>
                        <Text style={styles.detailText}>
                          <Text style={styles.detailLabel}>Phone:</Text> {service.phone}
                        </Text>
                        <Text style={styles.detailText}>
                          <Text style={styles.detailLabel}>Email:</Text> {service.email}
                        </Text>
                        <Text style={styles.detailText}>
                          <Text style={styles.detailLabel}>Address:</Text> {service.address}
                        </Text>
                      </View>
                    </View>

                    {/* Spare Parts Section */}
                    {service.parts && service.parts.length > 0 ? (
                      <View style={styles.section}>
                        <Text style={styles.sectionTitle}>🔧 Spare Parts / Materials Used</Text>
                        <View style={styles.partsList}>
                          {service.parts.map((part, idx) => (
                            <View key={part.id || idx} style={styles.partItem}>
                              <View style={styles.partInfo}>
                                <Text style={styles.partName}>{part.partName}</Text>
                                <Text style={styles.partQty}>
                                  Qty: {part.qty} × ₹{Number(part.price).toFixed(2)}
                                </Text>
                              </View>
                              <View style={styles.partRight}>
                                <Text style={styles.partTotal}>₹{Number(part.total).toFixed(2)}</Text>
                                <Text style={[
                                  styles.partStatus,
                                  {
                                    backgroundColor: part.status === "approved" ? "#10B98120" :
                                                   part.status === "pending" ? "#F59E0B20" : "#EF444420",
                                    color: part.status === "approved" ? "#10B981" :
                                          part.status === "pending" ? "#F59E0B" : "#EF4444"
                                  }
                                ]}>
                                  {(part.status || "completed").toUpperCase()}
                                </Text>
                              </View>
                            </View>
                          ))}
                        </View>
                        <View style={styles.totalSection}>
                          <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Total Spare Cost</Text>
                            <Text style={styles.totalAmount}>₹{totalSpareAmount.toFixed(2)}</Text>
                          </View>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.section}>
                        <Text style={styles.noPartsText}>No spare parts recorded for this service</Text>
                      </View>
                    )}

                    {/* Service Labor/Notes Section */}
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>ℹ️ Service Information</Text>
                      <View style={styles.detailsGrid}>
                        <Text style={styles.detailText}>
                          <Text style={styles.detailLabel}>Issue Reported:</Text> {service.issue}
                        </Text>
                        <Text style={styles.detailText}>
                          <Text style={styles.detailLabel}>Service Status:</Text>{" "}
                          <Text style={styles.statusText}>{service.serviceStatus}</Text>
                        </Text>
                        {service.otherIssue && (
                          <Text style={[styles.detailText, styles.fullWidth]}>
                            <Text style={styles.detailLabel}>Additional Notes:</Text> {service.otherIssue}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 8,
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.primary,
    textAlign: "center",
    marginBottom: 24,
  },
  servicesContainer: {
    gap: 16,
  },
  serviceCard: {
    borderWidth: 1,
    borderColor: COLORS.primary + "30",
    borderRadius: 12,
    backgroundColor: COLORS.card,
    overflow: "hidden",
  },
  serviceHeader: {
    padding: 16,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  serviceInfo: {
    flex: 1,
  },
  bookingIdRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  bookingId: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  detailsGrid: {
    gap: 4,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  detailLabel: {
    fontWeight: "500",
    color: COLORS.textPrimary,
  },
  statusText: {
    color: "#10B981",
    fontWeight: "bold",
  },
  priceSection: {
    alignItems: "flex-end",
  },
  totalPrice: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  expandText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: COLORS.primary + "20",
    padding: 16,
    gap: 16,
  },
  section: {
    backgroundColor: COLORS.gray800,
    borderRadius: 8,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 12,
  },
  partsList: {
    gap: 12,
  },
  partItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: COLORS.gray700,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gray600,
  },
  partInfo: {
    flex: 1,
  },
  partName: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  partQty: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  partRight: {
    alignItems: "flex-end",
  },
  partTotal: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#F59E0B",
  },
  partStatus: {
    fontSize: 10,
    fontWeight: "bold",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 4,
  },
  totalSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray600,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#F59E0B",
  },
  noPartsText: {
    textAlign: "center",
    color: COLORS.textSecondary,
  },
  fullWidth: {
    width: "100%",
  },
});

export default History;