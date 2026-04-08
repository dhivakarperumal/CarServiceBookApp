import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    SafeAreaView,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { api } from "../../services/api";

const StatCard = ({ title, value, icon, gradient }: any) => (
  <View className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
    <View className="flex-row justify-between items-center">
      <View>
        <Text className="text-[10px] text-slate-500 uppercase font-black tracking-widest">
          {title}
        </Text>
        <Text className="text-2xl font-black text-white mt-1">{value}</Text>
      </View>
      <View className={`p-4 rounded-2xl text-white shadow-lg ${gradient}`}>
        {icon}
      </View>
    </View>
  </View>
);

const StatusBadge = ({ status }: { status: string }) => {
  const statusColors = {
    Present: "bg-emerald-500",
    Absent: "bg-red-500",
    Late: "bg-amber-500",
    "On Leave": "bg-indigo-500",
  };

  return (
    <View
      className={`px-3 py-1.5 rounded-full ${
        statusColors[status as keyof typeof statusColors] || "bg-slate-500"
      }`}
    >
      <Text className="text-[10px] font-black text-white uppercase tracking-widest">
        {status}
      </Text>
    </View>
  );
};

const AttendanceItem = ({ item }: { item: any }) => (
  <View className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-3">
    <View className="flex-row justify-between items-start mb-3">
      <View className="flex-1">
        <Text className="text-white font-black text-base">
          {item.name || "N/A"}
        </Text>
        <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-1">
          {item.role || "Technician"}
        </Text>
      </View>
      <StatusBadge status={item.status} />
    </View>

    <View className="flex-row justify-between items-center">
      <View className="flex-1">
        <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">
          Clock In
        </Text>
        <Text className="text-white font-bold text-sm">
          {item.loginTime ? dayjs(item.loginTime).format("hh:mm A") : "-- : --"}
        </Text>
      </View>

      <View className="flex-1">
        <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">
          Clock Out
        </Text>
        <Text className="text-white font-bold text-sm">
          {item.logoutTime
            ? dayjs(item.logoutTime).format("hh:mm A")
            : item.loginTime
              ? "Active"
              : "-- : --"}
        </Text>
      </View>

      <View className="flex-1">
        <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">
          Duration
        </Text>
        <View className="bg-emerald-500/20 px-2 py-1 rounded-full">
          <Text className="text-emerald-400 font-bold text-xs text-center">
            {item.duration || "N/A"}
          </Text>
        </View>
      </View>
    </View>
  </View>
);

export default function AttendanceScreen() {
  const router = useRouter();

  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    dayjs().format("YYYY-MM-DD"),
  );
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    loadAttendanceData();
  }, [selectedDate]);

  const loadAttendanceData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/attendance", {
        params: { date: selectedDate },
      });
      const data = res.data.map((docData: any) => ({
        ...docData,
        loginTime: docData.login_time,
        logoutTime: docData.logout_time,
        duration:
          docData.duration ||
          (docData.login_time && !docData.logout_time ? "Active" : "N/A"),
      }));
      setAttendanceData(data);
    } catch (err) {
      console.error("Error loading attendance:", err);
      setAttendanceData([]);
      Alert.alert("Error", "Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return attendanceData.filter((item) => {
      const text = `${item.name || ""} ${item.role || ""}`.toLowerCase();
      const matchSearch = text.includes(search.toLowerCase());
      const matchStatus =
        statusFilter === "all" || item.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [attendanceData, search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedData = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const stats = useMemo(() => {
    const total = attendanceData.length;
    const present = attendanceData.filter((a) => a.status === "Present").length;
    const absent = attendanceData.filter((a) => a.status === "Absent").length;
    const late = attendanceData.filter((a) => a.status === "Late").length;
    const onLeave = attendanceData.filter(
      (a) => a.status === "On Leave",
    ).length;

    return { total, present, absent, late, onLeave };
  }, [attendanceData]);

  const downloadAttendance = () => {
    Alert.alert(
      "Export Attendance",
      "CSV export is not available on mobile. Please use the web version for data export.",
      [{ text: "OK" }],
    );
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <View className="flex-row justify-center items-center gap-2 mt-6">
        <TouchableOpacity
          onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={`p-3 rounded-xl ${
            currentPage === 1
              ? "bg-slate-800 opacity-50"
              : "bg-slate-800 active:bg-slate-700"
          }`}
        >
          <Ionicons name="chevron-back" size={16} color="#64748b" />
        </TouchableOpacity>

        {pages.map((page) => (
          <TouchableOpacity
            key={page}
            onPress={() => setCurrentPage(page)}
            className={`px-4 py-2 rounded-xl ${
              page === currentPage
                ? "bg-sky-500"
                : "bg-slate-800 active:bg-slate-700"
            }`}
          >
            <Text
              className={`font-bold ${
                page === currentPage ? "text-white" : "text-slate-400"
              }`}
            >
              {page}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          onPress={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className={`p-3 rounded-xl ${
            currentPage === totalPages
              ? "bg-slate-800 opacity-50"
              : "bg-slate-800 active:bg-slate-700"
          }`}
        >
          <Ionicons name="chevron-forward" size={16} color="#64748b" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View className="p-6 border-b border-white/5 bg-slate-950">
          <View className="flex-row items-center gap-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="p-3 bg-slate-900 rounded-2xl border border-slate-800"
            >
              <Ionicons name="chevron-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-2xl font-black text-white">
                Workforce Attendance
              </Text>
              <Text className="text-[10px] uppercase tracking-widest text-slate-500 mt-1 font-black">
                Real-time personnel monitoring & analytics
              </Text>
            </View>
            <TouchableOpacity
              onPress={downloadAttendance}
              disabled={attendanceData.length === 0}
              className={`p-3 rounded-2xl border ${
                attendanceData.length === 0
                  ? "bg-slate-800 border-slate-700 opacity-50"
                  : "bg-slate-900 border-slate-800 active:bg-slate-800"
              }`}
            >
              <Ionicons
                name="download-outline"
                size={20}
                color={attendanceData.length === 0 ? "#64748b" : "#0ea5e9"}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* STATS GRID */}
        <View className="p-6">
          <View className="grid grid-cols-2 gap-4 mb-6">
            <StatCard
              title="Headcount"
              value={stats.total}
              icon={<Ionicons name="people" size={24} color="#ffffff" />}
              gradient="bg-blue-600"
            />
            <StatCard
              title="Present"
              value={stats.present}
              icon={
                <Ionicons name="checkmark-circle" size={24} color="#ffffff" />
              }
              gradient="bg-emerald-600"
            />
            <StatCard
              title="Absent"
              value={stats.absent}
              icon={<Ionicons name="close-circle" size={24} color="#ffffff" />}
              gradient="bg-red-600"
            />
            <StatCard
              title="Late Entry"
              value={stats.late}
              icon={<Ionicons name="time" size={24} color="#ffffff" />}
              gradient="bg-amber-600"
            />
            <StatCard
              title="On Leave"
              value={stats.onLeave}
              icon={<Ionicons name="airplane" size={24} color="#ffffff" />}
              gradient="bg-indigo-600"
            />
          </View>

          {/* FILTERS */}
          <View className="gap-4 mb-6">
            {/* DATE PICKER */}
            <View>
              <Text className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2 ml-1">
                Select Date
              </Text>
              <TextInput
                value={selectedDate}
                onChangeText={setSelectedDate}
                placeholder="YYYY-MM-DD"
                className="w-full bg-slate-900 rounded-2xl border border-slate-800 px-5 py-4 text-white font-bold"
                placeholderTextColor="#64748b"
              />
            </View>

            {/* SEARCH */}
            <View>
              <Text className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2 ml-1">
                Search Personnel
              </Text>
              <View className="relative">
                <Ionicons
                  name="search"
                  size={20}
                  color="#64748b"
                  style={{ position: "absolute", left: 20, top: 18 }}
                />
                <TextInput
                  placeholder="Search by name or role..."
                  value={search}
                  onChangeText={(text) => {
                    setSearch(text);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-slate-900 rounded-2xl border border-slate-800 pl-14 pr-5 py-4 text-white font-bold"
                  placeholderTextColor="#64748b"
                />
              </View>
            </View>

            {/* STATUS FILTER */}
            <View>
              <Text className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2 ml-1">
                Filter by Status
              </Text>
              <View className="flex-row gap-2">
                {[
                  { value: "all", label: "All Status" },
                  { value: "Present", label: "Present" },
                  { value: "Absent", label: "Absent" },
                  { value: "Late", label: "Late Entry" },
                  { value: "On Leave", label: "On Leave" },
                ].map((status) => (
                  <TouchableOpacity
                    key={status.value}
                    onPress={() => {
                      setStatusFilter(status.value);
                      setCurrentPage(1);
                    }}
                    className={`flex-1 py-3 px-4 rounded-2xl border ${
                      statusFilter === status.value
                        ? "border-sky-500 bg-sky-500/20"
                        : "border-slate-800 bg-slate-900"
                    }`}
                  >
                    <Text
                      className={`text-center text-[10px] font-black uppercase tracking-widest ${
                        statusFilter === status.value
                          ? "text-sky-500"
                          : "text-slate-400"
                      }`}
                    >
                      {status.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* ATTENDANCE LIST */}
          {loading ? (
            <View className="py-20 items-center">
              <ActivityIndicator size="large" color="#0EA5E9" />
              <Text className="text-slate-500 mt-4 font-bold uppercase tracking-widest text-[10px]">
                Synchronizing Data...
              </Text>
            </View>
          ) : paginatedData.length === 0 ? (
            <View className="py-20 items-center">
              <Ionicons name="calendar-outline" size={64} color="#64748b" />
              <Text className="text-white text-xl font-black uppercase tracking-tight mt-4">
                No records discovered
              </Text>
              <Text className="text-slate-400 text-xs font-bold mt-2 uppercase tracking-widest text-center">
                Adjust filters or select a different date
              </Text>
            </View>
          ) : (
            <View>
              <FlatList
                data={paginatedData}
                keyExtractor={(item) =>
                  item.id?.toString() || Math.random().toString()
                }
                renderItem={({ item }) => <AttendanceItem item={item} />}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
              {renderPagination()}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
