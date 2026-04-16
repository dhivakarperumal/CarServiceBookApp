import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../services/api";

export default function AddServiceParts() {
  const router = useRouter();
  const { serviceId } = useLocalSearchParams();
  const { user: userProfile } = useAuth();

  const [services, setServices] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [parts, setParts] = useState([{ partName: "", qty: "1", price: "0" }]);
  const [focusedPartIndex, setFocusedPartIndex] = useState<number | null>(null);
  const [showProductList, setShowProductList] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, [serviceId]);

  const loadInitialData = async () => {
    try {
      setFetching(true);
      const [prodRes, servRes] = await Promise.all([
        api.get("/products"),
        api.get("/all-services"),
      ]);
      setProducts(prodRes.data || []);
      setServices(servRes.data || []);

      if (serviceId) {
        const found = servRes.data.find(
          (s: any) => s.id.toString() === serviceId.toString(),
        );
        if (found) {
          setSelectedService(found);
          // Fetch full details including parts
          const detailRes = await api.get(`/all-services/${serviceId}`);
          const existingParts = detailRes.data?.parts || [];
          if (existingParts.length > 0) {
            setParts(
              existingParts.map((p: any) => ({
                partName: p.partName,
                qty: (p.qty || 1).toString(),
                price: (p.price || 0).toString(),
              })),
            );
          }
        }
      }
    } catch (err) {
      Alert.alert("Error", "Failed to load data");
    } finally {
      setFetching(false);
    }
  };

  const filteredServices = useMemo(() => {
    if (!search) return [];
    return services.filter((s) => {
      const text =
        `${s.bookingId || ""} ${s.name || ""} ${s.phone || ""} ${s.brand || ""} ${s.model || ""}`.toLowerCase();
      return text.includes(search.toLowerCase());
    });
  }, [services, search]);

  const handlePartChange = (i: number, field: string, value: string) => {
    const copy = [...parts];
    (copy[i] as any)[field] = value;
    setParts(copy);
  };

  const addPartRow = () => {
    setParts([...parts, { partName: "", qty: "1", price: "0" }]);
  };

  const removePartRow = (i: number) => {
    if (parts.length > 1) {
      setParts(parts.filter((_, idx) => idx !== i));
    }
  };

  const totalPartsCost = parts.reduce(
    (sum, p) => sum + Number(p.qty || 0) * Number(p.price || 0),
    0,
  );

  const handleSave = async () => {
    if (!selectedService) {
      Alert.alert("Error", "Please select a vehicle first");
      return;
    }

    const validParts = parts.filter((p) => p.partName.trim());
    if (validParts.length === 0) {
      Alert.alert("Error", "Add at least one part");
      return;
    }

    try {
      setLoading(true);
      const payloadParts = validParts.map((part) => ({
        partName: part.partName,
        qty: Number(part.qty),
        price: Number(part.price),
        status: "pending",
      }));

      await api.post(`/all-services/${selectedService.id}/parts`, {
        parts: payloadParts,
      });

      // Update service status to "Waiting for Spare"
      await api.put(`/all-services/${selectedService.id}/status`, {
        serviceStatus: "Waiting for Spare",
      });

      Alert.alert(
        "Success",
        "Parts added and status updated to 'Waiting for Spare'",
      );
      router.back();
    } catch (err) {
      Alert.alert("Error", "Failed to save parts");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* FIXED HEADER */}
      <View className="px-6 pt-8 pb-4 bg-background border-b border-slate-800">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-3 bg-slate-900/30 rounded-2xl border border-slate-700"
          >
            <Ionicons name="chevron-back" size={20} color="#64748B" />
          </TouchableOpacity>

          <View className="flex-1 min-w-0">
            <Text
              className="text-text-primary text-[17px] font-black uppercase tracking-tight"
              numberOfLines={1}
            >
              Add Spare Parts
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingBottom: 200,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* CONTENT */}
        <View className="px-6 pt-7 pb-24">
          {fetching && services.length === 0 ? (
            <View className="py-20 items-center bg-card rounded-[32px] border border-dashed border-slate-700">
              <Ionicons name="refresh-circle" size={48} color="#0EA5E9" />
              <Text className="text-slate-500 font-black text-[10px] uppercase mt-4 tracking-[2px]">
                Loading inventory...
              </Text>
            </View>
          ) : (
            <>
              {/* VEHICLE SELECTION */}
              {!selectedService ? (
                <View className="mb-6">
                  <Text className="text-[12px] font-black text-text-muted uppercase tracking-widest mb-4">
                    Search Linked Vehicle
                  </Text>
                  <View className="relative mb-4">
                    <View className="absolute left-4 top-4 z-10">
                      <Ionicons name="search" size={16} color="#64748B" />
                    </View>
                    <TextInput
                      placeholder="Booking ID / Mobile / Plate..."
                      placeholderTextColor="#64748B"
                      value={search}
                      onChangeText={setSearch}
                      className="bg-slate-900/30 rounded-2xl pl-12 pr-4 py-4 text-text-primary font-semibold text-xs border border-slate-700"
                    />
                  </View>

                  {filteredServices.length > 0 && (
                    <View className="bg-card border border-slate-700 rounded-[28px] overflow-hidden">
                      {filteredServices.map((s) => (
                        <TouchableOpacity
                          key={s.id}
                          onPress={async () => {
                            setSelectedService(s);
                            setSearch("");
                            // Load parts for manual selection too
                            try {
                              const detailRes = await api.get(
                                `/all-services/${s.id}`,
                              );
                              const existingParts = detailRes.data?.parts || [];
                              if (existingParts.length > 0) {
                                setParts(
                                  existingParts.map((p: any) => ({
                                    partName: p.partName,
                                    qty: (p.qty || 1).toString(),
                                    price: (p.price || 0).toString(),
                                  })),
                                );
                              }
                            } catch (e) {
                              console.log("Failed to load parts", e);
                            }
                          }}
                          className="p-5 border-b border-slate-700/50"
                        >
                          <Text className="text-text-primary font-black text-base mb-1">
                            {s.bookingId || `ID: ${s.id}`}
                          </Text>
                          <Text className="text-text-secondary text-sm">
                            {s.name} • {s.brand} {s.model}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              ) : (
                <View className="bg-card rounded-[28px] border border-slate-700 p-5 mb-6">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="text-[12px] font-black text-text-muted uppercase tracking-widest mb-2">
                        Selected Vehicle
                      </Text>
                      <Text className="text-text-primary font-black text-lg mb-1">
                        {selectedService.brand} {selectedService.model}
                      </Text>
                      <Text className="text-text-secondary text-sm">
                        {selectedService.vehicleNumber ||
                          selectedService.vehicle_number ||
                          "NO PLATE"}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setSelectedService(null)}
                      className="p-3 bg-slate-900/30 rounded-2xl border border-slate-700"
                    >
                      <Ionicons name="close" size={18} color="#64748B" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* PARTS LIST */}
              <Text className="text-[12px] font-black text-text-muted uppercase tracking-widest mb-4">
                Spare Parts List
              </Text>
              {parts.map((p, i) => (
                <View
                  key={i}
                  className="bg-card rounded-[28px] border border-slate-700 p-5 mb-4 overflow-visible"
                >
                  <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-[12px] font-black text-text-muted uppercase tracking-widest">
                      Part #{i + 1}
                    </Text>
                    {parts.length > 1 && (
                      <TouchableOpacity
                        onPress={() => removePartRow(i)}
                        className="p-2 bg-error/10 rounded-xl border border-error/20"
                      >
                        <Ionicons name="trash" size={14} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>

                  <View className="relative mb-4">
                    <TextInput
                      placeholder="Enter Part Name..."
                      placeholderTextColor="#64748B"
                      value={p.partName}
                      onFocus={() => {
                        setFocusedPartIndex(i);
                        setShowProductList(true);
                      }}
                      onChangeText={(t) => {
                        const copy = [...parts];
                        copy[i].partName = t;
                        const selected = products.find(
                          (prod) => prod.name.toLowerCase() === t.toLowerCase(),
                        );
                        if (selected)
                          copy[i].price = selected.offerPrice.toString();
                        setParts(copy);
                        setFocusedPartIndex(i);
                        setShowProductList(true);
                      }}
                      className="bg-slate-900/30 rounded-2xl px-4 py-4 text-text-primary font-semibold text-sm border border-slate-700"
                    />

                    {focusedPartIndex === i && showProductList && (
                      <View
                        style={{
                          position: "absolute",
                          top: 70,
                          left: 0,
                          right: 0,
                          zIndex: 999,
                          elevation: 10,
                        }}
                        className="bg-card border border-slate-700 rounded-[28px] max-h-[200px] shadow-2xl"
                      >
                        <ScrollView nestedScrollEnabled={true}>
                          {products
                            .filter(
                              (prod) =>
                                !p.partName ||
                                prod.name
                                  .toLowerCase()
                                  .includes(p.partName.toLowerCase()),
                            )
                            .slice(0, 100)
                            .map((prod, idx) => (
                              <TouchableOpacity
                                key={idx}
                                onPress={() => {
                                  const copy = [...parts];
                                  copy[i].partName = prod.name;
                                  copy[i].price = prod.offerPrice.toString();
                                  setParts(copy);
                                  setShowProductList(false);
                                  setFocusedPartIndex(null);
                                }}
                                className="p-4 border-b border-slate-700/50 flex-row justify-between items-center"
                              >
                                <View className="flex-1 mr-2">
                                  <Text className="text-text-primary font-black text-sm">
                                    {prod.name}
                                  </Text>
                                  <Text className="text-text-secondary text-[10px] uppercase font-bold mt-1">
                                    {prod.category || "General"}
                                  </Text>
                                </View>
                                <Text className="text-success font-black text-sm">
                                  ₹{prod.offerPrice}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          {p.partName &&
                            !products.some((pr) =>
                              pr.name
                                .toLowerCase()
                                .includes(p.partName.toLowerCase()),
                            ) && (
                              <View className="p-4 items-center">
                                <Text className="text-slate-500 text-xs italic font-bold">
                                  No matching products - Manual Entry
                                </Text>
                              </View>
                            )}
                        </ScrollView>
                        <TouchableOpacity
                          onPress={() => setShowProductList(false)}
                          className="p-4 bg-slate-900/30 items-center border-t border-slate-700"
                        >
                          <Text className="text-text-secondary text-[10px] font-black uppercase tracking-widest">
                            Close List
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  <View className="flex-row gap-4">
                    <View className="flex-1">
                      <Text className="text-[12px] font-black text-text-muted uppercase tracking-widest mb-2">
                        Quantity
                      </Text>
                      <TextInput
                        keyboardType="numeric"
                        value={p.qty}
                        onChangeText={(t) => handlePartChange(i, "qty", t)}
                        className="bg-slate-900/30 rounded-2xl px-4 py-4 text-text-primary font-black text-center border border-slate-700"
                      />
                    </View>
                    <View className="flex-[2]">
                      <Text className="text-[12px] font-black text-text-muted uppercase tracking-widest mb-2">
                        Price (₹)
                      </Text>
                      <View className="relative">
                        <Text className="absolute left-4 top-4 z-10 text-success font-black text-sm">
                          ₹
                        </Text>
                        <TextInput
                          keyboardType="numeric"
                          value={p.price}
                          onChangeText={(t) => handlePartChange(i, "price", t)}
                          className="bg-slate-900/30 rounded-2xl pl-8 pr-4 py-4 text-text-primary font-black border border-slate-700"
                        />
                      </View>
                    </View>
                  </View>
                </View>
              ))}

              <TouchableOpacity
                onPress={addPartRow}
                className="flex-row items-center justify-center p-5 rounded-[28px] border border-dashed border-slate-700 mb-6 bg-slate-900/20"
              >
                <Ionicons name="add-circle" size={20} color="#10B981" />
                <Text className="text-success font-black ml-2 uppercase text-xs tracking-widest">
                  Add Another Spare
                </Text>
              </TouchableOpacity>

              {/* TOTAL COST */}
              <View className="bg-card rounded-[28px] border border-slate-700 p-6 mb-6">
                <Text className="text-[12px] font-black text-text-muted uppercase tracking-widest text-center mb-2">
                  Total Parts Valuation
                </Text>
                <Text className="text-text-primary text-3xl font-black text-center">
                  ₹{totalPartsCost.toLocaleString()}
                </Text>
              </View>

              {/* SAVE BUTTON */}
              <TouchableOpacity
                onPress={handleSave}
                disabled={loading}
                className={`w-full py-4 bg-primary rounded-2xl items-center ${loading ? "opacity-50" : ""}`}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <View className="flex-row items-center gap-2">
                    <Text className="text-white text-[11px] font-black uppercase tracking-widest">
                      Confirm & Save Parts
                    </Text>
                    <Ionicons name="save" size={16} color="white" />
                  </View>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
