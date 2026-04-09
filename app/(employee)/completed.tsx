import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../services/api";

const CompletedHistory = () => {
  const { user } = useAuth();
  const mechanicName = (user?.username || user?.name || "").toLowerCase();

  const [services, setServices] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (mechanicName) {
      fetchCompleted();
    }
  }, [mechanicName]);

  const fetchCompleted = async () => {
    const [servRes, billRes] = await Promise.all([
      api.get("/all-services"),
      api.get("/billings"),
    ]);

    const mechanic = mechanicName;
    const bills = billRes.data || [];
    const billMap = {};

    bills.forEach((b) => {
      const keys = [b.bookingId, b.serviceId, b.id].filter(Boolean);

      keys.forEach((k) => {
        billMap[k] = b.grandTotal || b.totalAmount || 0;
      });
    });

    const filtered = (servRes.data || [])
      .filter((s) => {
        const isMine =
          (s.assignedEmployeeName || "").toLowerCase() === mechanic;
        const stat = (s.serviceStatus || s.status || "").toLowerCase();

        return isMine && stat.includes("completed");
      })
      .map((s) => ({
        ...s,
        grandTotal: billMap[s.id] || 0,
      }));

    setServices(filtered);
  };

  const filteredServices = useMemo(() => {
    return services.filter((item) => {
      const txt = search.toLowerCase();

      return (
        (item.name || "").toLowerCase().includes(txt) ||
        (item.vehicleNumber || "").toLowerCase().includes(txt) ||
        (item.brand + " " + item.model).toLowerCase().includes(txt)
      );
    });
  }, [services, search]);

  return (
    <View className="flex-1 bg-[#020617] px-5 pt-8">
      <Text className="text-white text-xl font-black mb-6">
        Completed History
      </Text>

      <View className="bg-slate-900 rounded-3xl border border-card px-4 py-3 flex-row items-center mb-6">
        <Ionicons name="search" size={18} color="#94A3B8" />

        <TextInput
          placeholder="Search completed services..."
          placeholderTextColor="#64748B"
          value={search}
          onChangeText={setSearch}
          className="flex-1 ml-3 text-white"
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {filteredServices.map((item) => (
          <View
            key={item.id}
            className="bg-slate-950 border border-card rounded-[28px] p-5 mb-4"
          >
            <View className="flex-row justify-between items-center mb-3">
              <View>
                <Text className="text-lg font-black text-white">
                  {item.name || "Customer"}
                </Text>

                <Text className="text-[10px] text-text-muted uppercase tracking-widest">
                  ID : {item.bookingId || item.id}
                </Text>
              </View>

              <View className="bg-success/10 px-3 py-1 rounded-full">
                <Text className="text-success text-[10px] font-black uppercase">
                  Completed
                </Text>
              </View>
            </View>

            <View className="bg-slate-900/80 p-4 rounded-2xl mb-4">
              <View className="flex-row items-center mb-2">
                <Ionicons name="car-outline" size={16} color="#94A3B8" />

                <Text className="text-text-muted ml-2 text-xs">
                  {item.brand} {item.model}
                </Text>
              </View>

              <View className="flex-row items-center mb-2">
                <Ionicons name="calendar-outline" size={16} color="#94A3B8" />

                <Text className="text-text-muted ml-2 text-xs">
                  {new Date(item.updatedAt || item.created_at).toDateString()}
                </Text>
              </View>

              <View className="flex-row items-center">
                <Ionicons name="cash-outline" size={16} color="#10B981" />

                <Text className="text-success ml-2 text-sm font-black">
                  ₹{item.grandTotal}
                </Text>
              </View>
            </View>

            <View className="flex-row justify-between">
              <TouchableOpacity className="bg-primary px-4 py-3 rounded-xl flex-row items-center">
                <Ionicons name="eye-outline" size={16} color="white" />

                <Text className="text-white text-xs font-bold ml-2">
                  View Details
                </Text>
              </TouchableOpacity>

              <TouchableOpacity className="bg-slate-800 px-4 py-3 rounded-xl flex-row items-center">
                <Ionicons name="print-outline" size={16} color="#fff" />

                <Text className="text-white text-xs font-bold ml-2">Print</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default CompletedHistory;
