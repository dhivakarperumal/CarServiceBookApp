import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
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
  View
} from "react-native";
import { apiService } from "../../services/api";

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

    const cleanFeatures = features.map(f => f.trim()).filter(f => f !== "");
    if (cleanFeatures.length === 0) {
      Alert.alert("Validation", "Add at least one feature");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: title.trim(),
        price: Number(price),
        features: cleanFeatures
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
    <SafeAreaView className="flex-1 bg-slate-950">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1 p-6" contentContainerStyle={{ paddingBottom: 100 }}>
          {/* HEADER */}
          <View className="flex-row items-center justify-between mt-12 mb-10">
             <TouchableOpacity 
               onPress={() => router.back()}
               className="w-12 h-12 bg-white/5 rounded-2xl items-center justify-center border border-white/5"
             >
                <Ionicons name="arrow-back" size={24} color="white" />
             </TouchableOpacity>
             <Text className="text-white font-black text-2xl uppercase tracking-tighter">
               {isEditing ? "Update Package" : "Add Package"}
             </Text>
             <View className="w-12" />
          </View>

          {/* FORM */}
          <View className="gap-6 bg-slate-900 border border-white/5 p-8 rounded-[40px]">
            <View className="gap-2">
               <Text className="text-slate-500 text-[8px] font-black uppercase tracking-[3px] ml-2">Package Title</Text>
               <TextInput 
                  placeholder="e.g. Standard Wash"
                  placeholderTextColor="#475569"
                  value={title}
                  onChangeText={setTitle}
                  className="w-full bg-slate-950 rounded-2xl border border-white/5 px-6 py-4 text-white font-black"
               />
            </View>

            <View className="gap-2">
               <Text className="text-slate-500 text-[8px] font-black uppercase tracking-[3px] ml-2">Price Value (₹)</Text>
               <TextInput 
                  placeholder="2999"
                  placeholderTextColor="#475569"
                  keyboardType="numeric"
                  value={price}
                  onChangeText={setPrice}
                  className="w-full bg-slate-950 rounded-2xl border border-white/5 px-6 py-4 text-white font-black"
               />
            </View>

            <View className="my-2 h-px bg-white/5" />

            <View className="flex-row justify-between items-center px-2">
               <Text className="text-slate-500 text-[8px] font-black uppercase tracking-[3px]">Features List</Text>
               <TouchableOpacity 
                  onPress={addFeatureField}
                  className="p-2 bg-white rounded-xl"
               >
                  <Ionicons name="add" size={16} color="black" />
               </TouchableOpacity>
            </View>

            {features.map((f, i) => (
               <View key={i} className="flex-row items-center gap-3">
                  <TextInput 
                     placeholder={`Feature ${i + 1}`}
                     placeholderTextColor="#475569"
                     value={f}
                     onChangeText={(v) => handleFeatureChange(i, v)}
                     className="flex-1 bg-slate-950 rounded-2xl border border-white/5 px-6 py-4 text-white font-bold text-xs"
                  />
                  {features.length > 1 && (
                     <TouchableOpacity 
                        onPress={() => removeFeatureField(i)}
                        className="w-12 h-12 bg-rose-500/10 rounded-2xl items-center justify-center border border-rose-500/10"
                     >
                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                     </TouchableOpacity>
                  )}
               </View>
            ))}

            <TouchableOpacity 
               disabled={loading}
               onPress={handleSubmit}
               className="bg-white rounded-3xl py-6 mt-8 items-center justify-center shadow-2xl shadow-sky-500/10"
            >
               {loading ? (
                  <ActivityIndicator color="black" />
               ) : (
                  <Text className="text-black font-black text-xs uppercase tracking-widest">
                     {isEditing ? "Commit Updates" : "Register Package"}
                  </Text>
               )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
