import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Modal,
    Platform,
    SafeAreaView,
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
  const [dateFilter, setDateFilter] = useState("all");
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

  const [loadingDetails, setLoadingDetails] = useState(false);

  const handleViewDetails = async (item: any) => {
    // Open modal immediately with basic info
    setSelectedServiceDetail(item); // Use the item data that's already available
    setIssueEntries([]); // Start with empty arrays
    setPartsEntries([]);
    setActiveModalTab("issues");
    setIssueModalVisible(true);
    setLoadingDetails(true);

    // Fetch additional details in background
    try {
      const res = await api.get(`/all-services/${item.id}`);
      const detail = res.data;
      setSelectedServiceDetail(detail);
      setIssueEntries(detail.issues || []);
      setPartsEntries(detail.parts || []);
    } catch (error) {
      console.warn("Failed to load service details", error);
      // Keep the basic info that's already loaded
    } finally {
      setLoadingDetails(false);
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

      const matchesSearch =
        (item.name || "").toLowerCase().includes(txt) ||
        (item.vehicleNumber || "").toLowerCase().includes(txt) ||
        (item.brand + " " + item.model).toLowerCase().includes(txt);

      let matchesDate = true;

      if (dateFilter !== "all") {
        const bDate = new Date(item.updatedAt || item.created_at);
        const today = new Date();

        today.setHours(0, 0, 0, 0);

        if (dateFilter === "today") {
          matchesDate = bDate.toDateString() === today.toDateString();
        }

        if (dateFilter === "yesterday") {
          const yesterday = new Date(today);
          yesterday.setDate(today.getDate() - 1);
          matchesDate = bDate.toDateString() === yesterday.toDateString();
        }

        if (dateFilter === "week") {
          const lastWeek = new Date(today);
          lastWeek.setDate(today.getDate() - 7);
          matchesDate = bDate >= lastWeek;
        }

        if (dateFilter === "month") {
          const lastMonth = new Date(today);
          lastMonth.setMonth(today.getMonth() - 1);
          matchesDate = bDate >= lastMonth;
        }
      }

      return matchesSearch && matchesDate;
    });
  }, [services, search, dateFilter]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{
          paddingBottom: 200,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View className="px-6 pt-6 pb-4">
          <Text className="text-text-primary text-[17px] font-black uppercase tracking-tight mb-6">
            Completed History
          </Text>

          {/* Stats Card */}
          <View className="bg-card rounded-[28px] border border-slate-700 p-5 mb-6">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">
                  Completed Jobs
                </Text>
                <Text className="text-[28px] font-black text-success">
                  {filteredServices.length}
                </Text>
              </View>
              <View className="w-12 h-12 rounded-full bg-success/10 items-center justify-center">
                <Ionicons name="checkmark-done" size={20} color="#10B981" />
              </View>
            </View>
          </View>
        </View>

        {/* FILTERS */}
        <View className="px-6 pb-4">
          {/* Search Bar */}
          <View className="mb-6">
            <View className="bg-slate-900/30 rounded-2xl flex-row items-center px-4 h-14 border border-slate-700">
              <Ionicons name="search" size={16} color="#64748B" />
              <TextInput
                placeholder="Search completed services..."
                placeholderTextColor="#64748B"
                value={search}
                onChangeText={setSearch}
                className="flex-1 ml-3 text-white font-semibold text-xs"
              />
            </View>
          </View>

          {/* Date Filter */}
          <View className="bg-slate-900/30 border border-slate-700 rounded-2xl px-3 py-1 mb-6 overflow-hidden">
            <Picker
              selectedValue={dateFilter}
              onValueChange={(value) => setDateFilter(value)}
              dropdownIconColor="#64748B"
              style={{ color: "white" }}
            >
              <Picker.Item label="All Time History" value="all" />
              <Picker.Item label="Today's Completed" value="today" />
              <Picker.Item label="Yesterday Jobs" value="yesterday" />
              <Picker.Item label="Past Week" value="week" />
              <Picker.Item label="Past Month" value="month" />
            </Picker>
          </View>
        </View>

        {/* SERVICE CARDS */}
        <View className="px-6 pb-24">
          {filteredServices.length === 0 ? (
            <View className="py-20 items-center bg-card rounded-[32px] border border-dashed border-slate-700">
              <Ionicons
                name="checkmark-done-outline"
                size={48}
                color="#64748B"
              />
              <Text className="text-slate-500 font-black text-[10px] uppercase mt-4 tracking-[2px]">
                No completed services found
              </Text>
            </View>
          ) : (
            filteredServices.map((item) => (
              <View
                key={item.id}
                className="mb-4 bg-card rounded-[28px] border border-slate-700 overflow-hidden"
              >
                <View className="p-5">
                  <View className="flex-row justify-between items-start mb-4">
                    <View>
                      <Text className="text-text-primary text-[10px] font-black uppercase tracking-[2px]">
                        {item.bookingId || `SER-${item.id}`}
                      </Text>
                      <Text className="text-white text-[17px] font-black mt-0.5 uppercase tracking-tight">
                        {item.name || "Customer"}
                      </Text>
                    </View>
                    <View className="bg-success/10 px-3 py-1.5 rounded-full border border-success">
                      <Text className="text-success text-[8px] font-black uppercase tracking-widest">
                        Completed
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row gap-2 flex-wrap mb-4">
                    <View className="bg-slate-900/40 px-2.5 py-1.5 rounded-xl flex-row items-center gap-1.5">
                      <Ionicons name="car-outline" size={12} color="#0EA5E9" />
                      <Text className="text-text-secondary text-[10px] font-bold uppercase">
                        {item.brand} {item.model}
                      </Text>
                    </View>
                    <View className="bg-slate-900/40 px-2.5 py-1.5 rounded-xl flex-row items-center gap-1.5">
                      <Ionicons
                        name="calendar-outline"
                        size={12}
                        color="#0EA5E9"
                      />
                      <Text className="text-text-secondary text-[10px] font-bold">
                        {new Date(
                          item.updatedAt || item.created_at,
                        ).toDateString()}
                      </Text>
                    </View>
                  </View>

                  {/* Amount */}
                  <View className="bg-slate-900/30 rounded-2xl p-4 mb-5 border border-slate-700">
                    <View className="flex-row justify-between items-center">
                      <Text className="text-[12px] font-black text-text-muted uppercase tracking-widest">
                        Service Amount
                      </Text>
                      <Text className="text-lg font-black text-success">
                        ₹{item.grandTotal}
                      </Text>
                    </View>
                  </View>

                  {/* Actions */}
                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      onPress={() => handleViewDetails(item)}
                      className="flex-1 bg-primary py-3.5 rounded-2xl flex-row items-center justify-center gap-2"
                    >
                      <Text className="text-white text-[11px] font-black uppercase tracking-widest">
                        View Details
                      </Text>
                      <Ionicons name="eye" size={14} color="white" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handlePrint(item)}
                      className="flex-1 bg-slate-900/30 py-3.5 rounded-2xl flex-row items-center justify-center gap-2 border border-slate-700"
                    >
                      <Text className="text-text-primary text-[11px] font-black uppercase tracking-widest">
                        Print
                      </Text>
                      <Ionicons name="print" size={14} color="#64748B" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal visible={issueModalVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/70 justify-end">
          <View className="bg-background rounded-t-3xl p-6 max-h-[92%]">
            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text className="text-text-primary text-xl font-black">
                  Service Protocol Record
                </Text>
                <Text className="text-text-secondary text-sm mt-1">
                  #
                  {selectedServiceDetail?.bookingId ||
                    selectedServiceDetail?.id}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setIssueModalVisible(false)}
                className="p-3 bg-slate-900/30 rounded-full border border-slate-700"
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="mb-4">
              <View className="bg-card rounded-[28px] border border-slate-700 p-5 mb-5">
                <Text className="text-[12px] font-black text-text-muted uppercase tracking-widest mb-3">
                  Client Profile
                </Text>
                <Text className="text-white text-base font-black">
                  {selectedServiceDetail?.name ||
                    selectedServiceDetail?.customer_name ||
                    "Walk-in Customer"}
                </Text>
                <Text className="text-text-secondary text-sm mt-2">
                  {selectedServiceDetail?.phone || "No Contact"}
                </Text>
              </View>

              <View className="bg-card rounded-[28px] border border-slate-700 p-5 mb-5">
                <Text className="text-[12px] font-black text-text-muted uppercase tracking-widest mb-3">
                  Vehicle Intelligence
                </Text>
                <Text className="text-white text-base font-black">
                  {selectedServiceDetail?.brand} {selectedServiceDetail?.model}
                </Text>
                <Text className="text-text-secondary text-sm mt-2">
                  {selectedServiceDetail?.vehicleNumber ||
                    selectedServiceDetail?.vehicle_number ||
                    "Registry Missing"}
                </Text>
              </View>

              <View className="bg-card rounded-[28px] border border-slate-700 p-5 mb-5">
                <Text className="text-[12px] font-black text-text-muted uppercase tracking-widest mb-3">
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
                <Text className="text-text-secondary text-sm mt-2">
                  Record # {selectedServiceDetail?.id}
                </Text>
              </View>

              <View className="flex-row mb-5 rounded-2xl overflow-hidden border border-slate-700">
                <TouchableOpacity
                  onPress={() => setActiveModalTab("issues")}
                  className={`flex-1 py-3.5 items-center ${
                    activeModalTab === "issues"
                      ? "bg-primary"
                      : "bg-slate-900/30"
                  }`}
                >
                  <Text
                    className={`${
                      activeModalTab === "issues"
                        ? "text-white"
                        : "text-text-secondary"
                    } text-[11px] uppercase font-black tracking-widest`}
                  >
                    Diagnostic Issues
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setActiveModalTab("parts")}
                  className={`flex-1 py-3.5 items-center ${
                    activeModalTab === "parts"
                      ? "bg-primary"
                      : "bg-slate-900/30"
                  }`}
                >
                  <Text
                    className={`${
                      activeModalTab === "parts"
                        ? "text-white"
                        : "text-text-secondary"
                    } text-[11px] uppercase font-black tracking-widest`}
                  >
                    Spare Parts
                  </Text>
                </TouchableOpacity>
              </View>

              {activeModalTab === "issues" ? (
                loadingDetails ? (
                  <View className="bg-card rounded-[28px] border border-slate-700 p-8 items-center">
                    <Ionicons name="refresh-circle" size={32} color="#0EA5E9" />
                    <Text className="text-slate-500 font-black text-[10px] uppercase mt-4 tracking-[2px]">
                      Loading diagnostic issues...
                    </Text>
                  </View>
                ) : issueEntries.length === 0 ? (
                  <View className="bg-card rounded-[28px] border border-dashed border-slate-700 p-8 items-center">
                    <Text className="text-slate-500 font-black text-[10px] uppercase tracking-[2px]">
                      No diagnostic issues logged for this protocol
                    </Text>
                  </View>
                ) : (
                  issueEntries.map((entry, idx) => (
                    <View
                      key={idx}
                      className="bg-card rounded-[28px] border border-slate-700 p-5 mb-4"
                    >
                      <Text className="text-[12px] font-black text-text-muted uppercase tracking-widest mb-3">
                        Issue #{idx + 1}
                      </Text>
                      <Text className="text-white font-black text-base">
                        {entry.issue || "Unknown issue"}
                      </Text>
                      <Text className="text-success mt-2 font-black">
                        ₹{entry.issueAmount || 0}
                      </Text>
                    </View>
                  ))
                )
              ) : loadingDetails ? (
                <View className="bg-card rounded-[28px] border border-slate-700 p-8 items-center">
                  <Ionicons name="refresh-circle" size={32} color="#0EA5E9" />
                  <Text className="text-slate-500 font-black text-[10px] uppercase mt-4 tracking-[2px]">
                    Loading spare parts...
                  </Text>
                </View>
              ) : partsEntries.length === 0 ? (
                <View className="bg-card rounded-[28px] border border-dashed border-slate-700 p-8 items-center">
                  <Text className="text-slate-500 font-black text-[10px] uppercase tracking-[2px]">
                    No spare parts utilized in this service
                  </Text>
                </View>
              ) : (
                partsEntries.map((part, idx) => (
                  <View
                    key={idx}
                    className="bg-card rounded-[28px] border border-slate-700 p-5 mb-4"
                  >
                    <Text className="text-[12px] font-black text-text-muted uppercase tracking-widest mb-3">
                      Part #{idx + 1}
                    </Text>
                    <Text className="text-white font-black text-base">
                      {part.partName || "Unknown part"}
                    </Text>
                    <Text className="text-text-secondary text-sm mt-2">
                      Qty: {part.qty || 0}
                    </Text>
                    <Text className="text-success mt-1 font-black">
                      ₹{part.price || 0}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>

            <View className="flex-row justify-between items-center pt-4 pb-4 border-t border-slate-700">
              <View>
                <Text className="text-[12px] font-black text-text-muted uppercase tracking-widest">
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
                className="bg-primary px-6 py-3.5 rounded-2xl"
              >
                <Text className="text-white text-[11px] font-black uppercase tracking-widest">
                  Print Record
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default CompletedHistory;
