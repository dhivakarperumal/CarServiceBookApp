import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { apiService } from "../../services/api";
import { COLORS } from "../../theme/colors";

/* ─── CONSTANTS ─── */
const BOOKING_STATUS = [
  "Booked",
  "Call Verified",
  "Approved",
  "Cancelled",
];
const APPT_STATUS = [
  "Appointment Booked",
  "Confirmed",
  "In Progress",
  "Completed",
  "Cancelled",
];
const TIME_SLOTS = [
  "Morning (9AM–12PM)",
  "Afternoon (12PM–4PM)",
  "Evening (4PM–7PM)",
];

// Status color mapping using theme colors
const bookingStatusColors: any = {
  Approved: {
    bg: "bg-primary/10",
    text: "text-primary",
    border: "border-primary",
  },
  "Service Completed": {
    bg: "bg-success/10",
    text: "text-success",
    border: "border-success",
  },
  Cancelled: {
    bg: "bg-error/10",
    text: "text-error",
    border: "border-error",
  },
  "Call Verified": {
    bg: "bg-accent/10",
    text: "text-accent",
    border: "border-accent",
  },
  Booked: {
    bg: "bg-slate-900/50",
    text: "text-text-secondary",
    border: "border-slate-700",
  },
};

const apptStatusColors: any = {
  "Appointment Booked": {
    bg: "bg-primary/10",
    text: "text-primary",
    border: "border-primary",
  },
  Confirmed: {
    bg: "bg-success/10",
    text: "text-success",
    border: "border-success",
  },
  "In Progress": {
    bg: "bg-warning/10",
    text: "text-warning",
    border: "border-warning",
  },
  Completed: {
    bg: "bg-success/10",
    text: "text-success",
    border: "border-success",
  },
  Cancelled: {
    bg: "bg-error/10",
    text: "text-error",
    border: "border-error",
  },
};

/* ─── MAIN COMPONENT ─── */
export default function AdminBookings() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"booking" | "appointment">(
    "booking",
  );

  /* Bookings state */
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingLoading, setBookingLoading] = useState(true);
  const [bookingRefreshing, setBookingRefreshing] = useState(false);
  const [bookingSearch, setBookingSearch] = useState("");
  const [bookingStatusFilter, setBookingStatusFilter] = useState("All");
  const [bookingDateFilter, setBookingDateFilter] = useState("All Time");
  const [statusPopup, setStatusPopup] = useState<{
    booking: any;
    type: "status" | "approved" | "cancel";
  } | null>(null);
  const [trackNumber, setTrackNumber] = useState("");
  const [cancelReason, setCancelReason] = useState("");

  /* Appointments state */
  const [appointments, setAppointments] = useState<any[]>([]);
  const [apptLoading, setApptLoading] = useState(true);
  const [apptRefreshing, setApptRefreshing] = useState(false);
  const [apptSearch, setApptSearch] = useState("");
  const [apptStatusFilter, setApptStatusFilter] = useState("all");
  const [apptDateFilter, setApptDateFilter] = useState("All Time");
  const [assignFilter, setAssignFilter] = useState("all");
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [selectedAppt, setSelectedAppt] = useState<any | null>(null);
  const [pendingChanges, setPendingChanges] = useState<any>({});
  const [saving, setSaving] = useState(false);

  /* Filter UI State */
  const [filterModal, setFilterModal] = useState<{
    type: "status" | "date";
    tab: "booking" | "appointment";
  } | null>(null);

  /* ─── DATA FETCHING ─── */
  const fetchBookings = async () => {
    try {
      const data = await apiService.getBookings();
      setBookings(
        (data || []).sort(
          (a: any, b: any) =>
            new Date(b.created_at || b.createdAt || 0).getTime() -
            new Date(a.created_at || a.createdAt || 0).getTime(),
        ),
      );
    } catch {
      Alert.alert("Error", "Failed to load bookings");
    } finally {
      setBookingLoading(false);
      setBookingRefreshing(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      const [list, staffData] = await Promise.all([
        apiService.getAppointments(),
        apiService.getStaff(),
      ]);
      setAppointments(
        [...list].sort(
          (a: any, b: any) =>
            new Date(b.created_at || b.createdAt || 0).getTime() -
            new Date(a.created_at || a.createdAt || 0).getTime(),
        ),
      );
      setTechnicians(
        (staffData || []).filter((s: any) =>
          [
            "mechanic",
            "technician",
            "employee",
            "technicians",
            "mechanics",
          ].includes(s.role?.toLowerCase()),
        ),
      );
    } catch (err: any) {
      console.error(
        "fetchAppointments error:",
        err?.response?.status,
        err?.message,
      );
    } finally {
      setApptLoading(false);
      setApptRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchAppointments();
  }, []);

  /* ─── BOOKINGS LOGIC ─── */
  const filterByDate = (dateStr: string, filter: string) => {
    if (filter === "All Time" || !dateStr) return true;
    const date = new Date(dateStr);
    const now = new Date();
    const startOfDay = (d: Date) =>
      new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

    if (filter === "Today") {
      return startOfDay(date) === startOfDay(now);
    }
    if (filter === "Yesterday") {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      return startOfDay(date) === startOfDay(yesterday);
    }
    if (filter === "This Week") {
      const dayOfWeek = now.getDay();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - dayOfWeek);
      weekStart.setHours(0, 0, 0, 0);
      return date >= weekStart && date <= now;
    }
    if (filter === "This Month") {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return date >= monthStart && date <= now;
    }
    return true;
  };

  const filteredBookings = useMemo(
    () =>
      bookings.filter((b) => {
        const matchSearch =
          (b.bookingId || "")
            .toLowerCase()
            .includes(bookingSearch.toLowerCase()) ||
          (b.name || "").toLowerCase().includes(bookingSearch.toLowerCase()) ||
          (b.phone || "").includes(bookingSearch);

        const bStatus = (b.status || "").toLowerCase();
        const matchStatus =
          bookingStatusFilter === "All"
            ? !["cancelled", "bill completed"].includes(bStatus)
            : b.status === bookingStatusFilter;

        const matchDate = filterByDate(
          b.created_at || b.createdAt,
          bookingDateFilter,
        );
        return matchSearch && matchStatus && matchDate;
      }),
    [bookings, bookingSearch, bookingStatusFilter, bookingDateFilter],
  );

  const updateBookingStatus = async (
    booking: any,
    newStatus: string,
    extra = {},
  ) => {
    try {
      const targetId = booking.id || booking._id;
      await apiService.api.put(`/bookings/status/${targetId}`, {
        status: newStatus,
        ...extra,
      });
      setBookings((prev) =>
        prev.map((b) =>
          b.id === targetId || b._id === targetId
            ? { ...b, status: newStatus, ...extra }
            : b,
        ),
      );
      Alert.alert("Updated", `Status → ${newStatus}`);
    } catch {
      Alert.alert("Error", "Failed to update");
    } finally {
      setStatusPopup(null);
      setTrackNumber("");
      setCancelReason("");
    }
  };

  const handleBookingStatusChange = (booking: any, s: string) => {
    if (booking.status === "Service Completed") return;
    if (s === "Approved") {
      updateBookingStatus(booking, "Approved");
      return;
    }
    if (s === "Cancelled") {
      setStatusPopup({ type: "cancel", booking });
      return;
    }
    updateBookingStatus(booking, s);
  };

  /* ─── APPOINTMENTS LOGIC ─── */
  const filteredAppts = useMemo(
    () =>
      appointments.filter((a) => {
        const search = apptSearch.toLowerCase();
        const matchSearch =
          !apptSearch ||
          (a.appointmentId || "").toLowerCase().includes(search) ||
          (a.id || "").toString().includes(search) ||
          (a._id || "").toString().includes(search) ||
          (a.name || "").toLowerCase().includes(search) ||
          (a.phone || "").includes(search) ||
          (a.brand || "").toLowerCase().includes(search) ||
          (a.model || "").toLowerCase().includes(search) ||
          (a.registrationNumber || a.vehicleNumber || "")
            .toLowerCase()
            .includes(search);

        const aStatus = (
          a.status ||
          a.serviceStatus ||
          a.appointmentStatus ||
          ""
        ).toLowerCase();
        const matchStatus =
          apptStatusFilter === "all"
            ? !["cancelled", "bill completed"].includes(aStatus)
            : aStatus.includes(apptStatusFilter.toLowerCase());

        const matchAssign =
          assignFilter === "all" ||
          (assignFilter === "assigned"
            ? !!(a.assignedEmployeeId || a.assignedEmployeeName)
            : !(a.assignedEmployeeId || a.assignedEmployeeName));

        const matchDate = filterByDate(
          a.preferredDate || a.created_at || a.createdAt,
          apptDateFilter,
        );

        return matchSearch && matchStatus && matchAssign && matchDate;
      }),
    [appointments, apptSearch, apptStatusFilter, assignFilter, apptDateFilter],
  );

  const openApptModal = (apt: any) => {
    setSelectedAppt(apt);
    setPendingChanges({});
  };

  const handleSaveChanges = async () => {
    if (!selectedAppt || Object.keys(pendingChanges).length === 0) return;
    setSaving(true);
    try {
      const targetId = selectedAppt.id || selectedAppt._id;
      await apiService.api.put(`/appointments/${targetId}`, pendingChanges);
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === targetId || a._id === targetId
            ? { ...a, ...pendingChanges }
            : a,
        ),
      );
      Alert.alert("Success", "Appointment updated successfully");
      setSelectedAppt(null);
      setPendingChanges({});
    } catch {
      Alert.alert("Error", "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const currentStatus = pendingChanges.status ?? selectedAppt?.status;
  const canAssign = ["Appointment Booked", "Confirmed", "In Progress"].includes(
    currentStatus,
  );

  /* ─── LOADING ─── */
  if (bookingLoading && apptLoading) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* ── HEADER ── */}
      <View>


        {/* TABS */}
        <View className="px-6 mt-5 pb-4 flex-row gap-3">
          {(["booking", "appointment"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`flex-1 py-3.5 rounded-2xl items-center flex-row justify-center gap-2 border ${activeTab === tab ? "bg-primary border-primary" : "bg-white/5 border-slate-700"}`}
            >
              <Ionicons
                name={tab === "booking" ? "calendar-outline" : "time-outline"}
                size={14}
                color={activeTab === tab ? "black" : "rgba(255,255,255,0.3)"}
              />
              <Text
                className={`font-black text-[10px] uppercase tracking-widest ${activeTab === tab ? "text-background" : "text-slate-500"}`}
              >
                {tab === "booking"
                  ? `Bookings (${bookings.length})`
                  : `Appointments (${appointments.length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* SEARCH */}
        <View className="px-6 pb-4 flex-row gap-3">
          <View className="flex-1 bg-slate-900/30 rounded-2xl flex-row items-center px-4 h-14 border border-slate-700">
            <Ionicons name="search" size={16} color={COLORS.slate600} />
            <TextInput
              placeholder={
                activeTab === "booking"
                  ? "Search booking ID, name..."
                  : "Search APT ID, name..."
              }
              placeholderTextColor={COLORS.textMuted}
              value={activeTab === "booking" ? bookingSearch : apptSearch}
              onChangeText={
                activeTab === "booking" ? setBookingSearch : setApptSearch
              }
              className="flex-1 ml-3 text-white font-semibold text-xs"
            />
          </View>
          {activeTab === "appointment" && (
            <TouchableOpacity
              onPress={() =>
                setAssignFilter((prev) =>
                  prev === "all"
                    ? "unassigned"
                    : prev === "unassigned"
                      ? "assigned"
                      : "all",
                )
              }
              style={{
                borderColor:
                  assignFilter !== "all" ? COLORS.primary : "transparent",
              }}
              className={`w-[52px] h-[52px] rounded-2xl items-center justify-center border ${assignFilter !== "all" ? "bg-primary/10" : "bg-slate-900/30"}`}
            >
              <Ionicons
                name="people-outline"
                size={20}
                color={
                  assignFilter !== "all" ? COLORS.primary : COLORS.slate600
                }
              />
            </TouchableOpacity>
          )}
        </View>

        {/* SELECT OPTIONS (FILTERS) */}
        <View className="px-6 pb-6 flex-row gap-3">
          {/* Status Select */}
          <TouchableOpacity
            onPress={() => setFilterModal({ type: "status", tab: activeTab })}
            className="flex-1 bg-slate-900/30 border border-slate-700 rounded-2xl px-4 h-14 flex-row justify-between items-center"
          >
            <View>
              <Text className="text-slate-500 text-[8px] font-black uppercase tracking-widest">
                Status
              </Text>
              <Text
                className="text-white text-[11px] font-bold uppercase truncate"
                numberOfLines={1}
              >
                {activeTab === "booking"
                  ? bookingStatusFilter
                  : apptStatusFilter === "all"
                    ? "All Status"
                    : apptStatusFilter}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={14} color={COLORS.primary} />
          </TouchableOpacity>

          {/* Date Select */}
          <TouchableOpacity
            onPress={() => setFilterModal({ type: "date", tab: activeTab })}
            className="flex-1 bg-slate-900/30 border border-slate-700 rounded-2xl px-4 h-14 flex-row justify-between items-center"
          >
            <View>
              <Text className="text-slate-500 text-[8px] font-black uppercase tracking-widest">
                Timeframe
              </Text>
              <Text className="text-white text-[11px] font-bold uppercase">
                {activeTab === "booking" ? bookingDateFilter : apptDateFilter}
              </Text>
            </View>
            <Ionicons name="calendar-outline" size={14} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── BOOKINGS TAB ── */}
      {activeTab === "booking" && (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={bookingRefreshing}
              onRefresh={() => {
                setBookingRefreshing(true);
                fetchBookings();
              }}
              tintColor={COLORS.primary}
            />
          }
        >
          {filteredBookings.length === 0 ? (
            <View className="py-20 items-center bg-slate-900/40 rounded-[32px] border border-dashed border-slate-700">
              <MaterialCommunityIcons
                name="calendar-blank"
                size={48}
                color={COLORS.textMuted}
              />
              <Text className="text-slate-500 font-black text-[10px] uppercase mt-4 tracking-[2px]">
                No bookings found
              </Text>
            </View>
          ) : (
            filteredBookings.map((b) => {
              const sc =
                bookingStatusColors[b.status] || bookingStatusColors["Booked"];
              return (
                <View
                  key={b.id}
                  className="mb-4 bg-card rounded-[28px] border border-slate-700 overflow-hidden"
                >
                  <View className="p-5">
                    <View className="flex-row justify-between items-start mb-4">
                      <View>
                        <Text className="text-white/20 text-[9px] font-black uppercase tracking-[2px]">
                          {b.bookingId || `#${b.id}`}
                        </Text>
                        <Text className="text-white text-[17px] font-black mt-0.5 uppercase tracking-tight">
                          {b.name || "Customer"}
                        </Text>
                      </View>
                      <View
                        className={`px-3 py-1.5 rounded-full border ${sc.bg} ${sc.border}`}
                      >
                        <Text
                          className={`text-[8px] font-black uppercase tracking-widest ${sc.text}`}
                        >
                          {b.status}
                        </Text>
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
                          {b.brand} {b.model}
                        </Text>
                      </View>
                      <View className="bg-slate-900/40 px-2.5 py-1.5 rounded-xl flex-row items-center gap-1.5">
                        <Ionicons
                          name="call-outline"
                          size={12}
                          color={COLORS.primary}
                        />
                        <Text className="text-text-secondary text-[10px] font-bold">
                          {b.phone}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View className="flex-row justify-between items-center px-5 py-3.5 bg-slate-900/40 border-t border-slate-700">
                    <View className="flex-row items-center gap-1.5">
                      <Ionicons
                        name="time-outline"
                        size={13}
                        color={COLORS.textMuted}
                      />
                      <Text className="text-text-secondary text-[9px] font-black uppercase">
                        {new Date(
                          b.created_at || b.createdAt,
                        ).toLocaleDateString("en-GB")}
                      </Text>
                    </View>
                    {b.status !== "Approved" && (
                      <TouchableOpacity
                        onPress={() =>
                          setStatusPopup({ type: "status", booking: b })
                        }
                        className="bg-primary px-4 py-2.5 rounded-xl"
                      >
                        <Text className="text-background text-[9px] font-black uppercase tracking-widest">
                          Update Status
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* ── APPOINTMENTS TAB ── */}
      {activeTab === "appointment" && (
        <ScrollView
          className="flex-1 "
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={apptRefreshing}
              onRefresh={() => {
                setApptRefreshing(true);
                fetchAppointments();
              }}
              tintColor={COLORS.primary}
            />
          }
        >
          {filteredAppts.length === 0 ? (
            <View className="py-20 items-center bg-slate-900/40  rounded-[32px] border border-dashed border-slate-700">
              <MaterialCommunityIcons
                name="calendar-clock"
                size={48}
                color={COLORS.textMuted}
              />
              <Text className="text-slate-500 font-black text-[10px] uppercase mt-4 tracking-[2px]">
                No appointments found
              </Text>
            </View>
          ) : (
            filteredAppts.map((apt) => {
              const sc =
                apptStatusColors[
                apt.status ||
                apt.serviceStatus ||
                apt.appointmentStatus ||
                "Appointment Booked"
                ] || apptStatusColors["Appointment Booked"];
              const isAssigned = !!(
                apt.assignedEmployeeName || apt.assignedEmployeeId
              );
              return (
                <View
                  key={apt.id || apt._id}
                  className="mb-4 bg-card rounded-[28px] border border-slate-700 overflow-hidden"
                >
                  <View className="p-5">
                    {/* Row 1: ID + Status */}
                    <View className="flex-row justify-between items-start mb-3.5">
                      <View>
                        <Text className="text-white/50 text-[10px] font-black uppercase tracking-widest">
                          {apt.appointmentId || `APT-${apt.id}`}
                        </Text>
                        <Text className="text-white text-[17px] font-black mt-0.5 uppercase tracking-tight">
                          {apt.name}
                        </Text>
                        <Text className="text-slate-500 text-[10px] font-bold mt-0.5">
                          {apt.phone}
                        </Text>
                      </View>
                      <View className="items-end gap-1.5">
                        <View
                          className={`px-2.5 py-1 rounded-full border ${sc.bg} ${sc.border}`}
                        >
                          <Text
                            className={`text-[7px] font-black uppercase tracking-widest ${sc.text}`}
                          >
                            {apt.status ||
                              apt.serviceStatus ||
                              apt.appointmentStatus ||
                              "Appointment Booked"}
                          </Text>
                        </View>
                        {apt.emergencyService && (
                          <View className="bg-rose-950 px-2 py-1 rounded-lg border border-rose-900">
                            <Text className="text-rose-500 text-[7px] font-black uppercase">
                              URGENT
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Row 2: Vehicle + Reg */}
                    <View className="bg-slate-900/40 rounded-2xl p-3.5 mb-3 flex-row justify-between items-center border border-slate-700">
                      <View className="flex-row items-center gap-2.5">
                        <Ionicons
                          name="car-outline"
                          size={16}
                          color={COLORS.primary}
                        />
                        <View>
                          <Text className="text-text-primary text-xs font-bold uppercase">
                            {apt.brand} {apt.model}
                          </Text>
                          <Text className="text-text-secondary text-[9px] font-bold uppercase tracking-widest">
                            {apt.registrationNumber ||
                              apt.vehicleNumber ||
                              "NO REG"}
                          </Text>
                        </View>
                      </View>
                      <View className="bg-primary/20 px-2.5 py-1.5 rounded-xl border border-primary/40">
                        <Text className="text-primary text-[10px] font-black">
                          {apt.serviceType}
                        </Text>
                      </View>
                    </View>

                    {/* Row 3: Schedule */}
                    <View className="flex-row gap-2.5 mb-3">
                      <View className="flex-1 flex-row items-center gap-1.5">
                        <Ionicons
                          name="calendar-outline"
                          size={13}
                          color={COLORS.textMuted}
                        />
                        <Text className="text-slate-500 text-[10px] font-bold">
                          {apt.preferredDate
                            ? new Date(apt.preferredDate).toLocaleDateString(
                              "en-GB",
                            )
                            : "N/A"}
                        </Text>
                      </View>
                      <View className="flex-1 flex-row items-center gap-1.5">
                        <Ionicons
                          name="time-outline"
                          size={13}
                          color={COLORS.textMuted}
                        />
                        <Text
                          className="text-slate-500 text-[10px] font-bold"
                          numberOfLines={1}
                        >
                          {apt.preferredTimeSlot || "N/A"}
                        </Text>
                      </View>
                    </View>

                    {/* Row 4: Mechanic Assignment */}
                    <View className="flex-row items-center gap-2">
                      <View
                        className={`w-7 h-7 rounded-full items-center justify-center border ${isAssigned ? "bg-primary/20 border-primary/40" : "bg-slate-900/40 border-slate-700"}`}
                      >
                        <Ionicons
                          name={
                            isAssigned ? "person-outline" : "person-add-outline"
                          }
                          size={13}
                          color={isAssigned ? COLORS.primary : COLORS.textMuted}
                        />
                      </View>
                      <Text
                        className={`text-[11px] ${isAssigned ? "text-text-secondary font-bold" : "text-text-secondary font-semibold italic"}`}
                      >
                        {isAssigned ? apt.assignedEmployeeName : "Unassigned"}
                      </Text>
                    </View>
                  </View>

                  {/* Footer Actions */}
                  <View className="flex-row px-5 py-3.5 bg-slate-900/40 border-t border-slate-700 gap-2.5">
                    <TouchableOpacity
                      onPress={() => openApptModal(apt)}
                      style={{ backgroundColor: COLORS.primary }}
                      className="flex-1 py-3 rounded-xl items-center"
                    >
                      <Text className="text-background text-[9px] font-black uppercase tracking-widest">
                        Manage / Assign
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* ────────────────────────────
          BOOKING STATUS MODAL
      ──────────────────────────── */}
      <Modal
        visible={!!statusPopup}
        transparent
        animationType="slide"
        onRequestClose={() => setStatusPopup(null)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-card rounded-t-[40px] p-8 pb-12 border-t border-slate-700">
            <View className="w-12 h-1.5 bg-slate-600 rounded-full self-center mb-8" />

            {statusPopup?.type === "status" && (
              <>
                <Text className="text-text-primary text-xl font-black uppercase text-center mb-6">
                  Update Status
                </Text>
                <View className="gap-2.5">
                  {BOOKING_STATUS.map((s) => (
                    <TouchableOpacity
                      key={s}
                      onPress={() =>
                        handleBookingStatusChange(statusPopup.booking, s)
                      }
                      className={`p-4 rounded-2xl flex-row justify-between items-center border ${statusPopup.booking.status === s ? "bg-primary border-primary" : "bg-slate-900/40 border-slate-700"}`}
                    >
                      <Text
                        className={`font-black text-[11px] uppercase tracking-widest ${statusPopup.booking.status === s ? "text-background" : "text-text-secondary"}`}
                      >
                        {s}
                      </Text>
                      {statusPopup.booking.status === s && (
                        <Ionicons
                          name="checkmark-circle"
                          size={22}
                          color={COLORS.background}
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {statusPopup?.type === "approved" && (
              <>
                <Text className="text-text-primary text-xl font-black uppercase text-center mb-2">
                  Authorize Booking
                </Text>
                <Text className="text-text-secondary text-[9px] uppercase tracking-[2px] text-center mb-6">
                  Enter a tracking reference
                </Text>
                <View className="bg-slate-900/40 rounded-2xl border border-slate-700 mb-4 h-[72px]">
                  <TextInput
                    placeholder="TRACK NUMBER"
                    placeholderTextColor={COLORS.textMuted}
                    value={trackNumber}
                    onChangeText={setTrackNumber}
                    className="flex-1 px-5 color-white font-black text-base text-center uppercase"
                  />
                </View>
                <TouchableOpacity
                  onPress={() =>
                    updateBookingStatus(statusPopup!.booking, "Approved", {
                      trackNumber,
                    })
                  }
                  className="bg-primary p-5 rounded-2xl items-center"
                >
                  <Text className="text-background font-black uppercase tracking-widest text-[11px]">
                    Confirm Approval
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {statusPopup?.type === "cancel" && (
              <>
                <Text className="text-text-primary text-xl font-black uppercase text-center mb-2">
                  Cancel Booking
                </Text>
                <Text className="text-error text-[9px] font-black uppercase tracking-widest text-center mb-6">
                  Reason Required
                </Text>
                <View className="bg-slate-900/40 rounded-2xl border border-slate-700 mb-4 min-h-[100px]">
                  <TextInput
                    placeholder="DETAILED REASON"
                    placeholderTextColor={COLORS.textMuted}
                    value={cancelReason}
                    onChangeText={setCancelReason}
                    multiline
                    numberOfLines={4}
                    className="flex-1 p-5 text-text-primary font-semibold text-xs leading-relaxed"
                    style={{ textAlignVertical: "top" }}
                  />
                </View>
                <TouchableOpacity
                  onPress={() =>
                    updateBookingStatus(statusPopup!.booking, "Cancelled", {
                      cancelReason,
                    })
                  }
                  className="bg-error p-5 rounded-2xl items-center"
                >
                  <Text className="text-text-primary font-black uppercase tracking-widest text-[11px]">
                    Confirm Cancellation
                  </Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              onPress={() => {
                setStatusPopup(null);
                setTrackNumber("");
                setCancelReason("");
              }}
              className="mt-6 py-3.5 px-5 bg-error rounded-2xl items-center border border-error"
            >
              <Text className="text-text-primary font-black text-[11px] uppercase tracking-widest">
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ────────────────────────────
          APPOINTMENT MANAGE/ASSIGN MODAL
      ──────────────────────────── */}
      <Modal
        visible={!!selectedAppt}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setSelectedAppt(null);
          setPendingChanges({});
        }}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-card rounded-t-[40px] border-t border-slate-700 h-[92%] w-full">
            {/* Modal Header */}
            <View className="flex-row justify-between items-center px-7 pt-7 pb-5 border-b border-slate-700">
              <View className="flex-row items-center gap-3.5">
                <View className="w-11 h-11 rounded-2xl bg-sky-500/15 items-center justify-center border border-sky-500/20">
                  <Ionicons
                    name="construct-outline"
                    size={20}
                    color={COLORS.primary}
                  />
                </View>
                <View>
                  <Text className="text-white text-base font-black uppercase tracking-tight">
                    Appointment
                  </Text>
                  <Text className="text-white/50 text-[10px] font-black uppercase tracking-widest mt-0.5">
                    {selectedAppt?.appointmentId || `APT-${selectedAppt?.id}`}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setSelectedAppt(null);
                  setPendingChanges({});
                }}
                className="w-9 h-9 rounded-full bg-primary/20 items-center justify-center border border-primary/40"
              >
                <Ionicons name="close" size={18} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              className="flex-1"
              contentContainerStyle={{ padding: 28, paddingBottom: 24 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Customer Info */}
              <Text className="text-text-secondary text-[9px] font-black uppercase tracking-[2px] mb-3">
                Customer Info
              </Text>
              <View className="bg-slate-900/40 rounded-2xl p-4 mb-6 gap-3 border border-slate-700">
                <View className="flex-row items-center gap-3">
                  <View className="w-8 h-8 rounded-full bg-slate-900/60 items-center justify-center">
                    <Ionicons
                      name="person-outline"
                      size={14}
                      color={COLORS.textMuted}
                    />
                  </View>
                  <Text className="text-text-primary text-sm font-bold">
                    {selectedAppt?.name}
                  </Text>
                </View>
                <View className="flex-row items-center gap-3">
                  <View className="w-8 h-8 rounded-full bg-slate-900/60 items-center justify-center">
                    <Ionicons
                      name="call-outline"
                      size={14}
                      color={COLORS.primary}
                    />
                  </View>
                  <Text className="text-text-secondary text-[13px] font-semibold">
                    {selectedAppt?.phone}
                  </Text>
                </View>
                {selectedAppt?.address && (
                  <View className="flex-row items-start gap-3">
                    <View className="w-8 h-8 rounded-full bg-slate-900/60 items-center justify-center mt-0.5">
                      <Ionicons
                        name="location-outline"
                        size={14}
                        color={COLORS.success}
                      />
                    </View>
                    <Text className="text-text-secondary text-xs flex-1 leading-5">
                      {selectedAppt?.address}, {selectedAppt?.city}{" "}
                      {selectedAppt?.pincode}
                    </Text>
                  </View>
                )}
              </View>

              {/* Vehicle Details */}
              <Text className="text-text-secondary text-[9px] font-black uppercase tracking-[2px] mb-3">
                Vehicle Details
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-6">
                {[
                  { l: "Type", v: selectedAppt?.vehicleType },
                  { l: "Brand", v: selectedAppt?.brand },
                  { l: "Model", v: selectedAppt?.model },
                  { l: "Reg. No", v: selectedAppt?.registrationNumber },
                  { l: "Fuel", v: selectedAppt?.fuelType },
                  { l: "Year", v: selectedAppt?.yearOfManufacture },
                ].map((item) => (
                  <View
                    key={item.l}
                    className="w-[48%] bg-slate-900/40 p-3.5 rounded-2xl border border-slate-700"
                  >
                    <Text className="text-text-secondary text-[8px] font-black uppercase tracking-widest mb-1">
                      {item.l}
                    </Text>
                    <Text className="text-text-primary text-[13px] font-bold">
                      {item.v || "N/A"}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Status Update */}
              <Text className="text-text-secondary text-[9px] font-black uppercase tracking-widest mb-3">
                Service Management
              </Text>
              <View className="bg-slate-900/40 rounded-[20px] p-5 border border-slate-700 mb-4">
                <Text className="text-text-muted text-[9px] font-black uppercase tracking-widest mb-2.5">
                  Current Status
                </Text>
                <View className="gap-2">
                  {APPT_STATUS.map((s) => {
                    const active = currentStatus === s;
                    return (
                      <TouchableOpacity
                        key={s}
                        onPress={() => {
                          const update: any = { status: s };
                          if (s === "Cancelled") {
                            update.assignedEmployeeId = null;
                            update.assignedEmployeeName = null;
                          }
                          setPendingChanges((prev: any) => ({
                            ...prev,
                            ...update,
                          }));
                        }}
                        className={`flex-row justify-between items-center p-3.5 rounded-2xl border ${active ? "bg-primary" : "bg-slate-900/40"} ${active ? "border-primary" : "border-slate-700"}`}
                      >
                        <Text
                          className={`font-black text-[10px] uppercase tracking-widest ${active ? "text-background" : "text-text-secondary"}`}
                        >
                          {s}
                        </Text>
                        {active && (
                          <Ionicons
                            name="checkmark-circle"
                            size={18}
                            color={COLORS.primary}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Assign Technician */}
              <View
                className={`bg-slate-900/40 rounded-[20px] p-5 border mb-4 ${canAssign ? "border-primary/40" : "border-slate-700"}`}
              >
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="text-text-secondary text-[9px] font-black uppercase tracking-widest">
                    Assign Technician
                  </Text>
                  {!canAssign && (
                    <View className="bg-warning/20 px-2 py-1 rounded-lg border border-warning/40">
                      <Text className="text-warning text-[7px] font-black uppercase tracking-widest">
                        Invalid status for assignment
                      </Text>
                    </View>
                  )}
                </View>
                <View
                  className={`gap-2 ${canAssign ? "opacity-100" : "opacity-40"}`}
                >
                  {/* Unassigned option */}
                  <TouchableOpacity
                    disabled={!canAssign}
                    onPress={() =>
                      setPendingChanges((prev: any) => ({
                        ...prev,
                        assignedEmployeeId: null,
                        assignedEmployeeName: null,
                      }))
                    }
                    className={`flex-row justify-between items-center p-3.5 rounded-2xl border ${!(pendingChanges.assignedEmployeeId ?? (selectedAppt?.assignedEmployeeId || selectedAppt?.assignedEmployee?._id)) ? "bg-primary/20 border-primary/40" : "bg-slate-900/40 border-slate-700"}`}
                  >
                    <Text className="text-text-secondary font-bold text-[11px] italic">
                      Unassigned
                    </Text>
                    {!(
                      pendingChanges.assignedEmployeeId ??
                      (selectedAppt?.assignedEmployeeId ||
                        selectedAppt?.assignedEmployee?._id)
                    ) && (
                        <Ionicons
                          name="checkmark-circle"
                          size={16}
                          color={COLORS.primary}
                        />
                      )}
                  </TouchableOpacity>
                  {technicians.map((t: any) => {
                    const tId = t.id || t._id;
                    const selected =
                      (pendingChanges.assignedEmployeeId ??
                        (selectedAppt?.assignedEmployeeId ||
                          selectedAppt?.assignedEmployee?._id)) === tId;
                    return (
                      <TouchableOpacity
                        key={tId}
                        disabled={!canAssign}
                        onPress={() =>
                          setPendingChanges((prev: any) => ({
                            ...prev,
                            assignedEmployeeId: tId,
                            assignedEmployeeName: t.name,
                          }))
                        }
                        className={`flex-row justify-between items-center p-3.5 rounded-2xl border ${selected ? "bg-primary/20 border-primary/40" : "bg-slate-900/40 border-slate-700"}`}
                      >
                        <View className="flex-row items-center gap-2.5">
                          <View className="w-7 h-7 rounded-full bg-primary/20 items-center justify-center">
                            <Text className="text-primary text-[11px] font-black">
                              {t.name?.charAt(0)?.toUpperCase()}
                            </Text>
                          </View>
                          <Text
                            className={`font-bold text-xs uppercase ${selected ? "text-primary" : "text-text-secondary"}`}
                          >
                            {t.name}
                          </Text>
                        </View>
                        {selected && (
                          <Ionicons
                            name="checkmark-circle"
                            size={18}
                            color={COLORS.primary}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Time Slot */}
              <View className="bg-slate-900/40 rounded-[20px] p-5 border border-slate-700 mb-4">
                <Text className="text-text-secondary text-[9px] font-black uppercase tracking-widest mb-3">
                  Time Slot
                </Text>
                <View className="gap-2">
                  {TIME_SLOTS.map((slot) => {
                    const active =
                      (pendingChanges.preferredTimeSlot ??
                        selectedAppt?.preferredTimeSlot) === slot;
                    return (
                      <TouchableOpacity
                        key={slot}
                        onPress={() =>
                          setPendingChanges((prev: any) => ({
                            ...prev,
                            preferredTimeSlot: slot,
                          }))
                        }
                        className={`flex-row justify-between items-center p-3.5 rounded-2xl border ${active ? "bg-primary" : "bg-slate-900/40"} ${active ? "border-primary" : "border-slate-700"}`}
                      >
                        <Text
                          className={`font-black text-[11px] uppercase tracking-widest ${active ? "text-background" : "text-text-secondary"}`}
                        >
                          {slot}
                        </Text>
                        {active && (
                          <Ionicons
                            name="checkmark-circle"
                            size={18}
                            color={COLORS.primary}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Issue Description */}
              {selectedAppt?.otherIssue && (
                <View className="bg-warning/10 rounded-[20px] p-5 border border-warning/20 mb-4">
                  <Text className="text-warning text-[9px] font-black uppercase tracking-widest mb-2">
                    Customer Problem
                  </Text>
                  <Text className="text-warning text-[13px] italic leading-5">
                    "{selectedAppt.otherIssue}"
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Footer Actions */}
            <View className="flex-row px-7 py-6 border-t border-slate-700 gap-3">
              <TouchableOpacity
                onPress={() => {
                  setSelectedAppt(null);
                  setPendingChanges({});
                }}
                className="flex-1 py-4 rounded-2xl items-center bg-error border border-slate-700"
              >
                <Text className="text-text-primary font-black text-[11px] uppercase tracking-widest">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveChanges}
                disabled={saving || Object.keys(pendingChanges).length === 0}
                className={`flex-1 py-4 rounded-2xl items-center border ${Object.keys(pendingChanges).length === 0 ? "bg-slate-900/40 border-slate-700" : "bg-primary border-primary"} ${saving ? "opacity-60" : "opacity-100"}`}
              >
                {saving ? (
                  <ActivityIndicator
                    size="small"
                    color={
                      Object.keys(pendingChanges).length === 0
                        ? COLORS.textMuted
                        : COLORS.background
                    }
                    className="py-0.5"
                  />
                ) : (
                  <Text
                    className={`font-black text-[11px] uppercase tracking-widest ${Object.keys(pendingChanges).length === 0 ? "text-text-secondary" : "text-background"}`}
                  >
                    Save Changes
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── FLOATING ACTION BUTTON ── */}
      <TouchableOpacity
        onPress={() =>
          router.push(
            activeTab === "appointment"
              ? ("/(adminPages)/add-appointment" as any)
              : ("/(adminPages)/add-booking" as any),
          )
        }
        activeOpacity={0.85}
        className="absolute bottom-5 right-5 w-14 h-14 rounded-full bg-primary items-center justify-center shadow-lg shadow-primary/40 border border-white/15"
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>

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
                ? filterModal.tab === "booking"
                  ? ["All", ...BOOKING_STATUS]
                  : ["all", ...APPT_STATUS]
                : ["All Time", "Today", "Yesterday", "This Week", "This Month"]
              ).map((option) => {
                const isSelected =
                  filterModal?.type === "status"
                    ? filterModal.tab === "booking"
                      ? bookingStatusFilter === option
                      : apptStatusFilter === option
                    : filterModal?.tab === "booking"
                      ? bookingDateFilter === option
                      : apptDateFilter === option;

                return (
                  <TouchableOpacity
                    key={option}
                    onPress={() => {
                      if (filterModal?.type === "status") {
                        if (filterModal.tab === "booking")
                          setBookingStatusFilter(option);
                        else setApptStatusFilter(option);
                      } else {
                        if (filterModal.tab === "booking")
                          setBookingDateFilter(option);
                        else setApptDateFilter(option);
                      }
                      setFilterModal(null);
                    }}
                    className={`p-4.5 rounded-full  flex-row justify-between items-center ${isSelected ? "bg-primary" : "bg-slate-900/40 border border-slate-700"}`}
                  >
                    <Text
                      className={`font-bold p-4 text-[13px] ${isSelected ? "text-background " : "text-text-secondary"}`}
                    >
                      {option === "all" ? "All Status" : option}
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
