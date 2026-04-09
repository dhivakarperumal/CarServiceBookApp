import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
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
  const authUser = user as any;
  const mechanicName = (
    (authUser?.displayName ||
      authUser?.username ||
      authUser?.name ||
      "") as string
  ).toLowerCase();

  const [services, setServices] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [issueModalVisible, setIssueModalVisible] = useState(false);
  const [selectedServiceDetail, setSelectedServiceDetail] = useState<any>(null);
  const [activeModalTab, setActiveModalTab] = useState("issues");
  const [issueEntries, setIssueEntries] = useState<any[]>([]);
  const [partsEntries, setPartsEntries] = useState<any[]>([]);

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
    const billMap: Record<string, number> = {};

    bills.forEach((b: any) => {
      const keys = [b.bookingId, b.serviceId, b.appointmentId, b.id]
        .filter(Boolean)
        .map((k: any) => k.toString());

      const amount = b.grandTotal || b.totalAmount || b.total_amount || 0;
      keys.forEach((k) => {
        billMap[k] = amount;
      });
    });

    const filtered = (servRes.data || [])
      .filter((s: any) => {
        const isMine =
          (s.assignedEmployeeName || "").toLowerCase() === mechanic;
        const stat = (s.serviceStatus || s.status || "").toLowerCase();

        return isMine && stat.includes("completed");
      })
      .map((s: any) => {
        const possibleIds = [s.id, s.bookingId, s.serviceId, s.appointmentId]
          .filter(Boolean)
          .map((id: any) => id.toString());

        let amount = 0;

        for (let id of possibleIds) {
          if (billMap[id] !== undefined) {
            amount = billMap[id];
            break;
          }
        }

        return {
          ...s,
          grandTotal: amount,
        };
      });

    setServices(filtered);
  };

  const handleViewDetails = async (item: any) => {
    try {
      const res = await api.get(`/all-services/${item.id}`);
      const detail = res.data;
      setSelectedServiceDetail(detail);
      setIssueEntries(detail.issues || []);
      setPartsEntries(detail.parts || []);
      setActiveModalTab("issues");
      setIssueModalVisible(true);
    } catch (error) {
      console.warn("Failed to load service details", error);
      Alert.alert("Error", "Unable to load service details.");
    }
  };

  const handlePrint = (item: any) => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        Alert.alert(
          "Print blocked",
          "Please allow pop-ups to print this record.",
        );
        return;
      }
      printWindow.document.write(
        `<html><body><pre>${JSON.stringify(item, null, 2)}</pre></body></html>`,
      );
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    } else {
      Alert.alert("Print unavailable", "Printing is only supported on web.");
    }
  };

  const filteredServices = useMemo(() => {
    return services.filter((item: any) => {
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
              <TouchableOpacity
                onPress={() => handleViewDetails(item)}
                className="bg-primary px-4 py-3 rounded-xl flex-row items-center"
              >
                <Ionicons name="eye-outline" size={16} color="white" />

                <Text className="text-white text-xs font-bold ml-2">
                  View Details
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handlePrint(item)}
                className="bg-slate-800 px-4 py-3 rounded-xl flex-row items-center"
              >
                <Ionicons name="print-outline" size={16} color="#fff" />

                <Text className="text-white text-xs font-bold ml-2">Print</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal visible={issueModalVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/70 justify-end">
          <View className="bg-[#020617] rounded-t-3xl p-5 max-h-[92%]">
            <View className="flex-row justify-between items-center mb-4">
              <View>
                <Text className="text-white text-xl font-black">
                  Service Protocol Record
                </Text>
                <Text className="text-text-primary text-md mt-1">
                  #
                  {selectedServiceDetail?.bookingId ||
                    selectedServiceDetail?.id}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setIssueModalVisible(false)}
                className="p-3 bg-slate-800 rounded-full"
              >
                <Ionicons name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="mb-4">
              <View className="bg-slate-900 rounded-3xl p-4 mb-4">
                <Text className="text-text-muted text-[10px] uppercase tracking-widest mb-3">
                  Client Profile
                </Text>
                <Text className="text-white text-base font-black">
                  {selectedServiceDetail?.name ||
                    selectedServiceDetail?.customer_name ||
                    "Walk-in Customer"}
                </Text>
                <Text className="text-text-muted text-sm mt-2">
                  {selectedServiceDetail?.phone || "No Contact"}
                </Text>
              </View>

              <View className="bg-slate-900 rounded-3xl p-4 mb-4">
                <Text className="text-text-muted text-[10px] uppercase tracking-widest mb-3">
                  Vehicle Intelligence
                </Text>
                <Text className="text-white text-base font-black">
                  {selectedServiceDetail?.brand} {selectedServiceDetail?.model}
                </Text>
                <Text className="text-text-muted text-sm mt-2">
                  {selectedServiceDetail?.vehicleNumber ||
                    selectedServiceDetail?.vehicle_number ||
                    "Registry Missing"}
                </Text>
              </View>

              <View className="bg-slate-900 rounded-3xl p-4 mb-4">
                <Text className="text-text-muted text-[10px] uppercase tracking-widest mb-3">
                  Timeline Archive
                </Text>
                <Text className="text-white text-base font-black">
                  {new Date(
                    selectedServiceDetail?.updatedAt ||
                      selectedServiceDetail?.created_at ||
                      selectedServiceDetail?.createdAt ||
                      Date.now(),
                  ).toLocaleDateString()}
                </Text>
                <Text className="text-text-muted text-sm mt-2">
                  Record # {selectedServiceDetail?.id}
                </Text>
              </View>

              <View className="flex-row mb-4 rounded-3xl overflow-hidden border border-slate-800">
                <TouchableOpacity
                  onPress={() => setActiveModalTab("issues")}
                  className={`flex-1 py-3 items-center ${activeModalTab === "issues" ? "bg-white" : "bg-slate-900"}`}
                >
                  <Text
                    className={`${activeModalTab === "issues" ? "text-[#020617]" : "text-text-muted"} text-xs uppercase font-black`}
                  >
                    Diagnostic Issues
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setActiveModalTab("parts")}
                  className={`flex-1 py-3 items-center ${activeModalTab === "parts" ? "bg-white" : "bg-slate-900"}`}
                >
                  <Text
                    className={`${activeModalTab === "parts" ? "text-[#020617]" : "text-text-muted"} text-xs uppercase font-black`}
                  >
                    Spare Parts
                  </Text>
                </TouchableOpacity>
              </View>

              {activeModalTab === "issues" ? (
                issueEntries.length === 0 ? (
                  <View className="bg-slate-900 rounded-3xl p-5 items-center">
                    <Text className="text-text-muted text-xs uppercase tracking-widest">
                      No diagnostic issues logged for this protocol
                    </Text>
                  </View>
                ) : (
                  issueEntries.map((entry, idx) => (
                    <View
                      key={idx}
                      className="bg-slate-900 rounded-3xl p-4 mb-3"
                    >
                      <Text className="text-text-muted text-[10px] uppercase tracking-widest mb-2">
                        Issue #{idx + 1}
                      </Text>
                      <Text className="text-white font-black">
                        {entry.issue || "Unknown issue"}
                      </Text>
                      <Text className="text-success mt-2">
                        ₹{entry.issueAmount || 0}
                      </Text>
                    </View>
                  ))
                )
              ) : partsEntries.length === 0 ? (
                <View className="bg-slate-900 rounded-3xl p-5 items-center">
                  <Text className="text-text-muted text-xs uppercase tracking-widest">
                    No spare parts utilized in this service
                  </Text>
                </View>
              ) : (
                partsEntries.map((part, idx) => (
                  <View key={idx} className="bg-slate-900 rounded-3xl p-4 mb-3">
                    <Text className="text-text-muted text-[10px] uppercase tracking-widest mb-2">
                      Part #{idx + 1}
                    </Text>
                    <Text className="text-white font-black">
                      {part.partName || "Unknown part"}
                    </Text>
                    <Text className="text-text-muted text-sm mt-2">
                      Qty: {part.qty || 0}
                    </Text>
                    <Text className="text-success mt-1">
                      ₹{part.price || 0}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>

            <View className="flex-row justify-between items-center pt-3 pb-3 border-t border-slate-800">
              <View>
                <Text className="text-text-muted text-[10px] uppercase tracking-widest">
                  Final Bill
                </Text>
                <Text className="text-white text-xl font-black">
                  ₹
                  {Number(
                    selectedServiceDetail?.grandTotal || 0,
                  ).toLocaleString()}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => handlePrint(selectedServiceDetail)}
                className="bg-primary px-5 py-3 rounded-xl"
              >
                <Text className="text-white text-xs font-black uppercase">
                  Print Record
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default CompletedHistory;
