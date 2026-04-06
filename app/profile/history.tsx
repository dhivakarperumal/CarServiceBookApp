import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../../contexts/AuthContext";
import { apiService } from "../../services/api";
import { COLORS } from "../../theme/colors";

export default function History() {
  const { user } = useAuth();

  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    if (user?.uid) fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    try {
      setLoading(true);

      // ✅ SAME AS WEB
      const all = await apiService.getAllServices(user.uid);

      console.log("📋 ALL SERVICES:", all);

      // ✅ SAME FILTER AS WEB
      const completed = all.filter((s: any) =>
        ["Service Completed", "Bill Completed"].includes(
          s.serviceStatus
        )
      );

      console.log("✅ COMPLETED:", completed);

      setServices(completed);
    } catch (err) {
      console.log("❌ ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  // LOADING
  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator color={COLORS.primary} />
        <Text className="text-text-secondary mt-2">
          Loading history...
        </Text>
      </SafeAreaView>
    );
  }

  // EMPTY
  if (services.length === 0) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-background">
        <Text className="text-text-secondary">
          No service history yet
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background px-4">
      <Text className="text-xl font-bold text-primary mt-6 mb-4">
        📜 Service History
      </Text>

      <ScrollView>
        {services.map((service: any) => {
          const isOpen = expanded === service.id;

          const total =
            service.parts?.reduce(
              (sum: number, p: any) =>
                sum + Number(p.total || 0),
              0
            ) || 0;

          return (
            <View
              key={service.id}
              className="bg-slate800/50 border border-white/10 rounded-xl mb-4 overflow-hidden"
            >
              {/* HEADER */}
              <TouchableOpacity
                onPress={() =>
                  setExpanded(isOpen ? null : service.id)
                }
                className="p-4"
              >
                <View className="flex-row justify-between">
                  <View>
                    <Text className="text-white font-bold">
                      {service.bookingId}
                    </Text>

                    <Text className="text-text-secondary text-xs mt-1">
                      {service.brand} {service.model}
                    </Text>

                    <Text className="text-text-secondary text-xs">
                      {service.vehicleNumber}
                    </Text>

                    <Text className="text-green-400 text-xs font-semibold">
                      {service.serviceStatus}
                    </Text>
                  </View>

                  <View className="items-end">
                    <Text className="text-primary font-bold text-lg">
                      ₹{total.toFixed(2)}
                    </Text>

                    <Text className="text-xs text-text-secondary">
                      {isOpen ? "Collapse" : "Expand"}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* DETAILS */}
              {isOpen && (
                <View className="border-t border-white/10 p-4 space-y-4">
                  <View className="bg-card p-3 rounded-xl">
                    <Text className="text-primary font-bold mb-2">
                      Service Details
                    </Text>

                    <Text className="text-white">{service.name}</Text>
                    <Text className="text-text-secondary">
                      {service.phone}
                    </Text>
                    <Text className="text-text-secondary">
                      {service.email}
                    </Text>
                    <Text className="text-text-secondary mt-1">
                      {service.address}
                    </Text>
                  </View>

                  <View className="bg-card p-3 rounded-xl">
                    <Text className="text-primary font-bold mb-2">
                      Info
                    </Text>

                    <Text className="text-white">
                      Issue: {service.issue}
                    </Text>

                    {service.otherIssue && (
                      <Text className="text-text-secondary mt-1">
                        {service.otherIssue}
                      </Text>
                    )}
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}