import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
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
          },
        },
      ],
    );
  };

  const toggleStatus = async (area: any) => {
    try {
      const newStatus = area.status === "active" ? "inactive" : "active";
      await apiService.toggleServiceAreaStatus(area.id, newStatus);
      Alert.alert(
        "Success",
        `Area ${newStatus === "active" ? "activated" : "deactivated"}`,
      );
      fetchAreas();
    } catch (err) {
      Alert.alert("Error", "Failed to toggle status");
    }
  };

  const filteredAreas = useMemo(() => {
    return (areas || []).filter(
      (area) =>
        (area.pincode || "").includes(searchTerm) ||
        (area.area_name || "").toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [areas, searchTerm]);

  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text className="text-text-secondary text-[10px] font-black uppercase tracking-widest mt-4">
          Loading Areas...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen
        options={{
          title: "Service Areas",
          headerShown: true,
          headerStyle: { backgroundColor: COLORS.background },
          headerTintColor: COLORS.white,
          headerTitleStyle: { fontWeight: "900", fontSize: 16 },
        }}
      />
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchAreas();
            }}
            tintColor={COLORS.primary}
          />
        }
      >
        <View className="p-6">
          <View className="mb-8">
            <Text className="text-text-secondary text-[9px] font-black uppercase tracking-widest">
              Sales Management
            </Text>
            <Text className="text-white text-lg font-black tracking-tighter uppercase mt-1">
              Service Areas
            </Text>
          </View>
          {/* STATS BAR */}
          <View className="mb-6">
            <View className="bg-card border border-slate-700 rounded-3xl p-5 flex-row items-center justify-between shadow-sm">
              <View className="flex-row items-center gap-4">
                <View className="w-12 h-12 rounded-2xl bg-card-light flex items-center justify-center border border-slate-700">
                  <Ionicons name="location" size={24} color={COLORS.primary} />
                </View>
                <View>
                  <Text className="text-text-secondary text-[9px] font-black uppercase tracking-widest">
                    Total Locations
                  </Text>
                  <Text className="text-2xl font-black text-white">
                    {areas.length}
                  </Text>
                </View>
              </View>
              <View className="bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
                <Text className="text-primary font-black text-[10px] uppercase tracking-widest">
                  {areas.filter((a) => a.status === "active").length} Active
                </Text>
              </View>
            </View>
          </View>

          {/* SEARCH BAR */}
          <View className="pb-6">
            <View className="bg-card border border-slate-700 flex-row items-center px-4 rounded-3xl h-14">
              <Ionicons name="search" size={18} color={COLORS.textSecondary} />
              <TextInput
                placeholder="Search by pincode or area name..."
                placeholderTextColor={COLORS.textSecondary}
                value={searchTerm}
                onChangeText={setSearchTerm}
                className="flex-1 ml-3 text-white font-bold text-sm"
              />
            </View>
          </View>

          {/* LIST */}
          <View className="pb-20">
            {filteredAreas.length === 0 ? (
              <View className="py-20 items-center bg-card rounded-[40px] border border-dashed border-slate-700">
                <MaterialCommunityIcons
                  name="map-marker-off"
                  size={48}
                  color={COLORS.textSecondary}
                />
                <Text className="text-text-secondary font-black uppercase tracking-widest text-[10px] mt-4">
                  No Areas Found
                </Text>
              </View>
            ) : (
              filteredAreas.map((area, index) => (
                <View
                  key={area.id || index}
                  className="bg-card border border-slate-700 rounded-3xl p-5 mb-4 shadow-sm"
                >
                  <View className="flex-row justify-between items-start mb-4">
                    <View className="flex-row items-center gap-3">
                      <View className="bg-card-light p-3 rounded-2xl border border-slate-700">
                        <Text className="text-text-secondary text-[10px] font-black">
                          {index + 1}
                        </Text>
                      </View>
                      <View>
                        <Text className="text-white text-lg font-black tracking-tight">
                          {area.area_name}
                        </Text>
                        <View className="flex-row items-center gap-1 mt-0.5">
                          <Ionicons
                            name="pin-outline"
                            size={10}
                            color={COLORS.textSecondary}
                          />
                          <Text className="text-text-secondary text-[10px] font-bold tracking-widest">
                            {area.pincode}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => toggleStatus(area)}
                      className={`px-3 py-1.5 rounded-full border ${
                        area.status === "active"
                          ? "bg-primary/10 border-primary/20"
                          : "bg-rose-500/10 border-rose-500/20"
                      }`}
                    >
                      <Text
                        className={`text-[8px] font-black uppercase tracking-widest ${
                          area.status === "active"
                            ? "text-primary"
                            : "text-rose-500"
                        }`}
                      >
                        {area.status === "active" ? "Active" : "Inactive"}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View className="flex-row justify-end items-center gap-2 border-t border-slate-700 pt-4">
                    <TouchableOpacity
                      onPress={() => {
                        setEditingArea(area);
                        setFormData({
                          pincode: area.pincode,
                          area_name: area.area_name,
                        });
                        setIsModalOpen(true);
                      }}
                      className="w-10 h-10 bg-card-light rounded-xl items-center justify-center border border-slate-700"
                    >
                      <Ionicons
                        name="create-outline"
                        size={18}
                        color={COLORS.primary}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(area.id)}
                      className="w-10 h-10 bg-card-light rounded-xl items-center justify-center border border-slate-700"
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color={COLORS.primary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* FLOATING ADD BUTTON */}
      <TouchableOpacity
        onPress={() => {
          setEditingArea(null);
          setFormData({ pincode: "", area_name: "" });
          setIsModalOpen(true);
        }}
        className="absolute bottom-10 right-8 w-16 h-16 bg-primary rounded-full items-center justify-center shadow-2xl shadow-primary/40 border-4 border-background"
      >
        <Ionicons name="add" size={32} color="black" />
      </TouchableOpacity>

      {/* ADD/EDIT MODAL */}
      <Modal visible={isModalOpen} transparent animationType="slide">
        <TouchableOpacity
          className="flex-1 bg-black/90 justify-end"
          activeOpacity={1}
          onPress={() => setIsModalOpen(false)}
        >
          <TouchableOpacity
            className="bg-card border-t border-slate-700 rounded-t-3xl p-8"
            activeOpacity={1}
            onPress={() => {}}
          >
            <View className="w-10 h-1 bg-slate-600 rounded-full self-center mb-6" />

            <View className="mb-8">
              <Text className="text-white text-2xl font-black uppercase tracking-tight">
                {editingArea ? "Edit Location" : "Add New Location"}
              </Text>
              <Text className="text-text-secondary text-[10px] font-black uppercase tracking-widest mt-1">
                Manage service coverage
              </Text>
            </View>

            <View className="space-y-4 mb-10">
              <View className="bg-card-light p-4 rounded-3xl border border-slate-700">
                <Text className="text-text-secondary text-[8px] font-black uppercase tracking-widest mb-2 ml-1">
                  Pincode
                </Text>
                <TextInput
                  placeholder="e.g. 641001"
                  placeholderTextColor={COLORS.textSecondary}
                  value={formData.pincode}
                  keyboardType="numeric"
                  onChangeText={(val) =>
                    setFormData((prev) => ({ ...prev, pincode: val }))
                  }
                  className="text-white font-black text-lg p-0"
                />
              </View>

              <View className="bg-card-light p-4 mt-3 rounded-3xl border border-slate-700">
                <Text className="text-text-secondary text-[8px] font-black uppercase tracking-widest mb-2 ml-1">
                  Area Name
                </Text>
                <TextInput
                  placeholder="e.g. Gandhipuram, Coimbatore"
                  placeholderTextColor={COLORS.textSecondary}
                  value={formData.area_name}
                  onChangeText={(val) =>
                    setFormData((prev) => ({ ...prev, area_name: val }))
                  }
                  className="text-white font-black text-lg p-0"
                />
              </View>
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setIsModalOpen(false)}
                className="flex-1 h-14 bg-card-light rounded-2xl items-center justify-center border border-slate-700"
              >
                <Text className="text-text-secondary font-black uppercase tracking-widest text-[10px]">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmit}
                className="flex-[2] h-14 bg-primary rounded-2xl items-center justify-center shadow-2xl shadow-primary/5"
              >
                <Text className="text-black font-black uppercase tracking-widest text-[10px]">
                  {editingArea ? "Save Changes" : "Confirm Area"}
                </Text>
              </TouchableOpacity>
            </View>
            <View className="h-10" />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
