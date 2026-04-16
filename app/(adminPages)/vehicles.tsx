import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { apiService } from "../../services/api";
import { COLORS } from "../../theme/colors";

const StatCard = ({ title, value, icon, color }: any) => (
  <View className="bg-card border border-slate-700 rounded-3xl p-5 w-[48%] mb-4 shadow-sm">
    <View className="flex-row justify-between items-start mb-2">
      <View
        style={{ backgroundColor: color + "20" }}
        className="p-2 rounded-xl"
      >
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text className="text-white font-black text-lg">{value}</Text>
    </View>
    <Text className="text-text-secondary text-[9px] font-black uppercase tracking-widest">
      {title}
    </Text>
  </View>
);

export default function AdminVehicles() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);

  const fetchVehicles = async () => {
    try {
      const data = await apiService.getVehicles();
      setVehicles(data);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to load vehicles");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchVehicles();
  };

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const matchesSearch =
        (v.title || v.name || "")
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        (v.brand || "").toLowerCase().includes(search.toLowerCase()) ||
        (v.model || "").toLowerCase().includes(search.toLowerCase());
      const matchesStatus = filterStatus === "all" || v.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [vehicles, search, filterStatus]);

  const handleDelete = async (id: number) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to permanently delete this vehicle listing?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // await apiService.deleteVehicle(id); // If delete method exists
              Alert.alert("Success", "Listing removed (Simulation)");
              setVehicles((prev) => prev.filter((v) => v.id !== id));
            } catch (err) {
              Alert.alert("Error", "Failed to delete");
            }
          },
        },
      ],
    );
  };

  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case "published":
        return {
          bg: "bg-emerald-500/10",
          text: "text-emerald-500",
          border: "border-emerald-500/20",
        };
      case "draft":
        return {
          bg: "bg-amber-500/10",
          text: "text-amber-500",
          border: "border-amber-500/20",
        };
      case "sold":
        return {
          bg: "bg-red-500/10",
          text: "text-red-500",
          border: "border-red-500/20",
        };
      default:
        return {
          bg: "bg-slate-800",
          text: "text-slate-400",
          border: "border-slate-700",
        };
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text className="text-text-secondary font-black text-[10px] uppercase tracking-widest mt-4">
          Fetching Inventory...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="p-4 border-b border-white/5">
        {/* STATS */}
        <View className="flex-row flex-wrap justify-between">
          <StatCard
            title="Total Units"
            value={vehicles.length}
            icon="car"
            color="#3b82f6"
          />
          <StatCard
            title="Published"
            value={vehicles.filter((v) => v.status === "published").length}
            icon="checkmark-circle"
            color="#10b981"
          />
          <StatCard
            title="Drafts"
            value={vehicles.filter((v) => v.status === "draft").length}
            icon="create"
            color="#f59e0b"
          />
          <StatCard
            title="Sold"
            value={vehicles.filter((v) => v.status === "sold").length}
            icon="cart"
            color="#6366f1"
          />
        </View>

        {/* FILTERS */}
        <View className="flex-row gap-2 mt-2">
          <View className="flex-1 bg-card border border-slate-700 rounded-2xl flex-row items-center px-4 h-12">
            <Ionicons name="search" size={18} color={COLORS.textMuted} />
            <TextInput
              placeholder="Search title, brand..."
              placeholderTextColor={COLORS.textMuted}
              value={search}
              onChangeText={setSearch}
              className="flex-1 ml-2 text-white font-bold text-xs"
            />
          </View>
          <TouchableOpacity
            onPress={() => {
              const next =
                filterStatus === "all"
                  ? "published"
                  : filterStatus === "published"
                    ? "draft"
                    : filterStatus === "draft"
                      ? "sold"
                      : "all";
              setFilterStatus(next);
            }}
            className={`w-12 h-12 rounded-2xl items-center justify-center border ${filterStatus === "all" ? "bg-card border-slate-700" : "bg-primary/10 border-primary"}`}
          >
            <Ionicons
              name="filter"
              size={20}
              color={filterStatus === "all" ? COLORS.textMuted : COLORS.primary}
            />
            {filterStatus !== "all" && (
              <View className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1 p-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {filteredVehicles.length === 0 ? (
          <View className="py-20 items-center justify-center">
            <View className="w-20 h-20 bg-card rounded-full items-center justify-center mb-4 border border-slate-700 border-dashed">
              <Ionicons name="car-outline" size={40} color={COLORS.textMuted} />
            </View>
            <Text className="text-white font-black text-xs uppercase">
              No vehicles found
            </Text>
            <Text className="text-text-secondary text-[10px] uppercase mt-2">
              Try adjusting your filters
            </Text>
          </View>
        ) : (
          filteredVehicles.map((vehicle, i) => {
            const status = getStatusStyle(vehicle.status);
            const images = vehicle.images
              ? typeof vehicle.images === "string"
                ? JSON.parse(vehicle.images)
                : vehicle.images
              : null;

            return (
              <TouchableOpacity
                key={vehicle.id}
                className="bg-card border border-slate-700 rounded-3xl p-4 mb-4 shadow-sm"
                onPress={() => setSelectedVehicle(vehicle)}
              >
                <View className="flex-row gap-4">
                  <View className="w-24 h-24 rounded-2xl bg-slate-800 overflow-hidden border border-slate-700">
                    {images?.front ? (
                      <Image
                        source={{ uri: images.front }}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <View className="flex-1 items-center justify-center">
                        <Ionicons
                          name={vehicle.type === "Car" ? "car" : "bicycle"}
                          size={40}
                          color={COLORS.textMuted}
                        />
                      </View>
                    )}
                  </View>

                  <View className="flex-1">
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1">
                        <Text
                          className="text-white font-black text-sm tracking-tighter"
                          numberOfLines={1}
                        >
                          {vehicle.title || vehicle.name}
                        </Text>
                        <Text className="text-primary text-[9px] font-black uppercase tracking-widest mt-0.5">
                          {vehicle.brand} • {vehicle.yom || vehicle.year} Model
                        </Text>
                      </View>
                      <View
                        className={`${status.bg} border ${status.border} px-2 py-1 rounded-md`}
                      >
                        <Text
                          className={`${status.text} font-black text-[7px] uppercase`}
                        >
                          {vehicle.status || "Draft"}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row flex-wrap gap-2 mt-2">
                      <View className="bg-slate-950 px-2 py-1 rounded-md flex-row items-center gap-1">
                        <Ionicons
                          name="speedometer-outline"
                          size={10}
                          color={COLORS.primary}
                        />
                        <Text className="text-text-secondary font-bold text-[10px]">
                          {vehicle.engine_cc || "---"} CC
                        </Text>
                      </View>
                      <View className="bg-slate-950 px-2 py-1 rounded-md flex-row items-center gap-1">
                        <Ionicons
                          name="navigate-outline"
                          size={10}
                          color={COLORS.primary}
                        />
                        <Text className="text-text-secondary font-bold text-[10px]">
                          {vehicle.km_driven || "---"} KM
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row justify-between items-center mt-3">
                      <View>
                        <Text className="text-white font-black text-sm">
                          ₹
                          {(
                            Number(vehicle.expected_price || vehicle.price) +
                            2000
                          ).toLocaleString()}
                        </Text>
                      </View>
                      <View className="flex-row gap-2">
                        <TouchableOpacity
                          onPress={() =>
                            router.push(
                              `/(adminPages)/add-vehicle?id=${vehicle.id}` as any,
                            )
                          }
                          className="p-2 bg-slate-800 rounded-lg"
                        >
                          <Ionicons
                            name="create-outline"
                            size={16}
                            color={COLORS.textMuted}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDelete(vehicle.id)}
                          className="p-2 bg-slate-800 rounded-lg"
                        >
                          <Ionicons
                            name="trash-outline"
                            size={16}
                            color="#ef4444"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
        <View className="h-20" />
      </ScrollView>

      {/* DETAIL MODAL */}
      <Modal visible={!!selectedVehicle} transparent animationType="slide">
        <View className="flex-1 bg-black/90 justify-end">
          <View className="bg-card rounded-t-[40px] p-6 max-h-[90%] border-t border-slate-700">
            <View className="w-12 h-1 bg-slate-700 rounded-full self-center mb-6" />

            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedVehicle && (
                <>
                  <View className="flex-row justify-between items-start mb-6">
                    <View>
                      <Text className="text-white font-black text-2xl tracking-tighter">
                        {selectedVehicle.title || selectedVehicle.name}
                      </Text>
                      <Text className="text-primary font-black text-xs uppercase tracking-widest mt-1">
                        {selectedVehicle.brand} • {selectedVehicle.model}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setSelectedVehicle(null)}
                      className="p-2 bg-slate-800 rounded-full"
                    >
                      <Ionicons name="close" size={24} color="white" />
                    </TouchableOpacity>
                  </View>

                  {/* Image Carousel Simulation */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="mb-8"
                  >
                    {selectedVehicle.images ? (
                      Object.values(
                        typeof selectedVehicle.images === "string"
                          ? JSON.parse(selectedVehicle.images)
                          : selectedVehicle.images,
                      ).map(
                        (url: any, i: number) =>
                          url && (
                            <Image
                              key={i}
                              source={{ uri: url }}
                              className="w-72 h-48 rounded-3xl mr-4 bg-slate-800"
                            />
                          ),
                      )
                    ) : (
                      <View className="w-full h-48 rounded-3xl bg-slate-800 items-center justify-center">
                        <Ionicons
                          name="images-outline"
                          size={48}
                          color={COLORS.textMuted}
                        />
                      </View>
                    )}
                  </ScrollView>

                  {/* SPECS */}
                  <Text className="text-white font-black text-[10px] uppercase tracking-widest mb-4 opacity-40">
                    Core Specifications
                  </Text>
                  <View className="flex-row flex-wrap justify-between mb-8">
                    {[
                      {
                        label: "Engine",
                        value: `${selectedVehicle.engine_cc || "---"} CC`,
                        icon: "settings-outline",
                      },
                      {
                        label: "Fuel",
                        value: selectedVehicle.fuel_type || "Petrol",
                        icon: "flask-outline",
                      },
                      {
                        label: "Mileage",
                        value: `${selectedVehicle.mileage || "---"} Kmpl`,
                        icon: "leaf-outline",
                      },
                      {
                        label: "Driven",
                        value: `${selectedVehicle.km_driven || "---"} KM`,
                        icon: "trail-sign-outline",
                      },
                      {
                        label: "Owners",
                        value: `${selectedVehicle.owners || "---"} Owner`,
                        icon: "person-outline",
                      },
                      {
                        label: "Year",
                        value: selectedVehicle.yom || selectedVehicle.year,
                        icon: "calendar-outline",
                      },
                    ].map((spec, i) => (
                      <View
                        key={i}
                        className="w-[31%] bg-slate-950 p-3 rounded-2xl border border-slate-700 mb-3"
                      >
                        <Ionicons
                          name={spec.icon as any}
                          size={14}
                          color={COLORS.primary}
                        />
                        <Text className="text-text-secondary text-[7px] font-black uppercase mt-2">
                          {spec.label}
                        </Text>
                        <Text className="text-white font-black text-[10px] mt-0.5">
                          {spec.value}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* DESCR */}
                  <Text className="text-white font-black text-[10px] uppercase tracking-widest mb-2 opacity-40">
                    Description
                  </Text>
                  <View className="bg-slate-950 p-5 rounded-3xl border border-slate-700 mb-8">
                    <Text className="text-text-secondary text-xs leading-5 font-medium">
                      {selectedVehicle.description ||
                        "No detailed description provided for this vehicle listing. Please contact the administrator for more information."}
                    </Text>
                  </View>

                  {/* FOOTER ACTIONS */}
                  <View className="flex-row gap-3 mb-10">
                    <TouchableOpacity
                      className="flex-1 bg-primary p-5 rounded-3xl items-center"
                      onPress={() => {
                        setSelectedVehicle(null);
                        router.push(
                          `/(adminPages)/add-vehicle?id=${selectedVehicle.id}` as any,
                        );
                      }}
                    >
                      <Text
                        style={{ color: COLORS.background }}
                        className="font-black uppercase tracking-widest text-[10px]"
                      >
                        Edit Listing
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="flex-1 bg-slate-800 p-5 rounded-3xl items-center"
                      onPress={() => setSelectedVehicle(null)}
                    >
                      <Text className="text-white font-black uppercase tracking-widest text-[10px]">
                        Close
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* FLOATING ACTION BUTTON */}
      <TouchableOpacity
        onPress={() => router.push("/(adminPages)/add-vehicle" as any)}
        className="absolute bottom-8 right-8 w-14 h-14 bg-primary rounded-full items-center justify-center shadow-2xl"
        style={{ elevation: 10 }}
      >
        <Ionicons name="add" size={32} color={COLORS.textPrimary} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
