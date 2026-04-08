import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
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
  View
} from 'react-native';
import { apiService } from '../../services/api';
import { COLORS } from '../../theme/colors';

export default function ServiceAreas() {
  const router = useRouter();
  const [areas, setAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<any>(null);
  const [formData, setFormData] = useState({ pincode: "", area_name: "" });

  const fetchAreas = async () => {
    try {
      setLoading(true);
      const data = await apiService.getServiceAreas();
      setAreas(data || []);
    } catch (err) {
      console.error("Fetch service areas error:", err);
      Alert.alert("Error", "Failed to load service areas");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAreas();
  }, []);

  const handleSubmit = async () => {
    if (!formData.pincode || !formData.area_name) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }
    try {
      if (editingArea) {
        await apiService.updateServiceArea(editingArea.id, formData);
        Alert.alert("Success", "Area updated successfully");
      } else {
        await apiService.createServiceArea(formData);
        Alert.alert("Success", "Area added successfully");
      }
      setIsModalOpen(false);
      setEditingArea(null);
      setFormData({ pincode: "", area_name: "" });
      fetchAreas();
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (id: any) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this service area?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await apiService.deleteServiceArea(id);
              Alert.alert("Success", "Area deleted");
              fetchAreas();
            } catch (err) {
              Alert.alert("Error", "Failed to delete area");
            }
          }
        }
      ]
    );
  };

  const toggleStatus = async (area: any) => {
    try {
      const newStatus = area.status === "active" ? "inactive" : "active";
      await apiService.toggleServiceAreaStatus(area.id, newStatus);
      Alert.alert("Success", `Area ${newStatus === "active" ? "activated" : "deactivated"}`);
      fetchAreas();
    } catch (err) {
      Alert.alert("Error", "Failed to toggle status");
    }
  };

  const filteredAreas = useMemo(() => {
    return (areas || []).filter(
      (area) =>
        (area.pincode || "").includes(searchTerm) ||
        (area.area_name || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [areas, searchTerm]);

  if (loading && !refreshing) {
    return (
      <View style={{ flex: 1, backgroundColor: '#020617', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, marginTop: 16 }}>Loading Areas...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      {/* HEADER */}
      

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAreas(); }} tintColor={COLORS.primary} />}
      >
        {/* STATS BAR */}
        <View className="px-6 py-6">
          <View className="bg-emerald-500/5 border border-emerald-500/10 rounded-[32px] p-5 flex-row items-center justify-between shadow-sm">
            <View className="flex-row items-center gap-4">
              <View className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <Ionicons name="location" size={24} color="#10b981" />
              </View>
              <View>
                <Text className="text-slate-500 text-[9px] font-black uppercase tracking-widest opacity-60">Total Locations</Text>
                <Text className="text-2xl font-black text-white">{areas.length}</Text>
              </View>
            </View>
            <View className="bg-emerald-500/20 px-4 py-2 rounded-full border border-emerald-500/30">
              <Text className="text-emerald-500 font-black text-[10px] uppercase tracking-widest">
                {areas.filter((a) => a.status === "active").length} Active
              </Text>
            </View>
          </View>
        </View>

        {/* SEARCH BAR */}
        <View className="px-6 pb-6">
          <View className="bg-slate-900 flex-row items-center px-4 rounded-2xl border border-slate-800 h-14 shadow-2xl">
            <Ionicons name="search" size={18} color="#475569" />
            <TextInput
              placeholder="Search by pincode or area name..."
              placeholderTextColor="#475569"
              value={searchTerm}
              onChangeText={setSearchTerm}
              className="flex-1 ml-3 text-white font-bold text-sm"
            />
          </View>
        </View>

        {/* LIST */}
        <View className="px-6 pb-20">
          {filteredAreas.length === 0 ? (
            <View className="py-20 items-center bg-slate-900/50 rounded-[40px] border border-dashed border-slate-800">
              <MaterialCommunityIcons name="map-marker-off" size={48} color="#1e293b" />
              <Text className="text-slate-600 font-black uppercase tracking-widest text-[10px] mt-4">No Areas Found</Text>
            </View>
          ) : filteredAreas.map((area, index) => (
            <View
              key={area.id || index}
              className="bg-slate-900 border border-slate-800 rounded-[32px] p-5 mb-4 shadow-xl"
            >
              <View className="flex-row justify-between items-start mb-4">
                <View className="flex-row items-center gap-3">
                  <View className="bg-slate-950 p-3 rounded-2xl border border-white/5 shadow-inner">
                    <Text className="text-slate-500 text-[10px] font-black">{index + 1}</Text>
                  </View>
                  <View>
                    <Text className="text-white text-lg font-black tracking-tight">{area.area_name}</Text>
                    <View className="flex-row items-center gap-1 mt-0.5">
                      <Ionicons name="pin-outline" size={10} color="#64748b" />
                      <Text className="text-slate-500 text-[10px] font-bold tracking-widest">{area.pincode}</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => toggleStatus(area)}
                  className={`px-3 py-1.5 rounded-full border ${area.status === "active"
                    ? "bg-emerald-500/10 border-emerald-500/20"
                    : "bg-rose-500/10 border-rose-500/20"
                    }`}
                >
                  <Text className={`text-[8px] font-black uppercase tracking-widest ${area.status === "active" ? "text-emerald-500" : "text-rose-500"
                    }`}>
                    {area.status === "active" ? "Active" : "Inactive"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View className="flex-row justify-end items-center gap-2 border-t border-white/5 pt-4">
                <TouchableOpacity
                  onPress={() => {
                    setEditingArea(area);
                    setFormData({ pincode: area.pincode, area_name: area.area_name });
                    setIsModalOpen(true);
                  }}
                  className="w-10 h-10 bg-sky-500/10 rounded-xl items-center justify-center border border-sky-500/20"
                >
                  <Ionicons name="create-outline" size={18} color="#0ea5e9" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDelete(area.id)}
                  className="w-10 h-10 bg-rose-500/10 rounded-xl items-center justify-center border border-rose-500/20"
                >
                  <Ionicons name="trash-outline" size={18} color="#f43f5e" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* FLOATING ADD BUTTON */}
      <TouchableOpacity
        onPress={() => {
          setEditingArea(null);
          setFormData({ pincode: "", area_name: "" });
          setIsModalOpen(true);
        }}
        className="absolute bottom-10 right-8 w-16 bg-white h-16 bg-sky-500 rounded-full items-center justify-center shadow-2xl shadow-sky-500/40 border-4 border-slate-950"
      >
        <Ionicons name="add" size={32} color="black" />
      </TouchableOpacity>

      {/* ADD/EDIT MODAL */}
      <Modal visible={isModalOpen} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#0f172a', borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 32, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' }}>
            <View style={{ width: 40, height: 4, backgroundColor: '#1e293b', borderRadius: 2, alignSelf: 'center', marginBottom: 24 }} />

            <View className="mb-8">
              <Text className="text-white text-2xl font-black uppercase tracking-tight">
                {editingArea ? "Edit Location" : "Add New Location"}
              </Text>
              <Text className="text-slate-500 text-[10px] font-black uppercase tracking-[2px] mt-1">
                Manage service coverage
              </Text>
            </View>

            <View className="space-y-4 mb-10">
              <View className="bg-slate-950 p-4 rounded-3xl border border-white/5 mb-4 shadow-inner">
                <Text className="text-slate-600 text-[8px] font-black uppercase tracking-widest mb-2 ml-1">Pincode</Text>
                <TextInput
                  placeholder="e.g. 641001"
                  placeholderTextColor="#334155"
                  value={formData.pincode}
                  keyboardType="numeric"
                  onChangeText={(val) => setFormData(prev => ({ ...prev, pincode: val }))}
                  className="text-white font-black text-lg p-0"
                />
              </View>

              <View className="bg-slate-950 p-4 rounded-3xl border border-white/5 shadow-inner">
                <Text className="text-slate-600 text-[8px] font-black uppercase tracking-widest mb-2 ml-1">Area Name</Text>
                <TextInput
                  placeholder="e.g. Gandhipuram, Coimbatore"
                  placeholderTextColor="#334155"
                  value={formData.area_name}
                  onChangeText={(val) => setFormData(prev => ({ ...prev, area_name: val }))}
                  className="text-white font-black text-lg p-0"
                />
              </View>
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setIsModalOpen(false)}
                className="flex-1 h-14 bg-slate-800 rounded-2xl items-center justify-center border border-white/5 shadow-xl"
              >
                <Text className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmit}
                className="flex-[2] h-14 bg-white rounded-2xl items-center justify-center shadow-2xl shadow-white/5"
              >
                <Text className="text-black font-black uppercase tracking-widest text-[10px]">
                  {editingArea ? "Save Changes" : "Confirm Area"}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={{ height: 40 }} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
