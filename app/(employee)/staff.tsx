import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../services/api";

export default function EmployeeDashboard() {
  const router = useRouter();
  const { user: userProfile, logout } = useAuth();
  const [stats, setStats] = useState({
    todayCount: 0,
    totalCount: 0,
    inProgress: 0,
    completed: 0,
  });
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [isPunchingIn, setIsPunchingIn] = useState(false);
  const [myStaffRecord, setMyStaffRecord] = useState<any>(null);

  useEffect(() => {
    fetchMyTasks();
  }, [userProfile?.id, userProfile?.uid]);

  useEffect(() => {
    if (userProfile?.email) {
      checkAttendanceStatus();
    }
  }, [userProfile?.email]);

  const checkAttendanceStatus = async () => {
    if (!userProfile?.email) return;

    try {
      const staffRes = await api.get("/staff");
      const me = (staffRes.data || []).find(
        (s: any) =>
          s.email?.toLowerCase() === userProfile?.email?.toLowerCase(),
      );

      if (me) {
        setMyStaffRecord(me);
        const today = new Date().toLocaleDateString("en-CA");
        const attendRes = await api.get(
          `/attendance/check?staff_id=${me.id}&date=${today}`,
        );

        const role = userProfile?.role?.toLowerCase();
        const needsAttendance = [
          "mechanic",
          "employee",
          "staff",
          "receptionist",
          "manager",
        ].includes(role);

        if (!attendRes.data.isPresent && needsAttendance) {
          setShowAttendanceModal(true);
        }
      }
    } catch (err) {
      console.error("Attendance check failed", err);
    }
  };

  const handlePunchIn = async () => {
    if (!myStaffRecord) {
      Alert.alert("Error", "Staff record not found. Please contact admin.");
      return;
    }

    setIsPunchingIn(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Please allow location access to mark attendance",
        );
        setIsPunchingIn(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      const today = new Date().toLocaleDateString("en-CA");

      await api.post("/attendance/punch-in", {
        staff_id: myStaffRecord.id,
        date: today,
        latitude,
        longitude,
        status: "Present",
      });

      Alert.alert("Success", "Attendance marked successfully!");
      setShowAttendanceModal(false);
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "Punch in failed");
    } finally {
      setIsPunchingIn(false);
    }
  };

  const fetchMyTasks = async () => {
    try {
      setLoading(true);
      const todayStr = new Date().toDateString();
      // 🔥 Fetching from all-services to pick up both bookings and appointments
      const res = await api.get("/all-services");
      const allServices = res.data || [];

      const myDisplayName =
        userProfile?.username ||
        (userProfile as any)?.displayName ||
        (userProfile as any)?.name ||
        "";
      const filtered = allServices.filter(
        (b: any) =>
          (b.assignedEmployeeName || "").toLowerCase() ===
            myDisplayName.toLowerCase() && b.status !== "Cancelled",
      );

      const tasksForToday = filtered.filter((b: any) => {
        const dStr = b.created_at || b.createdAt || b.preferredDate;
        return dStr && new Date(dStr).toDateString() === todayStr;
      });

      setMyTasks(tasksForToday);

      const normalize = (s: any) => (s || "").toLowerCase().trim();

      const activeTasks = filtered.filter((b: any) => {
        const s = normalize(b.status || b.serviceStatus);
        return !["service completed", "completed", "cancelled"].includes(s);
      });

      const todayAssigned = activeTasks.filter((b: any) => {
        const dStr = b.created_at || b.createdAt || b.preferredDate;
        return dStr && new Date(dStr).toDateString() === todayStr;
      });

      setStats({
        todayCount: todayAssigned.length,
        totalCount: activeTasks.length,
        inProgress: activeTasks.filter((b: any) =>
          [
            "processing",
            "service going on",
            "waiting for spare",
            "call verified",
          ].includes(normalize(b.status || b.serviceStatus)),
        ).length,
        completed: filtered.filter((b: any) =>
          [
            "service completed",
            "completed",
            "bill pending",
            "bill completed",
          ].includes(normalize(b.status || b.serviceStatus)),
        ).length,
      });
    } catch (err) {
      console.error("Error fetching tasks:", err);
      Alert.alert("Error", "Failed to load your tasks");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const todayStr = new Date().toDateString();
      const res = await api.get("/all-services");
      const allServices = res.data || [];

      const myDisplayName =
        userProfile?.username ||
        (userProfile as any)?.displayName ||
        (userProfile as any)?.name ||
        "";
      const filtered = allServices.filter(
        (b: any) =>
          (b.assignedEmployeeName || "").toLowerCase() ===
            myDisplayName.toLowerCase() && b.status !== "Cancelled",
      );

      const tasksForToday = filtered.filter((b: any) => {
        const dStr = b.created_at || b.createdAt || b.preferredDate;
        return dStr && new Date(dStr).toDateString() === todayStr;
      });

      setMyTasks(tasksForToday);

      const normalize = (s: any) => (s || "").toLowerCase().trim();

      const activeTasks = filtered.filter((b: any) => {
        const s = normalize(b.status || b.serviceStatus);
        return !["service completed", "completed", "cancelled"].includes(s);
      });

      const todayAssigned = activeTasks.filter((b: any) => {
        const dStr = b.created_at || b.createdAt || b.preferredDate;
        return dStr && new Date(dStr).toDateString() === todayStr;
      });

      setStats({
        todayCount: todayAssigned.length,
        totalCount: activeTasks.length,
        inProgress: activeTasks.filter((b: any) =>
          [
            "processing",
            "service going on",
            "waiting for spare",
            "call verified",
          ].includes(normalize(b.status || b.serviceStatus)),
        ).length,
        completed: filtered.filter((b: any) =>
          [
            "service completed",
            "completed",
            "bill pending",
            "bill completed",
          ].includes(normalize(b.status || b.serviceStatus)),
        ).length,
      });
    } catch (err) {
      console.error("Error refreshing tasks:", err);
    } finally {
      setRefreshing(false);
    }
  };

  const updateServiceStatus = async (task: any, newStatus: string) => {
    try {
      const updateData: any = {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      };

      if (newStatus === "Service Going on") {
        updateData.startedAt = new Date().toISOString();
      }

      if (newStatus === "Service Completed") {
        updateData.completedAt = new Date().toISOString();
      }

      await api.put(`/bookings/${task.id}`, updateData);
      Alert.alert("Success", `Status updated to ${newStatus}`);
      fetchMyTasks();
    } catch (err) {
      console.error("Update error:", err);
      Alert.alert("Error", "Failed to update status");
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "Pending":
        return { bg: "bg-warning/20", text: "text-warning" };
      case "Processing":
        return { bg: "bg-warning/20", text: "text-warning" };
      case "Assigned":
        return { bg: "bg-primary/20", text: "text-primary" };
      case "Service Going on":
        return { bg: "bg-primary/20", text: "text-primary" };
      case "Bill Pending":
        return { bg: "bg-error/20", text: "text-error" };
      case "Bill Completed":
        return { bg: "bg-accent/20", text: "text-accent" };
      case "Service Completed":
      case "Completed":
        return { bg: "bg-success/20", text: "text-success" };
      default:
        return { bg: "bg-text-muted/20", text: "text-text-muted" };
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 100,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="rounded-[32px] border border-text-muted bg-slate-950/95 p-6 shadow-2xl mb-8">
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center flex-1 pr-4">
              <View className="w-16 h-16 rounded-3xl bg-primary/20 items-center justify-center mr-4 shadow-inner">
                <Ionicons name="person" size={26} color="#0EA5E9" />
              </View>
              <View>
                <Text className="text-2xl font-extrabold text-text-primary tracking-tight">
                  Hello, {userProfile?.username?.split(" ")[0] || "Technician"}!
                </Text>
                <Text className="text-text-secondary font-medium capitalize text-xs mt-1">
                  {userProfile?.role || "Staff"} • Workshop Dashboard
                </Text>
              </View>
            </View>
            <TouchableOpacity className="p-3 bg-slate-900 border border-slate-800 rounded-3xl shadow-sm">
              <Ionicons name="calendar-outline" size={20} color="#8b96a7" />
            </TouchableOpacity>
          </View>

          {/* Quick Stats */}
          <View className="flex-row justify-between gap-3">
            <View className="flex-1 px-5 py-4 rounded-2xl border border-text-secondary shadow-md bg-gradient-to-br from-primary/15 to-primary/5">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                  Daily / Work
                </Text>
                {/* <Ionicons name="time-outline" size={16} color="#0EA5E9" /> */}
              </View>
              <Text className="text-[28px] font-black text-text-primary">
                {stats.todayCount} / {stats.totalCount}
              </Text>
            </View>
            <View className="flex-1 px-5 py-4 rounded-2xl border border-text-secondary shadow-md bg-gradient-to-br from-primary/15 to-primary/5 relative">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                  In Progress
                </Text>
              </View>

              <Text className="text-[28px] font-black text-text-primary">
                {stats.inProgress}
              </Text>

              {/* ICON WITH BACKGROUND */}
              <View className="absolute bottom-4 right-3 w-8 h-8 rounded-lg bg-primary/20 items-center justify-center">
                <Ionicons name="construct-outline" size={16} color="#0EA5E9" />
              </View>
            </View>
            <View className="flex-1 px-5 py-4 rounded-2xl border border-text-secondary shadow-md bg-gradient-to-br from-success/15 to-success/5 relative">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                  Completed
                </Text>
              </View>

              <Text className="text-[28px] font-black text-text-primary">
                {stats.completed}
              </Text>

              {/* ICON WITH BACKGROUND */}
              <View className="absolute bottom-4 right-3 w-8 h-8 rounded-lg bg-success/20 items-center justify-center">
                <Ionicons
                  name="checkmark-circle-outline"
                  size={16}
                  color="#10B981"
                />
              </View>
            </View>
          </View>
        </View>

        {/* My Tasks */}
        <View className="flex-row items-center justify-between mb-4 mt-2">
          <View className="flex-row items-center">
            <Ionicons name="clipboard-outline" size={20} color="#0EA5E9" />
            <Text className="text-lg font-black text-text-primary ml-2">
              Today's Work
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(employee)/assigned" as any)}
            className="flex-row items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-2xl"
          >
            <Text className="text-xs font-black uppercase text-primary tracking-wider">
              View All
            </Text>

            <Ionicons name="arrow-forward" size={14} color="#0EA5E9" />
          </TouchableOpacity>
        </View>

        {loading && myTasks.length === 0 ? (
          <ActivityIndicator size="large" color="#0EA5E9" className="my-8" />
        ) : myTasks.length === 0 ? (
          <View className="bg-card p-8 rounded-3xl border border-card justify-center items-center mb-6">
            <Text className="text-text-secondary font-black mt-4">
              No Work Today
            </Text>
            <Text className="text-text-muted text-xs text-center mt-2 leading-4">
              No tasks assigned for today.
            </Text>
          </View>
        ) : (
          <View className="mb-6 mt-2">
            {myTasks.map((task, idx) => {
              const displayStatus =
                task.status || task.serviceStatus || "Assigned";
              const statusStyle = getStatusStyles(displayStatus);

              return (
                <View
                  key={task.id || idx}
                  className="bg-card p-5 rounded-3xl border border-card mb-4"
                >
                  {/* HEADER */}
                  <View className="flex-row items-start justify-between">
                    <View className="flex-row items-center flex-1">
                      <View className="w-10 h-10 rounded-xl bg-primary/20 items-center justify-center mr-3">
                        <Ionicons
                          name="car-sport-outline"
                          size={20}
                          color="#0EA5E9"
                        />
                      </View>

                      <View className="flex-1">
                        <Text className="font-black text-text-primary text-base">
                          {task.brand} {task.model}
                        </Text>

                        <Text className="text-md text-text-primary mt-1">
                          {task.vehicleNumber || "No Plate"} • {task.name}
                        </Text>
                      </View>
                    </View>

                    {/* STATUS BADGE */}
                    <View
                      className={`${statusStyle.bg} px-3 py-1.5 rounded-lg items-center justify-center ml-2`}
                    >
                      <Text
                        className={`${statusStyle.text} text-[10px] font-black uppercase`}
                      >
                        {displayStatus}
                      </Text>
                    </View>
                  </View>

                  {/* ACTION BUTTONS */}
                  {/* <View className="flex-row mt-4 pt-4 border-t border-slate-800 gap-3">
                    {(task.status === "Assigned" ||
                      task.status === "Pending" ||
                      task.status === "Approved" ||
                      task.status === "Processing") && (
                      <TouchableOpacity
                        onPress={() =>
                          updateServiceStatus(task, "Service Going on")
                        }
                        className="bg-gradient-to-r from-primary to-sky-500 flex-1 py-3 rounded-3xl items-center shadow-lg"
                      >
                        <Text className="text-white text-[11px] font-black uppercase tracking-[0.24em]">
                          Start
                        </Text>
                      </TouchableOpacity>
                    )}

                    {(task.status === "Service Going on" ||
                      task.status === "Waiting for Spare") && (
                      <TouchableOpacity
                        onPress={() =>
                          updateServiceStatus(task, "Service Completed")
                        }
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 flex-1 py-3 rounded-3xl items-center shadow-lg"
                      >
                        <Text className="text-white text-[11px] font-black uppercase tracking-[0.24em]">
                          Done
                        </Text>
                      </TouchableOpacity>
                    )}

                    {!(
                      task.status === "Completed" ||
                      task.status === "Service Completed" ||
                      task.status === "Cancelled"
                    ) && (
                      <TouchableOpacity
                        onPress={() =>
                          router.push(
                            `/(employee)/servicecenter?id=${task.id}` as any,
                          )
                        }
                        className="bg-slate-900/90 border border-slate-800 flex-1 py-3 rounded-3xl items-center shadow-sm"
                      >
                        <Text className="text-text-primary text-[13px] font-black uppercase tracking-[0.24em]">
                          Manage
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View> */}
                </View>
              );
            })}
          </View>
        )}

        {/* Quick Tools */}
        <Text className="font-black text-text-primary mb-4 text-xs uppercase tracking-widest mt-6 px-1">
          Quick Tools
        </Text>

        {/* NEW SERVICE ENTRY */}
        <TouchableOpacity
          onPress={() => router.push("/(employee)/servicecenter" as any)}
          className="flex-row items-center justify-between p-5 bg-slate-950/95 rounded-[28px] border border-slate-800 mb-4 shadow-lg"
        >
          <View className="flex-row items-center">
            <View className="w-14 h-14 bg-amber-500/10 rounded-3xl items-center justify-center mr-4 shadow-inner">
              <Ionicons name="construct" size={24} color="#F59E0B" />
            </View>

            <View>
              <Text className="text-text-primary font-extrabold text-sm">
                New Service Entry
              </Text>
              <Text className="text-text-muted text-[10px] uppercase tracking-[0.3em] mt-1">
                Create new service booking
              </Text>
            </View>
          </View>

          <Ionicons name="chevron-forward" size={18} color="#8b96a7" />
        </TouchableOpacity>

        {/* ADD SERVICE PARTS */}
        <TouchableOpacity
          onPress={() => router.push("/(employee)/billing" as any)}
          className="flex-row items-center justify-between p-5 bg-slate-950/95 rounded-[28px] border border-slate-800 mb-4 shadow-lg"
        >
          <View className="flex-row items-center">
            <View className="w-14 h-14 bg-primary/10 rounded-3xl items-center justify-center mr-4 shadow-inner">
              <Ionicons name="clipboard" size={24} color="#0EA5E9" />
            </View>

            <View>
              <Text className="text-text-primary font-extrabold text-sm">
                Add Service Parts
              </Text>
              <Text className="text-text-muted text-[10px] uppercase tracking-[0.3em] mt-1">
                Manage spare parts
              </Text>
            </View>
          </View>

          <Ionicons name="chevron-forward" size={18} color="#8b96a7" />
        </TouchableOpacity>

        {/* LOGOUT */}
        <TouchableOpacity
          onPress={async () => {
            await logout();
            router.replace("/(auth)/login");
          }}
          className="flex-row items-center justify-between p-5 bg-slate-950/95 rounded-[28px] border border-slate-800 mt-2 mb-10 shadow-lg"
        >
          <View className="flex-row items-center">
            <View className="w-14 h-14 bg-red-500/10 rounded-3xl items-center justify-center mr-4 shadow-inner">
              <Ionicons name="log-out" size={24} color="#EF4444" />
            </View>

            <View>
              <Text className="text-error font-extrabold text-sm">
                Logout Account
              </Text>
              <Text className="text-text-muted text-[10px] uppercase tracking-[0.3em] mt-1">
                Sign out of dashboard
              </Text>
            </View>
          </View>

          <Ionicons name="chevron-forward" size={18} color="#8b96a7" />
        </TouchableOpacity>
      </ScrollView>

      {/* Attendance Modal */}
      <Modal
        visible={showAttendanceModal}
        transparent={true}
        animationType="fade"
      >
        <View className="flex-1 bg-black/40 justify-center items-center p-4">
          <View className="bg-card w-full max-w-sm rounded-[32px] p-8 items-center shadow-2xl border border-card">
            <View className="w-20 h-20 bg-primary/20 rounded-full items-center justify-center mb-6">
              <Ionicons name="time" size={36} color="#0EA5E9" />
            </View>
            <Text className="text-2xl font-black text-text-primary mb-2">
              Mark Attendance
            </Text>
            <Text className="text-text-secondary text-center font-medium mb-8">
              Good morning! Please mark your attendance with GPS location to
              begin your workday.
            </Text>

            <TouchableOpacity
              onPress={handlePunchIn}
              disabled={isPunchingIn}
              className="w-full py-4 bg-primary rounded-2xl items-center flex-row justify-center"
            >
              {isPunchingIn ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                  <Text className="text-text-primary font-bold ml-2">
                    Punch In Now
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
