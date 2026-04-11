import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { apiService } from "../../services/api";
import { COLORS } from "../../theme/colors";

export default function PricingList() {
  const router = useRouter();
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const fetchPackages = async () => {
    try {
      const data = await apiService.getPricingPackages();
      setPackages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleDelete = (id: any) => {
    Alert.alert(
      "Delete Package",
      "Are you sure you want to remove this pricing package?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await apiService.deletePricingPackage(id);
              fetchPackages();
            } catch (err) {
              Alert.alert("Error", "Delete failed");
            }
          },
        },
      ],
    );
  };

  const filtered = packages.filter((p) =>
    p.title?.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text className="text-text-secondary text-[10px] font-black uppercase tracking-widest mt-4">
          Loading Packages...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen
        options={{
          title: "Pricing",
          headerShown: true,
          headerStyle: { backgroundColor: COLORS.background },
          headerTintColor: COLORS.white,
          headerTitleStyle: { fontWeight: "900", fontSize: 16 },
        }}
      />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: 1, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchPackages}
            tintColor={COLORS.primary}
          />
        }
        ListHeaderComponent={() => (
          <View className="p-6">

            {/* SEARCH BAR */}
            <View className="mb-6">
              <View className="bg-card border border-slate-700 flex-row items-center px-4 rounded-3xl h-14">
                <Ionicons
                  name="search"
                  size={18}
                  color={COLORS.textSecondary}
                />
                <TextInput
                  placeholder="Search packages..."
                  placeholderTextColor={COLORS.textSecondary}
                  value={search}
                  onChangeText={setSearch}
                  className="flex-1 ml-3 text-white font-bold text-sm"
                />
              </View>
            </View>
          </View>
        )}
        renderItem={({ item: pkg }) => (
          <View className="bg-card border border-slate-700 rounded-3xl p-4 mb-4 shadow-sm mx-6">
            {/* Accent Glow */}
            <View className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full" />

            <View className="flex-row justify-between items-start mb-4">
              <View className="flex-1">
                <Text className="text-white font-black text-xl tracking-tight mb-1">
                  {pkg.title}
                </Text>
                <Text className="text-primary font-black text-lg">
                  ₹{Number(pkg.price || 0).toLocaleString()}
                </Text>
              </View>
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/(adminPages)/add-pricing",
                      params: { id: pkg.id },
                    } as any)
                  }
                  className="w-10 h-10 rounded-2xl bg-slate-800 items-center justify-center border border-[#0ea5e9]"
                >
                  <Ionicons name="pencil" size={16} color="#0ea5e9" />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => handleDelete(pkg.id)}
                  className="w-10 h-10 rounded-2xl bg-rose-500/20 items-center justify-center border border-rose-500/30"
                >
                  <Ionicons
                    name="trash-outline"
                    size={16}
                    color="#f43f5e"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View className="h-px bg-slate-700 mb-4" />

            <View className="gap-2">
              {pkg.features?.slice(0, 4).map((f: string, i: number) => (
                <View key={i} className="flex-row items-center gap-2">
                  <Ionicons
                    name="checkmark-circle"
                    size={12}
                    color={COLORS.primary}
                  />
                  <Text className="text-text-secondary text-[10px] font-bold uppercase tracking-widest">
                    {f}
                  </Text>
                </View>
              ))}
              {pkg.features?.length > 4 && (
                <Text className="text-slate-400 text-[10px] font-black uppercase ml-5">
                  +{pkg.features.length - 4} More Benefits
                </Text>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <View className="mt-20 items-center opacity-30 mx-6">
            <Ionicons
              name="pricetags-outline"
              size={48}
              color={COLORS.textSecondary}
            />
            <Text className="text-text-secondary font-black text-xs mt-6 uppercase tracking-widest text-center">
              No Packages Found
            </Text>
          </View>
        )}
      />

      {/* FLOATING ADD BUTTON */}
      <TouchableOpacity
        onPress={() => router.push("/(adminPages)/add-pricing" as any)}
        className="absolute bottom-10 right-8 w-16 h-16 bg-primary rounded-full items-center justify-center shadow-2xl shadow-primary/40 border-4 border-background"
      >
        <Ionicons name="add" size={32} color="black" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
