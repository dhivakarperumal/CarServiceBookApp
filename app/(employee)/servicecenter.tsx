import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../services/api";
import { COLORS } from "../../theme/colors";

const { width, height } = Dimensions.get("window");

const BOOKING_STATUS = [
  "Booked",
  "Call Verified",
  "Approved",
  "Processing",
  "Waiting for Spare",
  "Service Going on",
  "Bill Pending",
  "Bill Completed",
  "Service Completed",
];

const STATUS_STEPS = [
  "Booked",
  "Call Verified",
  "Approved",
  "Processing",
  "Waiting for Spare",
  "Service Going on",
  "Service Completed",
  "Bill Pending",
  "Bill Completed",
];

const getButtonVisibility = (status: string) => {
  const currentIndex = STATUS_STEPS.indexOf(status);
  return {
    showAddIssue:
      currentIndex >= STATUS_STEPS.indexOf("Processing") &&
      currentIndex < STATUS_STEPS.indexOf("Service Completed"),
    showAddSpare:
      currentIndex >= STATUS_STEPS.indexOf("Processing") &&
      currentIndex < STATUS_STEPS.indexOf("Service Completed"),
    showBilling: status === "Bill Pending",
  };
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "Booked":
    case "Call Verified":
    case "Approved":
      return {
        bg: "bg-primary/10",
        text: "text-primary",
        border: "border-primary",
      };
    case "Processing":
      return {
        bg: "bg-primary/10",
        text: "text-primary",
        border: "border-primary",
      };
    case "Waiting for Spare":
      return {
        bg: "bg-warning/10",
        text: "text-warning",
        border: "border-warning",
      };
    case "Service Going on":
      return {
        bg: "bg-warning/10",
        text: "text-warning",
        border: "border-warning",
      };
    case "Bill Pending":
      return {
        bg: "bg-error/10",
        text: "text-error",
        border: "border-error",
      };
    case "Bill Completed":
      return {
        bg: "bg-accent/10",
        text: "text-accent",
        border: "border-accent",
      };
    case "Service Completed":
      return {
        bg: "bg-success/10",
        text: "text-success",
        border: "border-success",
      };
    default:
      return {
        bg: "bg-slate-900/50",
        text: "text-text-secondary",
        border: "border-slate-700",
      };
  }
};

const getStatusDisplayName = (status: string) => {
  switch (status) {
    case "Waiting for Spare":
      return "Waiting for Spare Approval";
    default:
      return status;
  }
};

const getBookingIssue = (service: any) => {
  const bookingIssue =
    service.carIssue || service.issue || service.bookingIssue || "";
  if (!bookingIssue) return null;

  return {
    issue: bookingIssue,
    issueAmount: service.issueAmount || 0,
    issueStatus: service.issueStatus || "pending",
    isBookingIssue: true,
  };
};

const getMappedStatus = (status: string) => {
  if (!status) return "Booked";
  const sLow = status.toLowerCase();
  if (sLow === "cancelled") return "Cancelled";
  const found = STATUS_STEPS.find((step) => step.toLowerCase() === sLow);
  if (found) return found;
  if (sLow.includes("bill completed")) return "Bill Completed";
  if (sLow.includes("completed")) return "Service Completed";
  return "Booked";
};

const getHoursDifference = (dateStr: string) => {
  if (!dateStr) return 0;
  const past = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60));
};

const getElapsedTime = (dateStr: string) => {
  if (!dateStr) return "0h";
  const past = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - past.getTime();
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${diffHrs}h ${diffMins}m`;
};

export default function ServiceCenter() {
  const router = useRouter();
  const { user: userProfile } = useAuth();
  const userRole = (userProfile?.role || "").toLowerCase();
  const isMechanic = userRole === "mechanic" || userRole === "staff";

  const [mainTab, setMainTab] = useState("all"); // all | booked | addVehicle
  const [subTab, setSubTab] = useState(isMechanic ? "assigned" : "unassigned");
  const [services, setServices] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [expandedItems, setExpandedItems] = useState<(string | number)[]>([]);

  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [assigning, setAssigning] = useState(false);

  const toggleExpanded = (id: string | number) => {
    setExpandedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // Status Selection Modal
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [activeServiceForStatus, setActiveServiceForStatus] =
    useState<any>(null);

  // Issue Editing Modal
  const [issueModalVisible, setIssueModalVisible] = useState(false);
  const [issueEntries, setIssueEntries] = useState<any[]>([]);
  const [editingServiceId, setEditingServiceId] = useState<any>(null);
  const [savingIssues, setSavingIssues] = useState(false);

  // Close Booking Modal
  const [closeModalVisible, setCloseModalVisible] = useState(false);
  const [closeReason, setCloseReason] = useState("");
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [servRes, empRes] = await Promise.all([
        api.get("/all-services"),
        api.get("/staff"),
      ]);

      const servicesRaw = servRes.data || [];
      const servicesWithDetails = await Promise.all(
        servicesRaw.map(async (service: any) => {
          try {
            const detailRes = await api.get(`/all-services/${service.id}`);
            return {
              ...service,
              parts: detailRes.data?.parts || [],
              issues: detailRes.data?.issues || [],
            };
          } catch (err) {
            return { ...service, parts: [], issues: [] };
          }
        }),
      );

      setServices(servicesWithDetails);
      setEmployees(empRes.data || []);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const [servRes, empRes] = await Promise.all([
        api.get("/all-services"),
        api.get("/staff"),
      ]);

      const servicesRaw = servRes.data || [];
      const servicesWithDetails = await Promise.all(
        servicesRaw.map(async (service: any) => {
          try {
            const detailRes = await api.get(`/all-services/${service.id}`);
            return {
              ...service,
              parts: detailRes.data?.parts || [],
              issues: detailRes.data?.issues || [],
            };
          } catch (err) {
            return { ...service, parts: [], issues: [] };
          }
        }),
      );

      setServices(servicesWithDetails);
      setEmployees(empRes.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setRefreshing(false);
    }
  };

  const filteredList = useMemo(() => {
    const mechanicName =
      userProfile?.username ||
      (userProfile as any)?.displayName ||
      (userProfile as any)?.name ||
      "";

    return services.filter((s) => {
      const text =
        `${s.bookingId || ""} ${s.name || ""} ${s.phone || ""} ${s.brand || ""} ${s.model || ""} ${s.vehicleNumber || ""}`.toLowerCase();

      // Exclude fully billed/completed service center items
      const status = (s.serviceStatus || s.status || "").toLowerCase().trim();
      if (status === "bill completed") return false;

      // SEARCH FILTER
      if (search && !text.includes(search.toLowerCase())) return false;

      // MECHANIC FILTER
      if (subTab === "assigned") {
        if (!s.assignedEmployeeId) return false;

        if (
          isMechanic &&
          (s.assignedEmployeeName || "").toLowerCase() !==
            mechanicName.toLowerCase()
        )
          return false;
      }

      if (subTab === "unassigned") {
        if (s.assignedEmployeeId) return false;
      }

      // DATE FILTER (Same as Web)
      const bDateStr = s.created_at || s.createdAt;
      if (dateFilter !== "all") {
        if (!bDateStr) return false;

        const bookingDate = new Date(bDateStr);
        const today = new Date();

        if (dateFilter === "today") {
          if (bookingDate.toDateString() !== today.toDateString()) return false;
        }

        if (dateFilter === "week") {
          const lastWeek = new Date();
          lastWeek.setDate(today.getDate() - 7);
          if (bookingDate < lastWeek) return false;
        }

        if (dateFilter === "month") {
          const lastMonth = new Date();
          lastMonth.setMonth(today.getMonth() - 1);
          if (bookingDate < lastMonth) return false;
        }
      }

      return true;
    });
  }, [services, search, dateFilter, subTab, userProfile]);

  const stats = useMemo(() => {
    const total = filteredList.length;
    const processing = filteredList.filter((s: any) => {
      const sStat = (s.serviceStatus || s.status || "").toLowerCase();
      return (
        sStat === "processing" ||
        sStat === "waiting for spare" ||
        sStat === "service going on"
      );
    }).length;
    const completed = filteredList.filter((s: any) => {
      const sStat = (s.serviceStatus || s.status || "").toLowerCase();
      return sStat.includes("completed") && !sStat.includes("bill completed");
    }).length;
    return { total, processing, completed };
  }, [filteredList]);

  const handleStatusChange = async (service: any, newStatus: string) => {
    if (!service.assignedEmployeeId) {
      Alert.alert("Error", "Assign mechanic first");
      return;
    }

    try {
      await api.put(`/all-services/${service.id}/status`, {
        serviceStatus: newStatus,
      });
      Alert.alert("Success", "Status updated successfully");
      loadData();
    } catch (error) {
      Alert.alert("Error", "Update failed");
    }
  };

  const assignEmployee = async () => {
    if (!selectedBooking || !selectedEmployeeId || assigning) return;

    try {
      setAssigning(true);
      const emp = employees.find(
        (e) => e.id.toString() === selectedEmployeeId.toString(),
      );
      if (!emp) return;

      await api.put(`/all-services/${selectedBooking.id}/assign`, {
        assignedEmployeeId: emp.id,
        assignedEmployeeName: emp.name,
        serviceStatus: "Processing",
      });

      Alert.alert("Success", `Mechanic ${emp.name} assigned!`);
      setModalVisible(false);
      setSelectedEmployeeId("");
      loadData();
    } catch (error) {
      Alert.alert("Error", "Assignment failed");
    } finally {
      setAssigning(false);
    }
  };

  const handleCloseBooking = async () => {
    if (!selectedBooking || !closeReason.trim() || isClosing) return;
    try {
      setIsClosing(true);

      // Auto-reject pending issues and parts
      const updatedIssues = (selectedBooking.issues || []).map((iss: any) =>
        iss.issueStatus === "pending"
          ? { ...iss, issueStatus: "rejected" }
          : iss,
      );
      const updatedParts = (selectedBooking.parts || []).map((p: any) =>
        p.status === "pending" ? { ...p, status: "rejected" } : p,
      );

      // Save the rejections
      if (updatedIssues.length > 0) {
        for (const iss of updatedIssues) {
          if (iss.id)
            await api.put(
              `/all-services/${selectedBooking.id}/issues/${iss.id}`,
              iss,
            );
        }
      }
      if (updatedParts.length > 0) {
        await api.post(`/all-services/${selectedBooking.id}/parts`, {
          parts: updatedParts,
        });
      }

      await api.put(`/all-services/${selectedBooking.id}/status`, {
        serviceStatus: "Cancelled",
        status: "Cancelled",
        closeReason: closeReason.trim(),
      });
      Alert.alert("Success", "Booking closed and items rejected");
      setCloseModalVisible(false);
      setCloseReason("");
      setSelectedBooking(null);
      loadData();
    } catch (error) {
      Alert.alert("Error", "Failed to close booking");
    } finally {
      setIsClosing(false);
    }
  };

  const openIssueEditor = (service: any) => {
    setEditingServiceId(service.id);
    const initialIssues = [...(service.issues || [])];
    const bookingIssue = getBookingIssue(service);

    if (bookingIssue) {
      const alreadyIncluded = initialIssues.some(
        (issue: any) =>
          (issue.issue || "").trim().toLowerCase() ===
          (bookingIssue.issue || "").trim().toLowerCase(),
      );
      if (!alreadyIncluded) {
        initialIssues.unshift(bookingIssue);
      }
    }

    // Secondary deduplication to ensure absolutely no name duplicates
    const uniqueRows: any[] = [];
    const seenNames = new Set();
    initialIssues.forEach((item) => {
      const name = (item.issue || "").trim().toLowerCase();
      if (name && !seenNames.has(name)) {
        uniqueRows.push(item);
        seenNames.add(name);
      }
    });

    setIssueEntries(uniqueRows);
    setIssueModalVisible(true);
  };

  const saveIssues = async () => {
    if (!editingServiceId || savingIssues) return;

    try {
      setSavingIssues(true);
      const toSave = issueEntries.filter(
        (entry) => entry.issue && entry.issue.trim(),
      );

      for (const entry of toSave) {
        if (entry.id) {
          // Update existing
          await api.put(
            `/all-services/${editingServiceId}/issues/${entry.id}`,
            {
              issue: entry.issue.trim(),
              issueAmount: Number(entry.issueAmount || 0),
            },
          );
          if (entry.issueStatus && entry.issueStatus !== "pending") {
            await api.put(
              `/all-services/${editingServiceId}/issues/${entry.id}/status`,
              {
                issueStatus: entry.issueStatus,
              },
            );
          }
        } else {
          // Create new
          const newIssue = await api.post(
            `/all-services/${editingServiceId}/issues`,
            {
              issue: entry.issue.trim(),
              issueAmount: Number(entry.issueAmount || 0),
            },
          );
          if (entry.issueStatus && entry.issueStatus !== "pending") {
            await api.put(
              `/all-services/${editingServiceId}/issues/${newIssue.data.issue.id}/status`,
              {
                issueStatus: entry.issueStatus,
              },
            );
          }
        }
      }

      const primaryIssue = toSave[0];
      await api.put(`/all-services/${editingServiceId}/issue`, {
        issue: primaryIssue ? primaryIssue.issue.trim() : "",
        issueAmount: Number(primaryIssue?.issueAmount || 0),
      });

      Alert.alert("Success", "Issue entries saved");
      setIssueModalVisible(false);
      loadData();
    } catch (error) {
      Alert.alert("Error", "Failed to save issue entries");
    } finally {
      setSavingIssues(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{
          paddingBottom: 200,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* HEADER */}
        <View className="px-6 pt-6 pb-4">
          {/* Quick Stats */}
          <View className="flex-row gap-3 mb-6">
            {/* TOTAL ASSIGNED */}
            <View className="flex-1 bg-card rounded-[28px] border border-slate-700 p-5">
              <Text className="text-[10px] uppercase tracking-[2px] text-text-secondary font-black mb-3">
                Total Assigned
              </Text>
              <View className="flex-row items-center justify-between">
                <Text className="text-3xl font-black text-text-primary">
                  {stats.total}
                </Text>
                <View className="w-12 h-12 rounded-2xl bg-primary/10 items-center justify-center border border-primary/20">
                  <Ionicons
                    name="clipboard-outline"
                    size={20}
                    color={COLORS.primary}
                  />
                </View>
              </View>
            </View>

            {/* IN PROGRESS */}
            <View className="flex-1 bg-card rounded-[28px] border border-slate-700 p-5">
              <Text className="text-[10px] uppercase tracking-[2px] text-text-secondary font-black mb-3">
                In Progress
              </Text>
              <View className="flex-row items-center justify-between">
                <Text className="text-3xl font-black text-text-primary">
                  {stats.processing}
                </Text>
                <View className="w-12 h-12 rounded-2xl bg-warning/10 items-center justify-center border border-warning/20">
                  <Ionicons
                    name="construct-outline"
                    size={20}
                    color={COLORS.warning}
                  />
                </View>
              </View>
            </View>

            {/* COMPLETED */}
            <View className="flex-1 bg-card rounded-[28px] border border-slate-700 p-5">
              <Text className="text-[10px] uppercase tracking-[2px] text-text-secondary font-black mb-3">
                Completed
              </Text>
              <View className="flex-row items-center justify-between">
                <Text className="text-3xl font-black text-text-primary">
                  {stats.completed}
                </Text>
                <View className="w-12 h-12 rounded-2xl bg-success/10 items-center justify-center border border-success/20">
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={20}
                    color={COLORS.success}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* SEARCH */}
          <View className="mb-6">
            <View className="bg-slate-900/30 rounded-2xl flex-row items-center px-4 h-14 border border-slate-700">
              <Ionicons name="search" size={16} color={COLORS.slate600} />
              <TextInput
                placeholder="Search bookings, vehicles..."
                placeholderTextColor={COLORS.textMuted}
                value={search}
                onChangeText={setSearch}
                className="flex-1 ml-3 text-white font-semibold text-xs"
              />
            </View>
          </View>

          {/* FILTER PICKERS */}
          <View className="flex-row gap-3 mb-6">
            <View className="flex-1 bg-slate-900/30 border border-slate-700 rounded-2xl px-3 py-1 overflow-hidden">
              <Picker
                selectedValue={dateFilter}
                onValueChange={(value) => setDateFilter(value)}
                dropdownIconColor={COLORS.slate600}
                style={{ color: COLORS.textPrimary }}
                itemStyle={{ color: COLORS.textPrimary, fontSize: 14 }}
              >
                <Picker.Item label="All" value="all" />
                <Picker.Item label="Today" value="today" />
                <Picker.Item label="This Week" value="week" />
                <Picker.Item label="This Month" value="month" />
              </Picker>
            </View>

            <View className="flex-1 bg-slate-900/30 border border-slate-700 rounded-2xl px-3 py-1 overflow-hidden">
              <Picker
                selectedValue={mainTab}
                onValueChange={(value) => setMainTab(value)}
                dropdownIconColor={COLORS.slate600}
                style={{ color: COLORS.textPrimary }}
                itemStyle={{ color: COLORS.textPrimary, fontSize: 14 }}
              >
                <Picker.Item label="All" value="all" />
                <Picker.Item label="Appointments" value="booked" />
                <Picker.Item label="Booking" value="addVehicle" />
              </Picker>
            </View>
          </View>

          {/* SUB TABS */}
          {!isMechanic && (
            <TouchableOpacity
              onPress={() => setSubTab("unassigned")}
              className={`py-3.5 rounded-2xl items-center flex-row justify-center gap-2 border ${subTab === "unassigned" ? "bg-primary border-primary" : "bg-white/5 border-slate-700"}`}
            >
              <Ionicons
                name="person-remove-outline"
                size={14}
                color={
                  subTab === "unassigned" ? "black" : "rgba(255,255,255,0.3)"
                }
              />
              <Text
                className={`font-black text-[10px] uppercase tracking-widest ${subTab === "unassigned" ? "text-background" : "text-slate-500"}`}
              >
                Unassigned (
                {services.filter((s) => !s.assignedEmployeeId).length})
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* SERVICE CARDS */}
        <View className="px-6 pb-24">
          {loading && services.length === 0 ? (
            <View className="py-20 items-center bg-card rounded-[32px] border border-dashed border-slate-700">
              <Ionicons name="car-outline" size={48} color={COLORS.textMuted} />
              <Text className="text-slate-500 font-black text-[10px] uppercase mt-4 tracking-[2px]">
                Loading workshop data...
              </Text>
            </View>
          ) : filteredList.length === 0 ? (
            <View className="py-20 items-center bg-card rounded-[32px] border border-dashed border-slate-700">
              <Ionicons name="car-outline" size={48} color={COLORS.textMuted} />
              <Text className="text-slate-500 font-black text-[10px] uppercase mt-4 tracking-[2px]">
                No vehicles found
              </Text>
            </View>
          ) : (
            filteredList.map((item) => {
              const isExpanded = expandedItems.includes(item.id);
              const statusColors = getStatusColor(
                item.serviceStatus || "Booked",
              );

              return (
                <View
                  key={item.id}
                  className="mb-4 bg-card rounded-[28px] border border-slate-700 overflow-hidden"
                >
                  <TouchableOpacity
                    onPress={() => toggleExpanded(item.id)}
                    activeOpacity={0.8}
                    className="p-5"
                  >
                    <View className="flex-row justify-between items-start mb-4">
                      <View>
                        <Text className="text-text-primary text-[10px] font-black uppercase tracking-[2px]">
                          {item.bookingId || `SER-${item.id}`}
                        </Text>
                        <Text className="text-white text-[17px] font-black mt-0.5 uppercase tracking-tight">
                          {item.name ||
                            item.customer_name ||
                            `${item.brand} ${item.model}`}
                        </Text>
                      </View>
                      <View className="items-end">
                        <View
                          className={`px-3 py-1.5 rounded-full border mb-1 ${statusColors.bg} ${statusColors.border}`}
                        >
                          <Text
                            className={`text-[8px] font-black uppercase tracking-widest ${statusColors.text}`}
                          >
                            {getStatusDisplayName(
                              item.serviceStatus || "Booked",
                            )}
                          </Text>
                        </View>
                        <Ionicons
                          name="chevron-down"
                          size={12}
                          color={COLORS.textMuted}
                        />
                      </View>
                    </View>

                    <View className="flex-row gap-2 flex-wrap">
                      <View className="bg-slate-900/40 px-2.5 py-1.5 rounded-xl flex-row items-center gap-1.5">
                        <Ionicons
                          name="car-outline"
                          size={12}
                          color={COLORS.primary}
                        />
                        <Text className="text-text-secondary text-[10px] font-bold uppercase">
                          {item.brand} {item.model}
                        </Text>
                      </View>
                      <View className="bg-slate-900/40 px-2.5 py-1.5 rounded-xl flex-row items-center gap-1.5">
                        <Ionicons
                          name="call-outline"
                          size={12}
                          color={COLORS.primary}
                        />
                        <Text className="text-text-secondary text-[10px] font-bold">
                          {item.phone || item.mobile}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  {isExpanded && (
                    <>
                      <View className="mb-6 px-5 pt-4">
                        <Text className="text-[10px] font-black uppercase tracking-wider text-text-muted mb-2">
                          Brand / Model
                        </Text>
                        <Text className="text-xl font-black text-text-primary">
                          {item.brand} {item.model}
                        </Text>
                        <Text className="text-sm font-black text-primary mt-4 uppercase mb-2">
                          {item.vehicleNumber ||
                            item.vehicle_number ||
                            "NO PLATE"}
                        </Text>
                        <Text className="text-sm text-text-secondary font-medium">
                          Customer: {item.name || item.customer_name} •{" "}
                          {item.phone || item.mobile}
                        </Text>
                      </View>

                      {/* ISSUES SECTION */}
                      <View className="bg-slate-900/40 px-5 py-4 border-t border-slate-700">
                        <View className="flex-row justify-between items-center mb-3">
                          <Text className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                            Job Details / Issues
                          </Text>
                          {item.assignedEmployeeId &&
                            getButtonVisibility(item.serviceStatus || "Booked")
                              .showAddIssue && (
                              <TouchableOpacity
                                onPress={() => openIssueEditor(item)}
                                className="bg-primary px-4 py-2 rounded-md"
                              >
                                <Text className="text-background text-[9px] font-black uppercase tracking-widest">
                                  Add Issue
                                </Text>
                              </TouchableOpacity>
                            )}
                        </View>
                        {(() => {
                          const bookingIssue = getBookingIssue(item);
                          let issueRows: any[] = [];
                          const seen = new Set();

                          if (bookingIssue) {
                            issueRows.push(bookingIssue);
                            seen.add(bookingIssue.issue.trim().toLowerCase());
                          }

                          (item.issues || []).forEach((iss: any) => {
                            const name = (iss.issue || "").trim().toLowerCase();
                            if (name && !seen.has(name)) {
                              issueRows.push(iss);
                              seen.add(name);
                            }
                          });

                          return issueRows.length > 0 ? (
                            <View className="gap-2">
                              {issueRows.map((iss: any, idx: number) => (
                                <View
                                  key={idx}
                                  className="bg-slate-900/60 px-3 py-2 rounded-lg border border-slate-700"
                                >
                                  <Text className="text-text-secondary text-[10px] font-bold uppercase">
                                    {iss.issue}
                                  </Text>
                                  {iss.issueAmount > 0 && (
                                    <Text className="text-primary text-[9px] font-black uppercase mt-1">
                                      ₹{iss.issueAmount}
                                    </Text>
                                  )}
                                </View>
                              ))}
                            </View>
                          ) : (
                            <Text className="text-text-muted text-[10px] font-semibold italic">
                              No issues listed
                            </Text>
                          );
                        })()}
                      </View>

                      {/* STATUS UPDATE */}
                      {item.assignedEmployeeId && (
                        <TouchableOpacity
                          onPress={() => {
                            setActiveServiceForStatus(item);
                            setStatusModalVisible(true);
                          }}
                          className="bg-slate-900/40 border border-slate-700 rounded-2xl overflow-hidden mx-5 mt-4 mb-4"
                        >
                          <View className="flex-row items-center justify-between px-4 py-2.5">
                            <View className="flex-row items-center">
                              <Ionicons
                                name="construct-outline"
                                size={14}
                                color={COLORS.textMuted}
                              />
                              <Text className="text-[10px] font-black text-text-muted ml-2 uppercase tracking-widest">
                                Status
                              </Text>
                            </View>
                            <Ionicons
                              name="chevron-down"
                              size={14}
                              color={COLORS.textMuted}
                            />
                          </View>
                          <View className="px-4 pb-3">
                            <Text className="text-text-primary font-bold text-sm">
                              {getStatusDisplayName(
                                item.serviceStatus || "Booked",
                              )}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      )}

                      {/* FOOTER ACTIONS */}
                      <View className="flex-row gap-3 px-5 pb-5">
                        <TouchableOpacity
                          onPress={() =>
                            router.push(
                              `/(employee)/service-details?id=${item.id}` as any,
                            )
                          }
                          className="bg-primary/10 py-4 px-6 rounded-2xl items-center justify-center border border-primary/20"
                        >
                          <Ionicons
                            name="eye"
                            size={20}
                            color={COLORS.primary}
                          />
                        </TouchableOpacity>

                        {!item.assignedEmployeeId ? (
                          <TouchableOpacity
                            onPress={() => {
                              setSelectedBooking(item);
                              setModalVisible(true);
                            }}
                            className="flex-1 bg-primary py-4 rounded-2xl items-center justify-center flex-row"
                          >
                            <Ionicons
                              name="person-add"
                              size={16}
                              color={COLORS.background}
                            />
                            <Text className="text-background font-black text-xs ml-2 uppercase tracking-widest">
                              ASSIGN MECHANIC
                            </Text>
                          </TouchableOpacity>
                        ) : (
                          <View className="flex-1 flex-row gap-3 items-center">
                            {getButtonVisibility(item.serviceStatus || "Booked")
                              .showAddSpare && (
                              <TouchableOpacity
                                onPress={() =>
                                  router.push({
                                    pathname: "/(employee)/add-parts",
                                    params: { serviceId: item.id },
                                  })
                                }
                                style={{ minWidth: 90 }}
                                className="bg-success/10 py-4 px-4 rounded-2xl items-center justify-center border border-success/20"
                              >
                                <Ionicons
                                  name="cart"
                                  size={20}
                                  color={COLORS.success}
                                />
                              </TouchableOpacity>
                            )}
                            {getButtonVisibility(item.serviceStatus || "Booked")
                              .showBilling && (
                              <TouchableOpacity
                                onPress={() =>
                                  router.push({
                                    pathname: "/(employee)/add-billing",
                                    params: {
                                      directServiceId: item.id.toString(),
                                    },
                                  })
                                }
                                style={{ minWidth: 90 }}
                                className="bg-warning/10 py-4 px-4 rounded-2xl items-center justify-center border border-warning/20"
                              >
                                <Ionicons
                                  name="receipt"
                                  size={20}
                                  color={COLORS.warning}
                                />
                              </TouchableOpacity>
                            )}
                            {getMappedStatus(
                              item.serviceStatus || item.status,
                            ) === "Waiting for Spare" && (
                              <TouchableOpacity
                                onPress={() => {
                                  setSelectedBooking(item);
                                  setCloseModalVisible(true);
                                }}
                                style={{ minWidth: 90 }}
                                className="bg-error/10 py-4 px-4 rounded-2xl items-center justify-center flex-col border border-error/20"
                              >
                                <Text className="text-error font-black text-xs uppercase">
                                  {getHoursDifference(
                                    item.updatedAt || item.updated_at,
                                  ) >= 72
                                    ? "TIME OUT"
                                    : "NO RESPONSE"}
                                </Text>
                                <Text className="text-error font-bold text-[10px] mt-1 opacity-70">
                                  {getElapsedTime(
                                    item.updatedAt || item.updated_at,
                                  )}
                                </Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        )}
                      </View>

                      {item.assignedEmployeeName && (
                        <View className="flex-row items-center gap-2 mt-4 pt-4 px-5 border-t border-slate-700">
                          <Ionicons
                            name="settings"
                            size={12}
                            color={COLORS.textMuted}
                          />
                          <Text className="text-xs font-bold p-2 text-text-secondary">
                            Assigned to:{" "}
                            <Text className="text-primary">
                              {item.assignedEmployeeName}
                            </Text>
                          </Text>
                        </View>
                      )}
                    </>
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* FIXED NEW INVOICE BUTTON */}
        <View className="absolute right-5 bottom-6 z-30">
          <TouchableOpacity
            onPress={() => router.push("/(employee)/add-billing" as any)}
            className="flex-row items-center gap-2 bg-primary px-5 py-4 rounded-full shadow-2xl"
          >
            <Ionicons name="add" size={20} color={COLORS.background} />
            <Text className="text-background font-black text-sm uppercase">
              New Invoice
            </Text>
          </TouchableOpacity>
        </View>

        {/* ASSIGN MODAL */}
        <Modal visible={modalVisible} transparent animationType="fade">
          <View className="flex-1 bg-black/60 justify-center p-6">
            <View className="bg-card rounded-3xl p-8 border border-slate-700">
              <Text className="text-2xl font-black text-text-primary text-center mb-2">
                Assign Mechanic
              </Text>
              <Text className="text-text-muted text-center text-xs font-medium mb-8 uppercase tracking-widest">
                Select staff for this vehicle
              </Text>

              <View className="bg-slate-900/40 border border-slate-700 rounded-2xl p-2 mb-8">
                {employees.map((emp) => (
                  <TouchableOpacity
                    key={emp.id}
                    onPress={() => setSelectedEmployeeId(emp.id.toString())}
                    className={`flex-row items-center p-4 rounded-xl mb-1 ${selectedEmployeeId === emp.id.toString() ? "bg-primary" : ""}`}
                  >
                    <View
                      className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${selectedEmployeeId === emp.id.toString() ? "bg-white/20" : "bg-slate-900/40"}`}
                    >
                      <Ionicons
                        name="person"
                        size={16}
                        color={
                          selectedEmployeeId === emp.id.toString()
                            ? COLORS.background
                            : COLORS.textMuted
                        }
                      />
                    </View>
                    <View>
                      <Text
                        className={`font-bold ${selectedEmployeeId === emp.id.toString() ? "text-background" : "text-text-secondary"}`}
                      >
                        {emp.name}
                      </Text>
                      <Text
                        className={`text-[10px] ${selectedEmployeeId === emp.id.toString() ? "text-background/70" : "text-text-muted"}`}
                      >
                        {emp.role || "Staff"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              <View className="flex-row gap-4">
                <TouchableOpacity
                  onPress={() => {
                    setModalVisible(false);
                    setSelectedEmployeeId("");
                  }}
                  className="flex-1 py-4 bg-slate-900/40 rounded-2xl items-center border border-slate-700"
                >
                  <Text className="text-text-secondary font-black text-[11px] uppercase tracking-widest">
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={assignEmployee}
                  disabled={!selectedEmployeeId || assigning}
                  className={`flex-1 py-4 rounded-2xl items-center ${!selectedEmployeeId || assigning ? "bg-slate-900/40 border border-slate-700" : "bg-primary"}`}
                >
                  {assigning ? (
                    <ActivityIndicator color={COLORS.primary} />
                  ) : (
                    <Text
                      className={`font-black text-[11px] uppercase tracking-widest ${!selectedEmployeeId || assigning ? "text-text-secondary" : "text-background"}`}
                    >
                      Assign Now
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* ISSUE MODAL */}
        <Modal visible={issueModalVisible} transparent animationType="slide">
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            className="flex-1 bg-black/60 justify-end"
          >
            <View className="bg-card border-t border-slate-700 h-full w-full">
              <View className="flex-row justify-between items-center px-7 pt-7 pb-5 border-b border-slate-700">
                <View className="flex-row items-center gap-3.5">
                  <View className="w-11 h-11 rounded-2xl bg-sky-500/15 items-center justify-center border border-white">
                    <Ionicons
                      name="construct-outline"
                      size={20}
                      color={COLORS.primary}
                    />
                  </View>
                  <View>
                    <Text className="text-text-primary text-xl font-black uppercase">
                      Manage Issues
                    </Text>
                    <Text className="text-text-secondary text-[9px] font-black uppercase tracking-widest">
                      Itemized service reporting
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setIssueModalVisible(false)}>
                  <Ionicons name="close" size={24} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>

              <View className="flex-1">
                <ScrollView
                  className="flex-1 px-7 pt-7"
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 120 }}
                >
                  {issueEntries.map((entry, idx) => (
                    <View
                      key={idx}
                      className="bg-slate-900/40 border border-slate-700 rounded-2xl p-5 mb-4"
                    >
                      <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                          Task #{idx + 1}
                        </Text>
                        <TouchableOpacity
                          onPress={() => {
                            const copy = [...issueEntries];
                            copy.splice(idx, 1);
                            setIssueEntries(copy);
                          }}
                        >
                          <Ionicons
                            name="trash"
                            size={16}
                            color={COLORS.error}
                          />
                        </TouchableOpacity>
                      </View>

                      <TextInput
                        value={entry.issue}
                        onChangeText={(t) => {
                          const copy = [...issueEntries];
                          copy[idx].issue = t;
                          setIssueEntries(copy);
                        }}
                        placeholder="Describe car issue..."
                        placeholderTextColor={COLORS.textMuted}
                        multiline
                        className="bg-slate-900/60 border border-slate-700 rounded-2xl p-4 text-text-primary font-bold text-sm min-h-[80px]"
                      />

                      <View className="flex-row gap-4 mt-4 items-center">
                        <View className="flex-1 relative">
                          <Text className="absolute left-4 top-3.5 z-10 text-success font-black">
                            ₹
                          </Text>
                          <TextInput
                            value={entry.issueAmount?.toString()}
                            onChangeText={(t) => {
                              const copy = [...issueEntries];
                              copy[idx].issueAmount = t;
                              setIssueEntries(copy);
                            }}
                            placeholder="0.00"
                            placeholderTextColor={COLORS.textMuted}
                            keyboardType="numeric"
                            className="bg-slate-900/60 border border-slate-700 rounded-2xl pl-8 pr-4 py-3.5 text-text-primary font-black"
                          />
                        </View>
                        <View
                          className={`px-4 py-3 rounded-2xl border ${entry.issueStatus === "approved" ? "bg-success/10 border-success" : "bg-slate-900/40 border-slate-700"}`}
                        >
                          <Text
                            className={`text-[10px] font-black uppercase tracking-widest ${entry.issueStatus === "approved" ? "text-text-primary" : "text-text-muted"}`}
                          >
                            {entry.issueStatus || "pending"}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}

                  <TouchableOpacity
                    onPress={() =>
                      setIssueEntries([
                        ...issueEntries,
                        { issue: "", issueAmount: "", issueStatus: "pending" },
                      ])
                    }
                    className="flex-row items-center justify-center p-4 rounded-2xl bg-success border border-card border-dashed"
                  >
                    <Ionicons name="add-circle" size={20} color="#fff" />
                    <Text className="text-text-primary font-bold ml-2 uppercase text-[10px] tracking-widest">
                      Add another task
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>

              <View className="px-7 pb-7 border-t border-slate-700 pt-5">
                <TouchableOpacity
                  onPress={saveIssues}
                  disabled={savingIssues}
                  className={`w-full py-4 bg-primary rounded-2xl items-center ${savingIssues ? "opacity-30" : ""}`}
                >
                  {savingIssues ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text className="text-text-primary font-black uppercase tracking-widest">
                      Save All Changes
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* CLOSE BOOKING MODAL */}
        <Modal visible={closeModalVisible} transparent animationType="slide">
          <View className="flex-1 bg-black/60 justify-end">
            <View className="bg-card rounded-t-[40px] p-8 pb-12 border-t border-slate-700">
              <View className="w-12 h-1.5 bg-slate-600 rounded-full self-center mb-8" />

              <Text className="text-text-primary text-xl font-black uppercase text-center mb-2">
                Close Booking
              </Text>
              <Text className="text-error text-[9px] font-black uppercase tracking-widest text-center mb-6">
                Reason Required
              </Text>

              <View className="bg-slate-900/40 rounded-2xl border border-slate-700 mb-4 min-h-[100px]">
                <TextInput
                  placeholder="DETAILED REASON"
                  placeholderTextColor={COLORS.textMuted}
                  value={closeReason}
                  onChangeText={setCloseReason}
                  multiline
                  numberOfLines={4}
                  className="flex-1 p-5 text-text-primary font-semibold text-xs leading-relaxed"
                  style={{ textAlignVertical: "top" }}
                />
              </View>

              <View className="flex-row gap-4">
                <TouchableOpacity
                  onPress={() => {
                    setCloseModalVisible(false);
                    setCloseReason("");
                  }}
                  className="flex-1 py-4 bg-slate-900/40 rounded-2xl items-center border border-slate-700"
                >
                  <Text className="text-text-secondary font-black text-[11px] uppercase tracking-widest">
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleCloseBooking}
                  disabled={isClosing || !closeReason.trim()}
                  className={`flex-1 py-4 rounded-2xl items-center ${isClosing || !closeReason.trim() ? "bg-slate-900/40 border border-slate-700" : "bg-error"}`}
                >
                  {isClosing ? (
                    <ActivityIndicator color={COLORS.error} />
                  ) : (
                    <Text
                      className={`font-black text-[11px] uppercase tracking-widest ${isClosing || !closeReason.trim() ? "text-text-secondary" : "text-text-primary"}`}
                    >
                      Close Booking
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* STATUS SELECT MODAL */}
        <Modal visible={statusModalVisible} transparent animationType="slide">
          <View className="flex-1 bg-black/60 justify-end">
            <View className="bg-card rounded-t-[40px] p-8 pb-12 border-t border-slate-700">
              <View className="w-12 h-1.5 bg-slate-600 rounded-full self-center mb-8" />

              <Text className="text-text-primary text-xl font-black uppercase text-center mb-6">
                Update Status
              </Text>

              <View className="gap-2.5 mb-6">
                {STATUS_STEPS.filter((s) => {
                  const currentIndex = STATUS_STEPS.indexOf(
                    activeServiceForStatus?.serviceStatus || "Booked",
                  );
                  const stepIndex = STATUS_STEPS.indexOf(s);
                  return stepIndex >= currentIndex;
                }).map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => {
                      handleStatusChange(activeServiceForStatus, s);
                      setStatusModalVisible(false);
                    }}
                    className={`p-4 rounded-2xl flex-row justify-between items-center border ${activeServiceForStatus?.serviceStatus === s ? "bg-primary border-primary" : "bg-slate-900/40 border-slate-700"}`}
                  >
                    <Text
                      className={`font-black text-[11px] uppercase tracking-widest ${activeServiceForStatus?.serviceStatus === s ? "text-background" : "text-text-secondary"}`}
                    >
                      {getStatusDisplayName(s)}
                    </Text>
                    {activeServiceForStatus?.serviceStatus === s && (
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color={COLORS.background}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                onPress={() => setStatusModalVisible(false)}
                className="py-3.5 px-5 bg-error rounded-2xl items-center border border-error"
              >
                <Text className="text-text-primary font-black text-[11px] uppercase tracking-widest">
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}
