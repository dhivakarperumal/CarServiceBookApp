import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../services/api";
import { COLORS } from "../../theme/colors";

const STATUS_STEPS = [
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
    showOptions:
      currentIndex >= STATUS_STEPS.indexOf("Processing") &&
      currentIndex < STATUS_STEPS.indexOf("Service Completed"),
    showBilling: status === "Bill Pending" || status === "Service Completed",
  };
};

const StatCard = ({
  title,
  value,
  IconComponent,
  iconName,
  iconColor,
}: any) => (
  <View
    style={{ backgroundColor: COLORS.card }}
    className="mr-4 p-5 rounded-3xl border border-white/5 w-48 shadow-lg"
  >
    <View className="flex-row justify-between items-start mb-6">
      <View className="w-12 h-12 rounded-2xl items-center justify-center bg-white/5">
        <IconComponent name={iconName} size={24} color={iconColor} />
      </View>
      <Text className="text-white/20 font-black text-[8px] uppercase tracking-widest">
        {title}
      </Text>
    </View>
    <Text className="text-white text-3xl font-black">{value}</Text>
  </View>
);

export default function Services() {
  const router = useRouter();
  const { user: userProfile } = useAuth();
  const userRole = (userProfile?.role || "").toLowerCase();
  const isMechanic = userRole === "mechanic" || userRole === "staff";

  const [mainTab, setMainTab] = useState("all");
  const [services, setServices] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [issueEntries, setIssueEntries] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All Time");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  /* Filter UI State */
  const [filterModal, setFilterModal] = useState<{
    type: "status" | "date";
  } | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [expandedId, setExpandedId] = useState<any>(null);

  const [issueModalVisible, setIssueModalVisible] = useState(false);
  const [editingIssueId, setEditingIssueId] = useState<any>(null);
  const [activeModalTab, setActiveModalTab] = useState("issues");
  const [editingParts, setEditingParts] = useState<any>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [syncing, setSyncing] = useState(false);

  const loadData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const [servRes, empRes, apptsRes, prodRes] = await Promise.all([
        api.get("/all-services"),
        api.get("/staff"),
        api.get("/appointments/all"),
        api.get("/products"),
      ]);

      setProducts(Array.isArray(prodRes.data) ? prodRes.data : []);

      const servicesData = servRes.data || [];
      const apptRaw = apptsRes.data || [];
      const apptsList = Array.isArray(apptRaw)
        ? apptRaw
        : apptRaw.data || apptRaw.appointments || [];

      const servicesWithDetails = await Promise.all(
        servicesData.map(async (service: any) => {
          try {
            const detailRes = await api.get(`/all-services/${service.id}`);
            const details = detailRes.data || {};
            return {
              ...service,
              isAppointment: false,
              parts: details.parts || [],
              issues: details.issues || [],
            };
          } catch (err) {
            return {
              ...service,
              isAppointment: false,
              parts: [],
              issues: [],
            };
          }
        }),
      );

      const combined = [
        ...servicesWithDetails,
        ...apptsList.map((a: any) => ({
          ...a,
          isAppointment: true,
          parts: [],
          issues: [],
        })),
      ];

      const sorted = combined.sort((a, b) => {
        const dateA = new Date(a.created_at || a.createdAt || a.preferredDate || a.date || a.bookingDate || 0);
        const dateB = new Date(b.created_at || b.createdAt || b.preferredDate || b.date || b.bookingDate || 0);
        return dateB.getTime() - dateA.getTime();
      });

      setServices(sorted);
      setEmployees(empRes.data || []);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
    const interval = setInterval(() => {
      loadData(false);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const searchedServices = useMemo(() => {
    return services.filter((s: any) => {
      const sId = (s.bookingId || s.appointmentId || s.id || s._id || "")
        .toString()
        .toLowerCase();
      const sName = (s.name || "").toLowerCase();
      const sPhone = (s.phone || "").toLowerCase();
      const sVehicle =
        `${s.brand || ""} ${s.model || ""} ${s.vehicleNumber || ""} ${s.registrationNumber || ""}`.toLowerCase();

      const searchLower = search.toLowerCase();
      const matchSearch =
        sId.includes(searchLower) ||
        sName.includes(searchLower) ||
        sPhone.includes(searchLower) ||
        sVehicle.includes(searchLower);

      const sStat = (
        s.serviceStatus ||
        s.status ||
        s.appointmentStatus ||
        ""
      ).toLowerCase();
      const matchStatus =
        statusFilter === "All"
          ? ![
              "cancelled",
              "bill completed",
              "booked",
              "confirmed",
              "appointment booked",
            ].includes(sStat)
          : sStat.includes(statusFilter.toLowerCase());

      if (!matchSearch || !matchStatus) return false;
      const bDateStr = s.created_at || s.createdAt || s.preferredDate || s.date || s.bookingDate;
      if (dateFilter === "All Time") return true;
      if (!bDateStr) return false;

      const bookingDate = new Date(bDateStr);
      const now = new Date();
      const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

      if (dateFilter === "Today") {
        return startOfDay(bookingDate).getTime() === startOfDay(now).getTime();
      } else if (dateFilter === "Yesterday") {
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        return startOfDay(bookingDate).getTime() === startOfDay(yesterday).getTime();
      } else if (dateFilter === "This Week") {
        const dayOfWeek = now.getDay();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - dayOfWeek);
        weekStart.setHours(0, 0, 0, 0);
        return bookingDate >= weekStart && bookingDate <= now;
      } else if (dateFilter === "This Month") {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return bookingDate >= monthStart && bookingDate <= now;
      }
      return true;
    });
  }, [services, search, dateFilter]);

  const stats = useMemo(() => {
    const relevantServices = isMechanic
      ? services.filter((s: any) => {
          const empName = (
            s.assignedEmployeeName ||
            s.assigned_employee_name ||
            ""
          ).toLowerCase();
          const targetName = (
            userProfile?.username ||
            (userProfile as any)?.name ||
            ""
          ).toLowerCase();
          return empName === targetName && targetName !== "";
        })
      : services;

    return {
      total: relevantServices.length,
      appointments: relevantServices.filter((s: any) => !s.addVehicle).length,
      bookings: relevantServices.filter((s: any) => s.addVehicle).length,
      assigned: relevantServices.filter(
        (s: any) => !!(s.assignedEmployeeId || s.assigned_employee_id),
      ).length,
      unassigned: isMechanic
        ? 0
        : relevantServices.filter(
            (s: any) => !(s.assignedEmployeeId || s.assigned_employee_id),
          ).length,
      completed: relevantServices.filter((s: any) => {
        const sStat = (
          s.serviceStatus ||
          s.status ||
          s.appointmentStatus ||
          ""
        ).toLowerCase();
        return (
          sStat.includes("completed") || sStat.includes("bill completed")
        );
      }).length,
    };
  }, [services, isMechanic, userProfile]);

  const currentMainList = searchedServices;

  const assignedServices = currentMainList.filter((s: any) => {
    const isAssigned = !!(s.assignedEmployeeId || s.assigned_employee_id);

    if (isMechanic) {
      if (!isAssigned) return false;
      const empName = (
        s.assignedEmployeeName ||
        s.assigned_employee_name ||
        ""
      ).toLowerCase();
      const targetName = (
        userProfile?.username ||
        (userProfile as any)?.name ||
        ""
      ).toLowerCase();
      return empName === targetName;
    }

    const status = (
      s.serviceStatus ||
      s.status ||
      s.appointmentStatus ||
      ""
    ).toLowerCase();
    if (status.includes("bill completed")) return false;
    return true; // Show both assigned and unassigned for Admin
  });

  const totalPages = Math.ceil(assignedServices.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const list = assignedServices;
    const startIndex = (currentPage - 1) * itemsPerPage;
    return list.slice(startIndex, startIndex + itemsPerPage);
  }, [assignedServices, currentPage]);

  const getMappedStatus = (status: string) => {
    if (!status) return "Booked";
    const found = STATUS_STEPS.find(
      (s) => s.toLowerCase() === status.toLowerCase(),
    );
    return found || "Booked";
  };

  const getStatusColor = (status: string) => {
    const mapped = getMappedStatus(status);
    switch (mapped) {
      case "Approved":
        return COLORS.primary;
      case "Processing":
        return "#A855F7";
      case "Waiting for Spare":
        return COLORS.warning;
      case "Service Going on":
        return "#F97316";
      case "Bill Pending":
        return "#EC4899";
      case "Bill Completed":
        return "#06B6D4";
      case "Service Completed":
        return COLORS.success;
      default:
        return COLORS.textSecondary;
    }
  };

  const handleDelete = async (id: number) => {
    Alert.alert(
      "Confirm Removal",
      "Are you sure you want to delete this record?",
      [
        { text: "Abort", style: "cancel" },
        {
          text: "Confirm",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/all-services/${id}`);
              Alert.alert(
                "Registry Updated",
                "Service record purged successfully.",
              );
              loadData();
            } catch {
              Alert.alert("Protocol Error", "Failed to delete service record.");
            }
          },
        },
      ],
    );
  };

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    // Optimistic Update
    const oldServices = [...services];
    const updatedServices = services.map((s: any) =>
      (s.id || s._id) === id ? { ...s, serviceStatus: newStatus } : s,
    );
    setServices(updatedServices);

    try {
      await api.put(`/all-services/${id}/status`, { serviceStatus: newStatus });
      Alert.alert("Success", `Status updated to ${newStatus}`);
      // loadData(false); // Refresh silently to sync with server
    } catch (error) {
      setServices(oldServices); // Rollback
      Alert.alert("Error", "Failed to update status");
    }
  };

  const assignEmployee = async () => {
    if (!selectedBooking || !selectedEmployeeId || assigning) return;
    try {
      setAssigning(true);
      const emp: any = employees.find(
        (e: any) =>
          (e.id || e._id).toString() === selectedEmployeeId.toString(),
      );
      if (!emp) return Alert.alert("Error", "Mechanic not found");
      await api.put(
        `/all-services/${selectedBooking.id || selectedBooking._id}/assign`,
        {
          assignedEmployeeId: emp.id || emp._id,
          assignedEmployeeName: emp.name,
          serviceStatus: "Processing",
        },
      );
      Alert.alert("Success", `Mechanic ${emp.name} assigned!`);
      setModalVisible(false);
      loadData();
    } catch {
      Alert.alert("Error", "Assignment failed");
    } finally {
      setAssigning(false);
    }
  };

  const handleOpenIssueModal = (item: any) => {
    setEditingIssueId(item.id || item._id);
    let initialIssues = [...(item.issues || [])];
    if (initialIssues.length === 0) {
      const mainIssueText =
        item.issue || item.otherIssue || item.carIssue || "Routine Checkup";
      initialIssues = [
        {
          issue: mainIssueText,
          issueAmount: item.issueAmount || 0,
          issueStatus: item.issueStatus || "pending",
        },
      ];
    }
    setIssueEntries(initialIssues);
    setEditingParts([...(item.parts || [])]);
    setActiveModalTab("issues");
    setIssueModalVisible(true);
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return { date: "N/A", time: "N/A" };
    const date = new Date(dateStr);
    return {
      date: date.toLocaleDateString("en-GB"),
      time: date.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  if (loading && services.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        


        {/* Stats Section */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-6 mt-5 mb-10"
        >
          <StatCard
            title="Total Volume"
            value={stats.total}
            IconComponent={MaterialCommunityIcons}
            iconName="gauge"
            iconColor={COLORS.primary}
          />
          <StatCard
            title="Appointments"
            value={stats.appointments}
            IconComponent={Ionicons}
            iconName="calendar"
            iconColor="#A855F7"
          />
          <StatCard
            title="Direct Bookings"
            value={stats.bookings}
            IconComponent={Ionicons}
            iconName="car-sport"
            iconColor="#F97316"
          />
          <StatCard
            title="Pending Assignment"
            value={stats.unassigned}
            IconComponent={Ionicons}
            iconName="timer"
            iconColor="#FBBF24"
          />
          <StatCard
            title="Successfully Closed"
            value={stats.completed}
            IconComponent={Ionicons}
            iconName="checkmark-done"
            iconColor="#34D399"
          />
        </ScrollView>



        {/* Search */}
        <View className="px-6 mb-8 gap-4">
          <View className="flex-row items-center bg-white/5 border border-white/10 rounded-3xl px-6 py-2">
            <Ionicons name="search" size={20} color={COLORS.textSecondary} />
            <TextInput
              placeholder="Search Registry..."
              placeholderTextColor={COLORS.textMuted}
              className="flex-1 ml-4 text-white font-bold text-sm"
              value={search}
              onChangeText={(val) => {
                setSearch(val);
                setCurrentPage(1);
              }}
            />
          </View>

          <View className="flex-row gap-3">
            {/* Status Select */}
            <TouchableOpacity
              onPress={() => setFilterModal({ type: "status" })}
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 flex-row justify-between items-center"
            >
              <View>
                <Text className="text-white/30 text-[7px] font-black uppercase tracking-widest text-center">
                  Status
                </Text>
                <Text
                  className="text-white text-[10px] font-black uppercase truncate"
                  numberOfLines={1}
                >
                  {statusFilter}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={12} color={COLORS.primary} />
            </TouchableOpacity>

            {/* Timeframe Select */}
            <TouchableOpacity
              onPress={() => setFilterModal({ type: "date" })}
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 flex-row justify-between items-center"
            >
              <View>
                <Text className="text-white/30 text-[7px] font-black uppercase tracking-widest text-center">
                  Timeframe
                </Text>
                <Text className="text-white text-[10px] font-black uppercase">
                  {dateFilter}
                </Text>
              </View>
              <Ionicons name="calendar-outline" size={12} color={COLORS.primary} />
            </TouchableOpacity>
          </View>


        </View>

        {/* List */}
        <View className="px-6 gap-8">
          {paginatedData.length === 0 ? (
            <View className="bg-white/5 p-20 rounded-3xl items-center border border-dashed border-white/10">
              <Ionicons
                name="document-text-outline"
                size={48}
                color={COLORS.textMuted}
              />
              <Text className="text-white/20 font-black text-[10px] uppercase mt-4">
                No Services Found
              </Text>
            </View>
          ) : (
            paginatedData.map((item: any) => {
              const mappedStatus = getMappedStatus(
                item.serviceStatus || item.status || item.appointmentStatus,
              );
              const statusColor = getStatusColor(mappedStatus);
              const { showOptions, showBilling } = getButtonVisibility(mappedStatus);
              const hasAssignee = !!(item.assignedEmployeeId || item.assigned_employee_id);

               const isExpanded = expandedId === (item.id || item._id);

               return (
                 <View
                   key={item.id || item._id}
                   style={{ backgroundColor: COLORS.card }}
                   className="p-4 rounded-[28px] border border-white/5 shadow-xl mb-3"
                 >
                   {/* TOP ROW: Vehicle & Status */}
                   <View className="flex-row justify-between items-center mb-3">
                     <View className="flex-row items-center gap-2">
                       <View
                         className={`w-2 h-2 rounded-full ${item.vehicleType === "bike" ? "bg-orange-500" : "bg-blue-500"}`}
                       />
                       <Text className="text-white text-md font-black uppercase tracking-tight">
                         {item.brand} {item.model}
                       </Text>
                     </View>
                     <TouchableOpacity
                       onPress={() => {
                         setSelectedBooking(item);
                         setStatusModalVisible(true);
                       }}
                       style={{ backgroundColor: statusColor + "15" }}
                       className="px-2.5 py-1 rounded-lg border border-white/5"
                     >
                       <Text
                         style={{ color: statusColor }}
                         className="text-[7.5px] font-black uppercase tracking-widest"
                       >
                         {mappedStatus}
                       </Text>
                     </TouchableOpacity>
                   </View>
 
                   {/* INFO ROW: Registry Details */}
                   <View className="flex-row justify-between items-end mb-4 px-1">
                     <View className="flex-1">
                       <TouchableOpacity
                         onPress={() =>
                           setExpandedId(isExpanded ? null : (item.id || item._id))
                         }
                         className="flex-row items-center gap-2 mb-1.5"
                       >
                         <Text className="text-primary text-[10px] font-black uppercase tracking-widest bg-primary/5 self-start px-2 py-0.5 rounded-md">
                           {item.appointmentId || item.bookingId || `#${item.id || item._id}`}
                         </Text>
                         <Ionicons
                           name={isExpanded ? "chevron-up" : "chevron-down"}
                           size={10}
                           color={COLORS.primary}
                         />
                       </TouchableOpacity>
                       <Text className="text-white/30 text-[9px] font-bold uppercase tracking-wide">
                         {item.name} • {item.phone || "No Ph"} • {item.email || "No Email"}
                       </Text>
                       <Text className="text-white/20 text-[8px] font-black uppercase mt-0.5 tracking-widest">
                         Mechanic: {item.assignedEmployeeName || item.assigned_employee_name || "Allocation Pending"}
                       </Text>
                     </View>
                   </View>
 
                   {/* EXPANDED CONTENT: ISSUES & PARTS */}
                   {isExpanded && (
                     <View className="mb-4 pt-4 border-t border-white/5">
                       {/* Issues Section */}
                       <View className="mb-4">
                         <Text className="text-white/20 text-[10px] font-black uppercase tracking-[2px] mb-2 px-1">
                           Diagnostic Log
                         </Text>
                         {item.issues && item.issues.length > 0 ? (
                           item.issues.map((iss: any, idx: number) => (
                             <View
                               key={idx}
                               className="bg-white/5 p-3 rounded-xl mb-1.5 flex-row justify-between items-center border border-white/5"
                             >
                               <View className="flex-row items-center gap-3">
                                 <View className="w-1.5 h-1.5 rounded-full bg-primary" />
                                 <Text className="text-white text-[12px] font-black uppercase">
                                   {iss.issue}
                                 </Text>
                               </View>
                               <Text className="text-primary text-[12px] font-bold">
                                 ₹{iss.issueAmount || 0}
                               </Text>
                             </View>
                           ))
                         ) : (
                           <Text className="text-white/10 text-[10px] font-bold uppercase italic px-3 mb-1.5">
                             No issues documented
                           </Text>
                         )}
                       </View>
 
                       {/* Parts Section */}
                       <View>
                         <Text className="text-white/20 text-[10px] font-black uppercase tracking-[2px] mb-2 px-1">
                           Material Allocation
                         </Text>
                         {item.parts && item.parts.length > 0 ? (
                           item.parts.map((part: any, idx: number) => (
                             <View
                               key={idx}
                               className="bg-white/5 p-3 rounded-xl mb-1.5 flex-row justify-between items-center border border-white/5"
                             >
                               <View className="flex-row items-center gap-3">
                                 <View className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                 <Text className="text-white/80 text-[12px] font-black uppercase">
                                   {part.partName || part.name}
                                 </Text>
                               </View>
                               <Text className="text-emerald-500 text-[12px] font-bold">
                                 ₹{part.price || 0}
                               </Text>
                             </View>
                           ))
                         ) : (
                           <Text className="text-white/10 text-[10px] font-bold uppercase italic px-3">
                             No parts allocated
                           </Text>
                         )}
                       </View>
                     </View>
                   )}

                  {/* ACTION ROW: Inline Controls */}
                  <View className="flex-row justify-between items-center bg-white/5 p-1.5 rounded-2xl border border-white/5">
                    <View className="flex-row gap-1.5">
                      {showOptions && (
                        <TouchableOpacity
                          onPress={() => handleOpenIssueModal(item)}
                          className="w-10 h-10 bg-white/5 rounded-xl items-center justify-center border border-white/10"
                        >
                          <Ionicons name="options-outline" size={16} color="white" />
                        </TouchableOpacity>
                      )}

                      {showBilling && (
                        <TouchableOpacity
                          onPress={() =>
                            router.push({
                              pathname: "/(adminPages)/add-billing",
                              params: { directServiceId: item.id || item._id },
                            })
                          }
                          className="w-10 h-10 bg-emerald-500/10 rounded-xl items-center justify-center border border-emerald-500/20"
                        >
                          <Ionicons name="receipt-outline" size={16} color={COLORS.success} />
                        </TouchableOpacity>
                      )}
                    </View>

                    <View className="flex-row gap-1.5">
                      {!hasAssignee && (
                        <TouchableOpacity
                          onPress={() => {
                            setSelectedBooking(item);
                            setModalVisible(true);
                          }}
                          className="bg-primary px-4 h-10 rounded-xl items-center justify-center border border-white/10"
                        >
                          <Text className="text-background font-black text-[9px] uppercase tracking-widest">
                            Assign
                          </Text>
                        </TouchableOpacity>
                      )}
                      
                      <TouchableOpacity
                        onPress={() => handleDelete(item.id || item._id)}
                        className="w-10 h-10 bg-red-500/10 rounded-xl items-center justify-center border border-red-500/20"
                      >
                        <Ionicons name="trash-outline" size={16} color={COLORS.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <View className="flex-row justify-center items-center gap-6 mt-10">
              <TouchableOpacity
                disabled={currentPage === 1}
                onPress={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className={`w-10 h-10 rounded-xl items-center justify-center border border-white/10 ${currentPage === 1 ? "opacity-20" : ""}`}
              >
                <Ionicons name="chevron-back" size={20} color="white" />
              </TouchableOpacity>
              <Text className="text-white font-black text-[10px]">
                PAGE {currentPage} / {totalPages}
              </Text>
              <TouchableOpacity
                disabled={currentPage === totalPages}
                onPress={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                className={`w-10 h-10 rounded-xl items-center justify-center border border-white/10 ${currentPage === totalPages ? "opacity-20" : ""}`}
              >
                <Ionicons name="chevron-forward" size={20} color="white" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Assignment Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View className="flex-1 bg-black/90 justify-end">
          <View className="bg-modal border-t border-white/10 rounded-t-3xl p-10">
            <View className="w-16 h-1 bg-white/10 rounded-full mb-8 self-center" />
            <Text className="text-primary text-2xl font-black uppercase text-center mb-6">
              Assign Tech
            </Text>
            <View className="bg-white/5 border border-white/10 rounded-2xl p-2 mb-8">
              <ScrollView style={{ maxHeight: 300 }}>
                {employees.map((emp: any) => (
                  <TouchableOpacity
                    key={emp.id || emp._id}
                    onPress={() => setSelectedEmployeeId(emp.id || emp._id)}
                    className={`p-5 rounded-xl mb-1 flex-row justify-between items-center ${selectedEmployeeId === (emp.id || emp._id) ? "bg-primary/15 border border-primary" : ""}`}
                  >
                    <Text
                      className={`font-black text-xs uppercase ${selectedEmployeeId === (emp.id || emp._id) ? "text-primary" : "text-white"}`}
                    >
                      {emp.name}
                    </Text>
                    {selectedEmployeeId === (emp.id || emp._id) && (
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color={COLORS.primary}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View className="flex-row gap-4">
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="flex-1 py-5 rounded-2xl bg-white/5 items-center"
              >
                <Text className="text-white/40 font-black text-[10px] uppercase">
                  Abort
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={assignEmployee}
                disabled={!selectedEmployeeId || assigning}
                className={`flex-1 py-5 rounded-2xl bg-primary items-center ${!selectedEmployeeId ? "opacity-20" : ""}`}
              >
                <Text className="text-background font-black text-[10px] uppercase">
                  Confirm
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Status Modal */}
      <Modal visible={statusModalVisible} transparent animationType="slide">
        <View className="flex-1 bg-black/90 justify-end">
          <View className="bg-modal border-t border-white/10 rounded-t-3xl p-10">
            <View className="w-16 h-1 bg-white/10 rounded-full mb-8 self-center" />
            <Text className="text-primary text-2xl font-black uppercase text-center mb-6">
              Update Status
            </Text>
            <ScrollView
              style={{ maxHeight: 400 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-2 mb-4"
            >
              {STATUS_STEPS.filter((_, index) => {
                const currentStatus = getMappedStatus(
                  selectedBooking?.serviceStatus || 
                  selectedBooking?.status || 
                  selectedBooking?.appointmentStatus
                );
                const currentIndex = STATUS_STEPS.findIndex(step => step.toLowerCase() === currentStatus.toLowerCase());
                return index >= Math.max(0, currentIndex);
              }).map((s: string) => (
                <TouchableOpacity
                  key={s}
                  onPress={async () => {
                    if (selectedBooking) {
                      await handleUpdateStatus(
                        selectedBooking.id || selectedBooking._id,
                        s,
                      );
                      setStatusModalVisible(false);
                    }
                  }}
                  className={`p-5 rounded-xl mb-1 flex-row justify-between items-center ${getMappedStatus(selectedBooking?.serviceStatus || selectedBooking?.status || selectedBooking?.appointmentStatus) === s ? "bg-primary/15 border border-primary" : ""}`}
                >
                  <Text
                    className={`font-black text-[10px] uppercase ${getMappedStatus(selectedBooking?.serviceStatus || selectedBooking?.status || selectedBooking?.appointmentStatus) === s ? "text-primary" : "text-white/40"}`}
                  >
                    {s}
                  </Text>
                  {getMappedStatus(selectedBooking?.serviceStatus || selectedBooking?.status || selectedBooking?.appointmentStatus) === s && (
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={COLORS.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setStatusModalVisible(false)}
              className="py-6 rounded-2xl bg-white/5 items-center border border-white/10"
            >
              <Text className="text-white/40 font-black text-[10px] uppercase">
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Manifest Modal */}
      <Modal visible={issueModalVisible} transparent animationType="slide">
        <View className="flex-1 bg-black/95">
          <View className="flex-1 bg-slate-950 mt-10 rounded-t-3xl border-t border-white/10">
            <View className="px-10 py-6 border-b border-white/5 flex-row justify-between items-center">
              <Text className="text-white text-xl font-black uppercase">
                Manifest
              </Text>
              <TouchableOpacity
                onPress={() => setIssueModalVisible(false)}
                className="w-10 h-10 bg-white/5 rounded-xl items-center justify-center"
              >
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
            <View className="flex-row border-b border-white/5">
              <TouchableOpacity
                onPress={() => setActiveModalTab("issues")}
                className={`flex-1 py-4 items-center ${activeModalTab === "issues" ? "border-b-2 border-white" : ""}`}
              >
                <Text
                  className={`font-black text-[10px] uppercase ${activeModalTab === "issues" ? "text-white" : "text-white/40"}`}
                >
                  Issues
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveModalTab("parts")}
                className={`flex-1 py-4 items-center ${activeModalTab === "parts" ? "border-b-2 border-white" : ""}`}
              >
                <Text
                  className={`font-black text-[10px] uppercase ${activeModalTab === "parts" ? "text-white" : "text-white/40"}`}
                >
                  Parts
                </Text>
              </TouchableOpacity>
            </View>
            <ScrollView className="flex-1 p-8">
              {activeModalTab === "issues"
                ? issueEntries.map((entry: any, idx: number) => (
                    <View
                      key={idx}
                      className="bg-white/5 p-6 rounded-2xl mb-4 border border-white/10"
                    >
                      <TextInput
                        placeholder="Details..."
                        placeholderTextColor="#666"
                        multiline
                        className="text-white font-bold text-xs mb-4 bg-black/20 p-4 rounded-xl min-h-[80px]"
                        value={entry.issue}
                        onChangeText={(val) => {
                          const copy = [...issueEntries];
                          copy[idx].issue = val;
                          setIssueEntries(copy);
                        }}
                      />
                      <View className="flex-row gap-4 mb-4">
                        <View className="flex-1 bg-black/20 p-3 rounded-xl border border-white/5 flex-row items-center">
                          <Text className="text-white/20 mr-2">₹</Text>
                          <TextInput
                            placeholder="Cost"
                            placeholderTextColor="#666"
                            keyboardType="numeric"
                            className="text-white font-black text-xs flex-1"
                            value={entry.issueAmount?.toString()}
                            onChangeText={(val) => {
                              const copy = [...issueEntries];
                              copy[idx].issueAmount = val;
                              setIssueEntries(copy);
                            }}
                          />
                        </View>
                        <TouchableOpacity
                          className="flex-1 bg-black/20 p-3 rounded-xl items-center justify-center"
                          onPress={() => {
                            const copy = [...issueEntries];
                            const cycles = ["pending", "approved", "rejected"];
                            copy[idx].issueStatus =
                              cycles[
                                (cycles.indexOf(
                                  copy[idx].issueStatus || "pending",
                                ) +
                                  1) %
                                  3
                              ];
                            setIssueEntries(copy);
                          }}
                        >
                          <Text
                            className={`${entry.issueStatus === "rejected" ? "text-rose-500" : entry.issueStatus === "approved" ? "text-emerald-500" : "text-amber-500"} font-bold text-[10px] uppercase`}
                          >
                            {entry.issueStatus || "pending"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                : editingParts.map((part: any, idx: number) => (
                    <View
                      key={idx}
                      className="bg-white/5 p-6 rounded-2xl mb-4 border border-white/10"
                    >
                      <TextInput
                        placeholder="Part Name (Search Registry...)"
                        placeholderTextColor="#666"
                        className="text-white font-bold text-xs mb-4 bg-black/20 p-4 rounded-xl"
                        value={part.partName}
                        onChangeText={(val) => {
                          const copy = [...editingParts];
                          copy[idx].partName = val;
                          
                          // Auto price if exact match
                          const match = products.find(p => p.name?.toLowerCase() === val.toLowerCase());
                          if (match) {
                            copy[idx].price = match.price || match.offerPrice || 0;
                          }
                          
                          setEditingParts(copy);
                        }}
                      />
                      
                      {/* Product Suggestions */}
                      {part.partName?.length > 1 && (
                        <View className="mb-4">
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row py-2">
                            {products
                              .filter(p => p.name?.toLowerCase().includes(part.partName.toLowerCase()))
                              .slice(0, 5)
                              .map((suggestion, sIdx) => (
                                <TouchableOpacity
                                  key={sIdx}
                                  onPress={() => {
                                    const copy = [...editingParts];
                                    copy[idx].partName = suggestion.name;
                                    copy[idx].price = suggestion.price || suggestion.offerPrice || 0;
                                    setEditingParts(copy);
                                  }}
                                  className="bg-white/10 px-4 py-2 rounded-xl mr-2 border border-white/5"
                                >
                                  <Text className="text-white font-black text-[9px] uppercase tracking-widest">{suggestion.name}</Text>
                                  <Text className="text-primary text-[8px] font-bold mt-1">₹{suggestion.price || suggestion.offerPrice || 0}</Text>
                                </TouchableOpacity>
                              ))}
                          </ScrollView>
                        </View>
                      )}
                      <View className="flex-row gap-4">
                        <TextInput
                          placeholder="Qty"
                          placeholderTextColor="#666"
                          keyboardType="numeric"
                          className="bg-black/20 p-3 rounded-xl text-white font-bold text-xs w-16"
                          value={part.qty?.toString()}
                          onChangeText={(val) => {
                            const copy = [...editingParts];
                            copy[idx].qty = val;
                            setEditingParts(copy);
                          }}
                        />
                        <View className="flex-1 bg-black/20 p-3 rounded-xl border border-white/5 flex-row items-center">
                          <Text className="text-white/20 mr-2">₹</Text>
                          <TextInput
                            placeholder="Price"
                            placeholderTextColor="#666"
                            keyboardType="numeric"
                            className="text-white font-black text-xs flex-1"
                            value={part.price?.toString()}
                            onChangeText={(val) => {
                              const copy = [...editingParts];
                              copy[idx].price = val;
                              setEditingParts(copy);
                            }}
                          />
                        </View>
                      </View>
                    </View>
                  ))}
              <TouchableOpacity
                onPress={() => {
                  if (activeModalTab === "issues")
                    setIssueEntries([
                      ...issueEntries,
                      { issue: "", issueAmount: "", issueStatus: "approved" },
                    ]);
                  else
                    setEditingParts([
                      ...editingParts,
                      { partName: "", qty: 1, price: 0, status: "approved" },
                    ]);
                }}
                className="py-10 border border-dashed border-white/20 rounded-2xl items-center mb-32"
              >
                <Ionicons name="add" size={32} color="#666" />
              </TouchableOpacity>
            </ScrollView>
            <View className="p-8 border-t border-white/5 bg-slate-950 flex-row gap-4">
              <TouchableOpacity
                onPress={() => setIssueModalVisible(false)}
                disabled={syncing}
                className={`flex-1 py-5 rounded-2xl bg-white/5 items-center justify-center ${syncing ? "opacity-20" : ""}`}
              >
                <Text className="text-white/40 font-black text-[10px] uppercase">
                  Abort
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  if (syncing) return;
                  setSyncing(true);
                  try {
                    const issuesToSave = issueEntries.filter((e: any) =>
                      e.issue?.trim(),
                    );

                    // Execute all updates in parallel for maximum performance
                    const updatePromises: Promise<any>[] = [
                      ...issuesToSave.map((entry: any) => {
                        const payload = {
                          issue: entry.issue.trim(),
                          issueAmount: Number(entry.issueAmount || 0),
                          issueStatus: entry.issueStatus || "pending",
                        };
                        return entry.id
                          ? api.put(
                              `/all-services/${editingIssueId}/issues/${entry.id}`,
                              payload,
                            )
                          : api.post(
                              `/all-services/${editingIssueId}/issues`,
                              payload,
                            );
                      }),
                    ];

                    // Parts sync - only if modified or length changed
                    const partsToSave = editingParts.filter((p: any) =>
                      p.partName?.trim(),
                    );
                    updatePromises.push(
                      api.post(`/all-services/${editingIssueId}/parts`, {
                        parts: partsToSave.map((p: any) => ({
                          ...p,
                          status: p.status || "approved",
                        })),
                      }),
                    );

                    // Sync primary issue description at top level
                    if (issuesToSave.length > 0) {
                      updatePromises.push(
                        api.put(`/all-services/${editingIssueId}/issue`, {
                          issue: issuesToSave[0].issue,
                          issueAmount: Number(issuesToSave[0].issueAmount || 0),
                        }),
                      );
                    }

                    await Promise.all(updatePromises);

                    Alert.alert("Registry Synchronized", "Operational manifest successfully updated.");
                    setIssueModalVisible(false);
                    loadData();
                  } catch (error) {
                    console.error("Sync Error:", error);
                    Alert.alert("Protocol Error", "Failed to synchronize operational manifest. Check uplink connection.");
                  } finally {
                    setSyncing(false);
                  }
                }}
                disabled={syncing}
                className="flex-[2] py-5 rounded-2xl bg-primary items-center justify-center shadow-xl shadow-primary/20"
              >
                {syncing ? (
                  <ActivityIndicator size="small" color={COLORS.background} />
                ) : (
                  <Text className="text-background font-black text-[10px] uppercase">
                    Sync
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* ────────────────────────────
          FILTER SELECT MODAL
      ──────────────────────────── */}
      <Modal
        visible={!!filterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModal(null)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-card rounded-t-[32px] p-6 pb-12 border-t border-slate-700">
            <View className="w-12 h-1 bg-slate-600 rounded-full self-center mb-6" />

            <Text className="text-white text-xl font-bold mb-6 px-2">
              Select {filterModal?.type === "status" ? "Status" : "Timeframe"}
            </Text>

            <View className="gap-2.5">
              {(filterModal?.type === "status"
                ? ["All", ...STATUS_STEPS]
                : ["All Time", "Today", "Yesterday", "This Week", "This Month"]
              ).map((option) => {
                const isSelected =
                  filterModal?.type === "status"
                    ? statusFilter === option
                    : dateFilter === option;

                return (
                  <TouchableOpacity
                    key={option}
                    onPress={() => {
                      if (filterModal?.type === "status") {
                        setStatusFilter(option);
                      } else {
                        setDateFilter(option);
                      }
                      setFilterModal(null);
                      setCurrentPage(1);
                    }}
                    className={`p-4.5 rounded-full py-3 px-3  flex-row justify-between items-center ${isSelected ? "bg-primary" : "bg-slate-900/40 border border-slate-700"}`}
                  >
                    <Text
                      className={`font-bold text-[13px] ${isSelected ? "text-background" : "text-text-secondary"}`}
                    >
                      {option}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={COLORS.background}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              onPress={() => setFilterModal(null)}
              className="mt-6 p-4.5 items-center underline"
            >
              <Text className="text-slate-500 font-bold">Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const FontAwesome5Wrapper = ({ name, size, color }: any) => {
  const mapping: any = {
    "user-slash": "person-remove",
    "user-check": "person-add",
    "clipboard-check": "clipboard",
    "check-circle": "checkmark-circle",
  };
  return <Ionicons name={mapping[name] || name} size={size} color={color} />;
};
