import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
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
    pending: 0,
    inProgress: 0,
    completed: 0,
    totalStaff: 0,
  });
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
      const res = await api.get("/all-services");
      const allServices = res.data || [];

      const myDisplayName =
        userProfile?.username || (userProfile as any)?.name || "";
      const filtered = allServices.filter(
        (b: any) =>
          (b.assignedEmployeeName || "").toLowerCase() ===
            myDisplayName.toLowerCase() && b.status !== "Cancelled",
      );

      setMyTasks(filtered.slice(0, 5));

      setStats({
        pending: filtered.filter(
          (b: any) => b.status === "Booked" || b.status === "Pending",
        ).length,
        inProgress: filtered.filter((b: any) =>
          [
            "Call Verified",
            "Approved",
            "Processing",
            "Service Going on",
          ].includes(b.status),
        ).length,
        completed: filtered.filter((b: any) =>
          ["Service Completed", "Completed"].includes(b.status),
        ).length,
        totalStaff: 0,
      });
    } catch (err) {
      console.error("Error fetching tasks:", err);
    } finally {
      setLoading(false);
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
      <ScrollView className="flex-1 p-5 pb-20">
        <View className="flex-row items-center justify-between mb-8">
          <View className="flex-row items-center flex-1 pr-4">
            <View className="w-14 h-14 rounded-2xl bg-card items-center justify-center mr-4">
              <Ionicons name="person" size={24} color="#FFFFFF" />
            </View>
            <View>
              <Text className="text-xl font-bold text-text-primary">
                Hello, {userProfile?.username?.split(" ")[0] || "Technician"}!
              </Text>
              <Text className="text-text-secondary font-medium capitalize text-xs">
                {userProfile?.role || "Staff"} • Workspace
              </Text>
            </View>
          </View>
          <TouchableOpacity className="p-2 bg-card rounded-xl border border-card">
            <Ionicons name="calendar-outline" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View className="flex-row justify-between mb-8 space-x-2">
          <View className="flex-1 bg-card p-4 rounded-2xl border border-card mx-1">
            <Ionicons
              name="time-outline"
              size={24}
              color="#0EA5E9"
              className="mb-2"
            />
            <Text className="text-xs text-text-muted font-medium mt-1">
              Pending
            </Text>
            <Text className="text-xl font-bold text-text-primary">
              {stats.pending}
            </Text>
          </View>
          <View className="flex-1 bg-card p-4 rounded-2xl border border-card mx-1">
            <Ionicons
              name="construct-outline"
              size={24}
              color="#0EA5E9"
              className="mb-2"
            />
            <Text className="text-xs text-text-muted font-medium mt-1">
              In Progress
            </Text>
            <Text className="text-xl font-bold text-text-primary">
              {stats.inProgress}
            </Text>
          </View>
          <View className="flex-1 bg-card p-4 rounded-2xl border border-card mx-1">
            <Ionicons
              name="checkmark-circle-outline"
              size={24}
              color="#10B981"
              className="mb-2"
            />
            <Text className="text-xs text-text-muted font-medium mt-1">
              Completed
            </Text>
            <Text className="text-xl font-bold text-text-primary">
              {stats.completed}
            </Text>
          </View>
        </View>

        {/* My Tasks */}
        <View className="flex-row items-center justify-between mb-4 mt-2">
          <View className="flex-row items-center">
            <Ionicons name="clipboard-outline" size={20} color="#0EA5E9" />
            <Text className="text-lg font-black text-text-primary ml-2">
              Assigned Tasks
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(employee)/assigned" as any)}
          >
            <Text className="text-xs font-black uppercase text-primary">
              View All
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#0EA5E9" className="my-8" />
        ) : myTasks.length === 0 ? (
          <View className="bg-card p-8 rounded-3xl border border-card justify-center items-center mb-6">
            <Ionicons name="clipboard-outline" size={40} color="#64748B" />
            <Text className="text-text-muted mt-2">
              No tasks currently assigned to you.
            </Text>
          </View>
        ) : (
          <View className="mb-6 mt-2">
            {myTasks.map((task, idx) => {
              const statusStyle = getStatusStyles(task.status);
              return (
                <View
                  key={task.id || idx}
                  className="bg-card p-4 rounded-2xl border border-card mb-3"
                >
                  <View className="flex-row justify-between mb-2">
                    <View>
                      <Text className="font-bold text-text-primary text-base">
                        {task.brand} {task.model}
                      </Text>
                      <Text className="text-xs text-text-muted">
                        {task.vehicleNumber || "No Plate"} • {task.name}
                      </Text>
                    </View>
                    <View
                      className={`${statusStyle.bg} px-2 flex items-center justify-center rounded-md self-start py-1`}
                    >
                      <Text
                        className={`${statusStyle.text} text-[10px] font-bold`}
                      >
                        {task.status}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row mt-2 pt-3 border-t border-card space-x-2">
                    {(task.status === "Assigned" ||
                      task.status === "Pending" ||
                      task.status === "Approved" ||
                      task.status === "Processing") && (
                      <TouchableOpacity
                        onPress={() =>
                          updateServiceStatus(task, "Service Going on")
                        }
                        className="bg-primary px-3 py-2 rounded-lg flex-1 items-center mx-1"
                      >
                        <Text className="text-text-primary text-xs font-bold uppercase">
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
                        className="bg-success px-3 py-2 rounded-lg flex-1 items-center mx-1"
                      >
                        <Text className="text-text-primary text-xs font-bold uppercase">
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
                        className="bg-card px-3 py-2 rounded-lg flex-1 items-center mx-1 border border-card"
                      >
                        <Text className="text-text-primary text-xs font-bold uppercase">
                          Manage
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
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
  className="flex-row items-center justify-between p-5 bg-card rounded-2xl border border-card mb-4"
>
  <View className="flex-row items-center">
    <View className="w-12 h-12 bg-warning/20 rounded-xl items-center justify-center mr-4">
      <Ionicons name="construct" size={22} color="#F59E0B" />
    </View>

    <View>
      <Text className="text-text-primary font-bold text-sm">
        New Service Entry
      </Text>
      <Text className="text-text-muted text-[10px] uppercase tracking-widest">
        Create new service booking
      </Text>
    </View>
  </View>

  <Ionicons name="chevron-forward" size={18} color="#64748B" />
</TouchableOpacity>


{/* ADD SERVICE PARTS */}
<TouchableOpacity
  onPress={() => router.push("/(employee)/billing" as any)}
  className="flex-row items-center justify-between p-5 bg-card rounded-2xl border border-card mb-4"
>
  <View className="flex-row items-center">
    <View className="w-12 h-12 bg-primary/20 rounded-xl items-center justify-center mr-4">
      <Ionicons name="clipboard" size={22} color="#0EA5E9" />
    </View>

    <View>
      <Text className="text-text-primary font-bold text-sm">
        Add Service Parts
      </Text>
      <Text className="text-text-muted text-[10px] uppercase tracking-widest">
        Manage spare parts
      </Text>
    </View>
  </View>

  <Ionicons name="chevron-forward" size={18} color="#64748B" />
</TouchableOpacity>


{/* LOGOUT */}
<TouchableOpacity
  onPress={async () => {
    await logout();
    router.replace("/(auth)/login");
  }}
  className="flex-row items-center justify-between p-5 bg-card rounded-2xl border border-card mt-2 mb-10"
>
  <View className="flex-row items-center">
    <View className="w-12 h-12 bg-error/20 rounded-xl items-center justify-center mr-4">
      <Ionicons name="log-out" size={22} color="#EF4444" />
    </View>

    <View>
      <Text className="text-error font-bold text-sm">
        Logout Account
      </Text>
      <Text className="text-text-muted text-[10px] uppercase tracking-widest">
        Sign out of dashboard
      </Text>
    </View>
  </View>

  <Ionicons name="chevron-forward" size={18} color="#64748B" />
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

            <TouchableOpacity
              onPress={() => setShowAttendanceModal(false)}
              className="mt-6"
            >
              <Text className="text-text-muted font-bold uppercase text-xs tracking-wider">
                Skip for now
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
