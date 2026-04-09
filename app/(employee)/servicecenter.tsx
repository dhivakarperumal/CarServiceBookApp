import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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

const { width } = Dimensions.get("window");

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
  "Bill Pending",
  "Bill Completed",
  "Service Completed",
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "Booked":
    case "Approved":
      return "bg-primary text-text-primary";
    case "Processing":
      return "bg-primary text-text-primary";
    case "Waiting for Spare":
      return "bg-warning text-text-primary";
    case "Service Going on":
      return "bg-warning text-text-primary";
    case "Bill Pending":
      return "bg-error text-text-primary";
    case "Bill Completed":
      return "bg-accent text-text-primary";
    case "Service Completed":
      return "bg-success text-text-primary";
    default:
      return "bg-text-muted text-text-primary";
  }
};

export default function ServiceCenter() {
  const router = useRouter();
  const { user: userProfile } = useAuth();
  const userRole = (userProfile?.role || "").toLowerCase();
  const isMechanic = userRole === "mechanic" || userRole === "staff";

  const [mainTab, setMainTab] = useState("booked"); // booked | addVehicle
  const [subTab, setSubTab] = useState(isMechanic ? "assigned" : "unassigned");
  const [services, setServices] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [assigning, setAssigning] = useState(false);

  // Status Selection Modal
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [activeServiceForStatus, setActiveServiceForStatus] =
    useState<any>(null);

  // Issue Editing Modal
  const [issueModalVisible, setIssueModalVisible] = useState(false);
  const [issueEntries, setIssueEntries] = useState<any[]>([]);
  const [editingServiceId, setEditingServiceId] = useState<any>(null);
  const [savingIssues, setSavingIssues] = useState(false);

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

      const servicesWithDetails = [];
      const servicesRaw = servRes.data || [];

      // Fetch details for each service to get parts and issues
      for (const service of servicesRaw) {
        try {
          const detailRes = await api.get(`/all-services/${service.id}`);
          servicesWithDetails.push({
            ...service,
            parts: detailRes.data?.parts || [],
            issues: detailRes.data?.issues || [],
          });
        } catch (err) {
          servicesWithDetails.push({ ...service, parts: [], issues: [] });
        }
      }

      setServices(servicesWithDetails);
      setEmployees(empRes.data || []);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const [servRes, empRes] = await Promise.all([
        api.get("/all-services"),
        api.get("/staff"),
      ]);

      const servicesWithDetails = [];
      const servicesRaw = servRes.data || [];

      for (const service of servicesRaw) {
        try {
          const detailRes = await api.get(`/all-services/${service.id}`);
          servicesWithDetails.push({
            ...service,
            parts: detailRes.data?.parts || [],
            issues: detailRes.data?.issues || [],
          });
        } catch (err) {
          servicesWithDetails.push({ ...service, parts: [], issues: [] });
        }
      }

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
      // Main Tab Filter
      const isDirect = !!s.addVehicle;
      if (mainTab === "booked" && isDirect) return false;
      if (mainTab === "addVehicle" && !isDirect) return false;

      // Sub Tab Filter
      if (subTab === "assigned") {
        if (!s.assignedEmployeeId) return false;
        if (
          isMechanic &&
          (s.assignedEmployeeName || "").toLowerCase() !==
            mechanicName.toLowerCase()
        )
          return false;

        // Status Filter: Only show active jobs
        const validStatuses = ["Processing", "Waiting for Spare"];
        if (!validStatuses.includes(s.serviceStatus || "")) return false;
      } else {
        if (s.assignedEmployeeId) return false;
      }

      // Search Filter
      const text =
        `${s.bookingId || ""} ${s.name || s.customer_name || ""} ${s.phone || s.mobile || ""} ${s.brand || ""} ${s.model || ""} ${s.vehicleNumber || s.vehicle_number || ""}`.toLowerCase();
      if (search && !text.includes(search.toLowerCase())) return false;

      return true;
    });
  }, [services, mainTab, subTab, search, userProfile]);

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

  const openIssueEditor = (service: any) => {
    setEditingServiceId(service.id);
    let initialIssues = [...(service.issues || [])];
    if (initialIssues.length === 0 && service.carIssue) {
      initialIssues.push({
        issue: service.carIssue,
        issueAmount: service.issueAmount || 0,
        issueStatus: service.issueStatus || "pending",
      });
    }
    setIssueEntries(initialIssues);
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

      Alert.alert("Success", "Issue entries saved");
      setIssueModalVisible(false);
      loadData();
    } catch (error) {
      Alert.alert("Error", "Failed to save issue entries");
    } finally {
      setSavingIssues(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#0EA5E9" />
        <Text className="text-text-secondary mt-4 font-bold tracking-widest text-[10px] uppercase">
          Syncing workshop data...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* HEADER */}
      <View className="bg-card p-6 pb-4 border-b border-card">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-2xl font-black text-text-primary">
              Service Board
            </Text>
            <Text className="text-text-secondary text-[10px] font-black uppercase tracking-wider">
              Track vehicle flow
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(employee)/add-billing" as any)}
            className="bg-primary rounded-xl px-4 py-2.5 flex-row items-center gap-1"
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text className="text-text-primary font-black text-xs">
              NEW INVOICE
            </Text>
          </TouchableOpacity>
        </View>

        {/* SEARCH */}
        <View className="relative mb-4">
          <View className="absolute left-4 top-3.5 z-10">
            <Ionicons name="search" size={18} color="#64748b" />
          </View>
          <TextInput
            placeholder="Search bookings, vehicles..."
            placeholderTextColor="#64748b"
            value={search}
            onChangeText={setSearch}
            className="w-full bg-background border border-card rounded-2xl pl-12 pr-4 py-3.5 text-text-primary font-bold text-sm"
          />
        </View>

        {/* MAIN TABS */}
        <View className="flex-row bg-background p-1 rounded-2xl border border-card">
          <TouchableOpacity
            onPress={() => setMainTab("booked")}
            className={`flex-1 py-3 items-center rounded-xl ${mainTab === "booked" ? "bg-primary" : ""}`}
          >
            <Text
              className={`font-black text-[10px] uppercase tracking-widest ${mainTab === "booked" ? "text-text-primary" : "text-text-muted"}`}
            >
              Appointment (
              {
                services.filter(
                  (s) =>
                    !s.addVehicle &&
                    (isMechanic
                      ? (s.assignedEmployeeName || "").toLowerCase() ===
                        (userProfile?.username || "").toLowerCase()
                      : true),
                ).length
              }
              )
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setMainTab("addVehicle")}
            className={`flex-1 py-3 items-center rounded-xl ${mainTab === "addVehicle" ? "bg-primary" : ""}`}
          >
            <Text
              className={`font-black text-[10px] uppercase tracking-widest ${mainTab === "addVehicle" ? "text-text-primary" : "text-text-muted"}`}
            >
              Direct Visit (
              {
                services.filter(
                  (s) =>
                    !!s.addVehicle &&
                    (isMechanic
                      ? (s.assignedEmployeeName || "").toLowerCase() ===
                        (userProfile?.username || "").toLowerCase()
                      : true),
                ).length
              }
              )
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* SUB TABS */}
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={() => setSubTab("assigned")}
            className={`px-6 py-2 rounded-full border ${subTab === "assigned" ? "bg-primary border-primary" : "bg-card border-card"}`}
          >
            <Text
              className={`text-[10px] font-black uppercase tracking-widest ${subTab === "assigned" ? "text-text-primary" : "text-text-muted"}`}
            >
              My Tasks (
              {
                services.filter(
                  (s) =>
                    (s.serviceStatus === "Processing" ||
                      s.serviceStatus === "Waiting for Spare") &&
                    s.assignedEmployeeId &&
                    (isMechanic
                      ? (s.assignedEmployeeName || "").toLowerCase() ===
                        (userProfile?.username || "").toLowerCase()
                      : true),
                ).length
              }
              )
            </Text>
          </TouchableOpacity>
          {!isMechanic && (
            <TouchableOpacity
              onPress={() => setSubTab("unassigned")}
              className={`px-6 py-2 rounded-full border ${subTab === "unassigned" ? "bg-primary border-primary" : "bg-card border-card"}`}
            >
              <Text
                className={`text-[10px] font-black uppercase tracking-widest ${subTab === "unassigned" ? "text-text-primary" : "text-text-muted"}`}
              >
                Unassigned (
                {services.filter((s) => !s.assignedEmployeeId).length})
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* SERVICE CARDS */}
        <View className="px-5 pb-24">
          {filteredList.length === 0 ? (
            <View className="bg-card rounded-3xl p-12 items-center border border-card border-dashed mt-10">
              <Ionicons name="car-outline" size={48} color="#64748B" />
              <Text className="text-text-secondary font-black mt-4">
                No Vehicles Found
              </Text>
              <Text className="text-text-muted text-xs text-center mt-2 leading-4">
                No matching records in the current queue.
              </Text>
            </View>
          ) : (
            filteredList.map((item) => (
              <View
                key={item.id}
                className="bg-card rounded-3xl border border-card p-6 mb-5"
              >
                <View className="flex-row justify-between items-start mb-5">
                  <View
                    className={`px-3 py-1 rounded-full border ${getStatusColor(item.serviceStatus || "Booked")}`}
                  >
                    <Text className="text-[10px] font-black uppercase tracking-widest">
                      {item.serviceStatus || "Booked"}
                    </Text>
                  </View>
                  <Text className="text-[14px] font-black text-text-primary uppercase tracking-widest">
                    ID: {item.bookingId || `SER-${item.id}`}
                  </Text>
                </View>

                <View className="mb-4">
                  <Text className="text-2xl font-black text-text-primary">
                    {item.brand} {item.model}
                  </Text>
                  <Text className="text-sm font-black text-primary mt-1 uppercase">
                    {item.vehicleNumber || item.vehicle_number || "NO PLATE"}
                  </Text>
                  <Text className="text-sm text-text-secondary font-medium mt-2">
                    Customer: {item.name || item.customer_name} •{" "}
                    {item.phone || item.mobile}
                  </Text>
                </View>

                {/* PROGRESS BAR */}
                <View className="flex-row items-center gap-1 mb-6 mt-2">
                  {STATUS_STEPS.map((step, idx) => {
                    const currentIdx = STATUS_STEPS.indexOf(
                      item.serviceStatus || "Booked",
                    );
                    const active = idx <= currentIdx;
                    return (
                      <View
                        key={step}
                        className={`h-1.5 flex-1 rounded-full ${active ? "bg-primary" : "bg-card"}`}
                      />
                    );
                  })}
                </View>

                {/* ISSUES SECTION */}
                <View className="bg-background rounded-2xl p-4 border border-card mb-5">
                  <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-[12px] font-black text-text-muted uppercase tracking-widest">
                      Job Details / Issues
                    </Text>
                    {item.assignedEmployeeId && (
                      <TouchableOpacity
                        onPress={() => openIssueEditor(item)}
                        className="flex-row items-center gap-1 p-2 bg-primary rounded-md"
                      >
                        <Ionicons name="add" size={14} color="#FFFFFF" />
                        <Text className="text-[10px] font-black text-text-primary  uppercase tracking-widest">
                          Add Issues
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  {item.issues?.length > 0 || item.carIssue ? (
                    <View className="gap-2">
                      {(item.issues?.length > 0
                        ? item.issues
                        : [
                            {
                              issue: item.carIssue || item.issue,
                              issueAmount: item.issueAmount || 0,
                              status: item.issueStatus || "pending",
                            },
                          ]
                      ).map((iss: any, idx: number) => (
                        <View
                          key={idx}
                          className="bg-card p-3 rounded-xl border border-card"
                        >
                          <Text className="text-xs font-bold text-text-secondary leading-snug">
                            {iss.issue}
                          </Text>
                          <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-card">
                            <Text className="text-[10px] font-black text-success">
                              ₹{Number(iss.issueAmount || 0).toFixed(2)}
                            </Text>
                            <Text className="text-[8px] font-black text-text-muted uppercase tracking-widest">
                              {iss.issueStatus || iss.status || "pending"}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text className="text-[12px] text-text-muted italic">
                      No job issues recorded yet.
                    </Text>
                  )}
                </View>

                {/* SPARE PARTS */}
                {item.parts?.length > 0 && (
                  <View className="bg-background rounded-2xl p-4 border border-card mb-6">
                    <Text className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-3">
                      Assigned Parts
                    </Text>
                    <View className="gap-2">
                      {item.parts.map((part: any, idx: number) => (
                        <View
                          key={part.id || idx}
                          className="flex-row justify-between items-center bg-card p-2.5 rounded-xl border border-card"
                        >
                          <View>
                            <Text className="text-md font-bold text-text-primary">
                              {part.partName}
                            </Text>
                            <Text className="text-[12px] text-text-primary">
                              Qty: {part.qty || 1}
                            </Text>
                          </View>
                          <View className="items-end">
                            <Text className="text-md font-black text-text-primary">
                              ₹{Number(part.total || 0).toFixed(2)}
                            </Text>
                            <View
                              className={`px-2 py-1 rounded-md mt-2 border ${part.status === "approved" ? "bg-success border-success" : "bg-warning border-warning"}`}
                            >
                              <Text
                                className={`text-[10px] font-black uppercase ${part.status === "approved" ? "text-text-primary" : "text-text-primary"}`}
                              >
                                {part.status || "pending"}
                              </Text>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* FOOTER ACTIONS */}
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={() =>
                      router.push(
                        `/(employee)/service-details?id=${item.id}` as any,
                      )
                    }
                    className="bg-primary/10 p-4 px-6 rounded-2xl items-center justify-center"
                  >
                    <Ionicons name="eye" size={20} color="#0EA5E9" />
                  </TouchableOpacity>

                  {!item.assignedEmployeeId ? (
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedBooking(item);
                        setModalVisible(true);
                      }}
                      className="flex-1 bg-primary py-3.5 rounded-2xl items-center justify-center flex-row"
                    >
                      <Ionicons name="person-add" size={16} color="#FFFFFF" />
                      <Text className="text-text-primary font-black text-xs ml-2">
                        ASSIGN MECHANIC
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View className="flex-1 flex-row gap-3">
                      <TouchableOpacity
                        onPress={() => {
                          setActiveServiceForStatus(item);
                          setStatusModalVisible(true);
                        }}
                        className="flex-1 bg-background border border-card rounded-2xl overflow-hidden"
                      >
                        <View className="flex-row items-center px-4 py-2">
                          <Ionicons
                            name="construct"
                            size={14}
                            color="#64748B"
                          />
                          <Text className="text-[10px] font-black text-text-muted ml-2 uppercase">
                            Status
                          </Text>
                        </View>
                        <View className="px-4 pb-3 flex-row justify-between items-center">
                          <Text className="text-text-primary font-bold text-sm">
                            {item.serviceStatus || "Booked"}
                          </Text>
                          <Ionicons
                            name="chevron-down"
                            size={14}
                            color="#64748B"
                          />
                        </View>
                      </TouchableOpacity>

                      {(item.serviceStatus === "Processing" ||
                        item.serviceStatus === "Waiting for Spare") && (
                        <TouchableOpacity
                          onPress={() =>
                            router.push({
                              pathname: "/(employee)/add-parts",
                              params: { serviceId: item.id },
                            })
                          }
                          className="bg-success p-4 px-6 rounded-2xl items-center justify-center"
                        >
                          <Ionicons name="cart" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        onPress={() =>
                          router.push({
                            pathname: "/(employee)/billing",
                            params: { serviceId: item.id },
                          })
                        }
                        className="bg-warning p-4 px-6 rounded-2xl items-center justify-center"
                      >
                        <Ionicons name="receipt" size={20} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {item.assignedEmployeeName && (
                  <View className="flex-row items-center gap-2 mt-4 pt-4 border-t border-card">
                    <Ionicons name="settings" size={12} color="#64748B" />
                    <Text className="text-xs font-bold text-text-secondary">
                      Assigned to:{" "}
                      <Text className="text-primary">
                        {item.assignedEmployeeName}
                      </Text>
                    </Text>
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* ASSIGN MODAL */}
      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View className="flex-1 bg-black/60 justify-center p-6">
          <View className="bg-card rounded-3xl p-8 border border-card">
            <Text className="text-2xl font-black text-text-primary text-center mb-2">
              Assign Mechanic
            </Text>
            <Text className="text-text-muted text-center text-xs font-medium mb-8 uppercase tracking-widest">
              Select staff for this vehicle
            </Text>

            <View className="bg-background border border-card rounded-2xl p-2 mb-8">
              {employees.map((emp) => (
                <TouchableOpacity
                  key={emp.id}
                  onPress={() => setSelectedEmployeeId(emp.id.toString())}
                  className={`flex-row items-center p-4 rounded-xl mb-1 ${selectedEmployeeId === emp.id.toString() ? "bg-primary" : ""}`}
                >
                  <View
                    className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${selectedEmployeeId === emp.id.toString() ? "bg-white/20" : "bg-card"}`}
                  >
                    <Ionicons
                      name="person"
                      size={16}
                      color={
                        selectedEmployeeId === emp.id.toString()
                          ? "#FFFFFF"
                          : "#64748B"
                      }
                    />
                  </View>
                  <View>
                    <Text
                      className={`font-bold ${selectedEmployeeId === emp.id.toString() ? "text-text-primary" : "text-text-secondary"}`}
                    >
                      {emp.name}
                    </Text>
                    <Text
                      className={`text-[10px] ${selectedEmployeeId === emp.id.toString() ? "text-text-primary/70" : "text-text-muted"}`}
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
                className="flex-1 py-4 bg-card rounded-2xl items-center"
              >
                <Text className="text-text-secondary font-bold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={assignEmployee}
                disabled={!selectedEmployeeId || assigning}
                className={`flex-1 py-4 bg-primary rounded-2xl items-center ${!selectedEmployeeId || assigning ? "opacity-50" : ""}`}
              >
                {assigning ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-text-primary font-bold">
                    Assign Now
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ISSUE MODAL */}
      <Modal
        visible={issueModalVisible}
        transparent={true}
        animationType="slide"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1 bg-black/60 justify-end"
        >
          <View className="bg-card rounded-t-3xl p-8 pb-12 border-t border-card">
            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text className="text-2xl font-black text-text-primary">
                  Manage Issues
                </Text>
                <Text className="text-text-muted text-[10px] font-black uppercase tracking-widest mt-1">
                  Itemized service reporting
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIssueModalVisible(false)}>
                <Ionicons name="close" size={28} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView
              className="max-h-[50vh] mb-6"
              showsVerticalScrollIndicator={false}
            >
              {issueEntries.map((entry, idx) => (
                <View
                  key={idx}
                  className="bg-background border border-card rounded-3xl p-5 mb-4"
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
                      <Ionicons name="trash" size={16} color="#EF4444" />
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
                    placeholderTextColor="#64748B"
                    multiline
                    className="bg-card border border-card rounded-2xl p-4 text-text-primary font-bold text-sm min-h-[80px]"
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
                        placeholderTextColor="#64748B"
                        keyboardType="numeric"
                        className="bg-card border border-card rounded-2xl pl-8 pr-4 py-3.5 text-text-primary font-black"
                      />
                    </View>
                    <View
                      className={`px-4 py-3 rounded-2xl border ${entry.issueStatus === "approved" ? "bg-success border-success" : "bg-card border-card"}`}
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
                className="flex-row items-center justify-center p-4 rounded-2xl border border-card border-dashed"
              >
                <Ionicons name="add-circle" size={20} color="#64748B" />
                <Text className="text-text-muted font-bold ml-2 uppercase text-[10px] tracking-widest">
                  Add another task
                </Text>
              </TouchableOpacity>
            </ScrollView>

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
        </KeyboardAvoidingView>
      </Modal>

      {/* STATUS SELECT MODAL */}
      <Modal
        visible={statusModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View className="flex-1 bg-black/60 justify-center p-6">
          <View className="bg-card rounded-3xl p-8 border border-card">
            <Text className="text-2xl font-black text-text-primary text-center mb-6">
              Update Status
            </Text>

            <View className="bg-background border border-card rounded-3xl overflow-hidden max-h-[60vh]">
              <ScrollView showsVerticalScrollIndicator={false}>
                {["Processing", "Waiting for Spare"].map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => {
                      handleStatusChange(activeServiceForStatus, s);
                      setStatusModalVisible(false);
                    }}
                    className={`p-5 border-b border-card flex-row items-center justify-between ${activeServiceForStatus?.serviceStatus === s ? "bg-primary" : ""}`}
                  >
                    <Text
                      className={`font-black uppercase tracking-widest text-xs ${activeServiceForStatus?.serviceStatus === s ? "text-text-primary" : "text-text-secondary"}`}
                    >
                      {s}
                    </Text>
                    {activeServiceForStatus?.serviceStatus === s && (
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color="#FFFFFF"
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <TouchableOpacity
              onPress={() => setStatusModalVisible(false)}
              className="mt-6 w-full py-4 bg-card rounded-2xl items-center"
            >
              <Text className="text-text-secondary font-bold uppercase tracking-widest text-[10px]">
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
