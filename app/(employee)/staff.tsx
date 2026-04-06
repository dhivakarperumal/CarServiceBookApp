import React, { useEffect, useState } from "react";
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, Modal, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { api } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import * as Location from 'expo-location';

export default function EmployeeDashboard() {
  const router = useRouter();
  const { user: userProfile, logout } = useAuth();
  const [stats, setStats] = useState({
    pending: 0,
    inProgress: 0,
    completed: 0,
    totalStaff: 0
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
      const me = (staffRes.data || []).find((s: any) => s.email?.toLowerCase() === userProfile?.email?.toLowerCase());
      
      if (me) {
        setMyStaffRecord(me);
        const today = new Date().toLocaleDateString('en-CA');
        const attendRes = await api.get(`/attendance/check?staff_id=${me.id}&date=${today}`);
        
        const role = userProfile?.role?.toLowerCase();
        const needsAttendance = ["mechanic", "employee", "staff", "receptionist", "manager"].includes(role);
        
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
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please allow location access to mark attendance');
        setIsPunchingIn(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      const today = new Date().toLocaleDateString('en-CA');
      
      await api.post("/attendance/punch-in", {
        staff_id: myStaffRecord.id,
        date: today,
        latitude,
        longitude,
        status: "Present"
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
      
      const myDisplayName = userProfile?.username || (userProfile as any)?.name || "";
      const filtered = allServices.filter((b: any) => 
        (b.assignedEmployeeName || "").toLowerCase() === myDisplayName.toLowerCase() &&
        b.status !== "Cancelled"
      );

      setMyTasks(filtered.slice(0, 5));
      
      setStats({
        pending: filtered.filter((b: any) => b.status === "Booked" || b.status === "Pending").length,
        inProgress: filtered.filter((b: any) => ["Call Verified", "Approved", "Processing", "Service Going on"].includes(b.status)).length,
        completed: filtered.filter((b: any) => ["Service Completed", "Completed"].includes(b.status)).length,
        totalStaff: 0
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
        updatedAt: new Date().toISOString()
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
      case "Pending": return { bg: "bg-yellow-600", text: "text-black" };
      case "Processing": return { bg: "bg-orange-600", text: "text-white" };
      case "Assigned": return { bg: "bg-blue-600", text: "text-white" };
      case "Service Going on": return { bg: "bg-indigo-600", text: "text-white" };
      case "Bill Pending": return { bg: "bg-purple-600", text: "text-white" };
      case "Bill Completed": return { bg: "bg-cyan-600", text: "text-white" };
      case "Service Completed": 
      case "Completed": return { bg: "bg-emerald-600", text: "text-white" };
      default: return { bg: "bg-slate-700", text: "text-slate-300" };
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <ScrollView className="flex-1 p-5 pb-20">
        <View className="flex-row items-center justify-between mb-8">
          <View className="flex-row items-center flex-1 pr-4">
            <View className="w-14 h-14 rounded-2xl bg-black items-center justify-center mr-4">
              <Ionicons name="person" size={24} color="white" />
            </View>
            <View>
              <Text className="text-xl font-bold text-white">
                Hello, {userProfile?.username?.split(" ")[0] || "Technician"}!
              </Text>
              <Text className="text-slate-400 font-medium capitalize text-xs">
                {userProfile?.role || "Staff"} • Workshop
              </Text>
            </View>
          </View>
          <TouchableOpacity className="p-2 bg-slate-800 rounded-xl border border-slate-700">
            <Ionicons name="calendar-outline" size={20} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View className="flex-row justify-between mb-8 space-x-2">
          <View className="flex-1 bg-slate-800 p-4 rounded-2xl border border-slate-700 mx-1">
            <Ionicons name="time-outline" size={24} color="#3b82f6" />
            <Text className="text-xs text-slate-400 font-medium mt-1">Pending</Text>
            <Text className="text-xl font-bold text-white">{stats.pending}</Text>
          </View>
          <View className="flex-1 bg-slate-800 p-4 rounded-2xl border border-slate-700 mx-1">
            <Ionicons name="construct-outline" size={24} color="#6366f1" />
            <Text className="text-xs text-slate-400 font-medium mt-1">In Progress</Text>
            <Text className="text-xl font-bold text-white">{stats.inProgress}</Text>
          </View>
          <View className="flex-1 bg-slate-800 p-4 rounded-2xl border border-slate-700 mx-1">
            <Ionicons name="checkmark-circle-outline" size={24} color="#10b981" />
            <Text className="text-xs text-slate-400 font-medium mt-1">Completed</Text>
            <Text className="text-xl font-bold text-white">{stats.completed}</Text>
          </View>
        </View>

        {/* My Tasks */}
        <View className="flex-row items-center justify-between mb-4 mt-2">
          <View className="flex-row items-center">
            <Ionicons name="clipboard-outline" size={20} color="#3b82f6" />
            <Text className="text-lg font-black text-white ml-2">Assigned Tasks</Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/(employee)/assigned" as any)}>
            <Text className="text-xs font-black uppercase text-sky-500">View All</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#2563eb" className="my-8" />
        ) : myTasks.length === 0 ? (
          <View className="bg-white p-8 rounded-3xl border border-gray-100 justify-center items-center mb-6">
            <Ionicons name="clipboard-outline" size={40} color="#e5e7eb" />
            <Text className="text-gray-400 mt-2">No tasks currently assigned to you.</Text>
          </View>
        ) : (
          <View className="mb-6 mt-2">
            {myTasks.map((task, idx) => {
              const statusStyle = getStatusStyles(task.status);
              return (
                <View key={task.id || idx} className="bg-slate-800 p-5 rounded-3xl border border-slate-700 mb-4">
                  <View className="flex-row justify-between mb-4">
                    <View className="flex-1">
                      <Text className="font-black text-white text-base">{task.brand} {task.model}</Text>
                      <Text className="text-xs text-slate-400 mt-1">{task.vehicleNumber || "No Plate"} • {task.name}</Text>
                    </View>
                    <View className={`${statusStyle.bg} px-3 py-1 rounded-full self-start`}>
                      <Text className={`${statusStyle.text} text-[8px] font-black uppercase tracking-widest`}>{task.status}</Text>
                    </View>
                  </View>
                  
                  <View className="flex-row pt-4 border-t border-slate-700/50 space-x-2">
                    {(task.status === "Assigned" || task.status === "Pending" || task.status === "Approved" || task.status === "Processing") && (
                      <TouchableOpacity 
                        onPress={() => updateServiceStatus(task, "Service Going on")}
                        className="bg-blue-600 px-4 py-2.5 rounded-xl flex-1 items-center mx-1"
                      >
                        <Text className="text-white text-[10px] font-black uppercase tracking-widest">Start Job</Text>
                      </TouchableOpacity>
                    )}
                    {(task.status === "Service Going on" || task.status === "Waiting for Spare") && (
                      <TouchableOpacity 
                        onPress={() => updateServiceStatus(task, "Service Completed")}
                        className="bg-emerald-600 px-4 py-2.5 rounded-xl flex-1 items-center mx-1"
                      >
                        <Text className="text-white text-[10px] font-black uppercase tracking-widest">Complete</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity 
                      onPress={() => router.push(`/(employee)/servicecenter?id=${task.id}` as any)}
                      className="bg-slate-700 px-4 py-2.5 rounded-xl flex-1 items-center mx-1"
                    >
                      <Text className="text-white text-[10px] font-black uppercase tracking-widest">Board</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Quick Tools */}
        <Text className="font-black text-slate-500 mb-4 text-[10px] uppercase tracking-widest mt-4 ml-1">Operations Hub</Text>
        <TouchableOpacity 
          onPress={() => router.push("/(employee)/servicecenter" as any)}
          className="flex-row items-center p-5 bg-slate-800 rounded-3xl border border-slate-700 mb-3"
        >
          <View className="p-2 bg-orange-600 rounded-xl mr-3">
            <Ionicons name="construct" size={20} color="white" />
          </View>
          <Text className="text-white font-bold">Service Board</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => router.push("/(employee)/add-parts" as any)}
          className="flex-row items-center p-5 bg-slate-800 rounded-3xl border border-slate-700 mb-3"
        >
          <View className="p-2 bg-emerald-600 rounded-xl mr-3">
            <Ionicons name="cart" size={20} color="white" />
          </View>
          <Text className="text-white font-bold">Add Service Parts</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={async () => {
             await logout();
             router.replace('/(auth)/login');
          }}
          className="flex-row items-center p-5 bg-slate-800 rounded-3xl border border-slate-700 mt-2 mb-10"
        >
          <View className="p-2 bg-red-600 rounded-xl mr-3">
            <Ionicons name="log-out" size={20} color="white" />
          </View>
          <Text className="text-red-500 font-bold">Logout Account</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Attendance Modal */}
      <Modal visible={showAttendanceModal} transparent={true} animationType="fade">
        <View className="flex-1 bg-black justify-center items-center p-6">
          <View className="bg-slate-800 w-full rounded-[32px] p-8 items-center border border-slate-700">
            <View className="w-20 h-20 bg-blue-600 rounded-3xl items-center justify-center mb-6">
              <Ionicons name="time" size={36} color="white" />
            </View>
            <Text className="text-2xl font-black text-white mb-2 text-center">Mark Attendance</Text>
            <Text className="text-slate-400 text-center font-medium mb-8 leading-5">
              Good morning! Please mark your attendance with GPS location to begin your workday.
            </Text>
            
            <TouchableOpacity
              onPress={handlePunchIn}
              disabled={isPunchingIn}
              className="w-full py-4 bg-blue-600 rounded-2xl items-center flex-row justify-center"
            >
              {isPunchingIn ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={24} color="white" />
                  <Text className="text-white font-bold ml-2">Punch In Now</Text>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => setShowAttendanceModal(false)}
              className="mt-6"
            >
              <Text className="text-slate-400 font-bold uppercase text-xs tracking-wider">Skip for now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
