import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { apiService } from "../../services/api";
import { COLORS } from "../../theme/colors";

export default function AddPricing() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [features, setFeatures] = useState([""]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (id) {
      setIsEditing(true);
      fetchPackage();
    }
  }, [id]);

  const fetchPackage = async () => {
    try {
      const data = await apiService.getPricingPackageById(id as string);
      setTitle(data.title || "");
      setPrice(data.price?.toString() || "");
      setFeatures(data.features?.length ? data.features : [""]);
    } catch (err) {
      Alert.alert("Error", "Package not found");
      router.back();
    }
  };

  const handleFeatureChange = (index: number, value: string) => {
    const updated = [...features];
    updated[index] = value;
    setFeatures(updated);
  };

  const addFeatureField = () => setFeatures([...features, ""]);

  const removeFeatureField = (index: number) => {
    const updated = features.filter((_, i) => i !== index);
    setFeatures(updated.length ? updated : [""]);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !price) {
      Alert.alert("Validation", "Title & Price are required");
      return;
    }

    const cleanFeatures = features.map((f) => f.trim()).filter((f) => f !== "");
    if (cleanFeatures.length === 0) {
      Alert.alert("Validation", "Add at least one feature");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: title.trim(),
        price: Number(price),
        features: cleanFeatures,
      };

      if (isEditing) {
        await apiService.updatePricingPackage(id as string, payload);
        Alert.alert("Success", "Package updated successfully");
      } else {
        await apiService.createPricingPackage(payload);
        Alert.alert("Success", "Package added successfully");
      }
      router.back();
    } catch (err) {
      Alert.alert("Error", "Failed to save pricing package");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen
        options={{
          title: isEditing ? "Update Package" : "Add Package",
          headerShown: true,
          headerStyle: { backgroundColor: COLORS.background },
          headerTintColor: COLORS.white,
          headerTitleStyle: { fontWeight: "900", fontSize: 16 },
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <View className="p-6">
            <View className="mb-8">
              <Text className="text-text-secondary text-[9px] font-black uppercase tracking-widest">
                Sales Management
              </Text>
              <Text className="text-white text-lg font-black tracking-tighter uppercase mt-1">
                {isEditing ? "Update Package" : "Add Package"}
              </Text>
            </View>

            {/* FORM */}
            <View className="bg-card border border-slate-700 p-8 rounded-3xl">
              <View className="gap-6">
                <View className="gap-2">
                  <Text className="text-text-secondary text-[8px] font-black uppercase tracking-widest ml-2">
                    Package Title
                  </Text>
                  <TextInput
                    placeholder="e.g. Standard Wash"
                    placeholderTextColor={COLORS.textSecondary}
                    value={title}
                    onChangeText={setTitle}
                    className="w-full bg-card-light rounded-3xl border border-slate-700 px-6 py-4 text-white font-black"
                  />
                </View>

                <View className="gap-2">
                  <Text className="text-text-secondary text-[8px] font-black uppercase tracking-widest ml-2">
                    Price Value (₹)
                  </Text>
                  <TextInput
                    placeholder="2999"
                    placeholderTextColor={COLORS.textSecondary}
                    keyboardType="numeric"
                    value={price}
                    onChangeText={setPrice}
                    className="w-full bg-card-light rounded-3xl border border-slate-700 px-6 py-4 text-white font-black"
                  />
                </View>

                <View className="my-2 h-px bg-slate-700" />

                <View className="flex-row justify-between items-center px-2">
                  <Text className="text-text-secondary text-[8px] font-black uppercase tracking-widest">
                    Features List
                  </Text>
                  <TouchableOpacity
                    onPress={addFeatureField}
                    className="p-2 bg-primary rounded-xl"
                  >
                    <Ionicons name="add" size={16} color="black" />
                  </TouchableOpacity>
                </View>

                {features.map((f, i) => (
                  <View key={i} className="flex-row items-center gap-3">
                    <TextInput
                      placeholder={`Feature ${i + 1}`}
                      placeholderTextColor={COLORS.textSecondary}
                      value={f}
                      onChangeText={(v) => handleFeatureChange(i, v)}
                      className="flex-1 bg-card-light rounded-3xl border border-slate-700 px-6 py-4 text-white font-bold text-sm"
                    />
                    {features.length > 1 && (
                      <TouchableOpacity
                        onPress={() => removeFeatureField(i)}
                        className="w-12 h-12 bg-card-light rounded-2xl items-center justify-center border border-slate-700"
                      >
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color={COLORS.primary}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}

                <TouchableOpacity
                  disabled={loading}
                  onPress={handleSubmit}
                  className="bg-primary rounded-3xl py-6 mt-8 items-center justify-center shadow-2xl shadow-primary/5"
                >
                  {loading ? (
                    <ActivityIndicator color="black" />
                  ) : (
                    <Text className="text-black font-black text-[10px] uppercase tracking-widest">
                      {isEditing ? "Commit Updates" : "Register Package"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
