import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import * as ImagePicker from 'expo-image-picker';
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
  Image
} from "react-native";
import { apiService } from "../../services/api";

const ICON_OPTIONS = [
  { name: "Car", icon: "car-outline" },
  { name: "Wrench", icon: "construct-outline" },
  { name: "Settings", icon: "settings-outline" },
  { name: "ShieldCheck", icon: "shield-checkmark-outline" },
];

export default function AddCarService() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [form, setForm] = useState({
    name: "",
    price: "",
    description: "",
    bigDescription: "",
    icon: "Car",
    image: "",
    supportedBrands: [""],
    sparePartsIncluded: [""],
    status: "active",
  });

  useEffect(() => {
    if (id) {
      setIsEditing(true);
      fetchService();
    }
  }, [id]);

  const fetchService = async () => {
    try {
      const data = await apiService.getServiceById(id as string);
      setForm({
        name: data.name || "",
        price: data.price?.toString() || "",
        description: data.description || "",
        bigDescription: data.bigDescription || "",
        icon: data.icon || "Car",
        image: data.image || "",
        supportedBrands: data.supportedBrands?.length ? data.supportedBrands : [""],
        sparePartsIncluded: data.sparePartsIncluded?.length ? data.sparePartsIncluded : [""],
        status: data.status || "active",
      });
    } catch (err) {
      Alert.alert("Error", "Service not found");
      router.back();
    }
  };

  const handleArrayChange = (index: number, field: 'supportedBrands' | 'sparePartsIncluded', value: string) => {
    const updated = [...form[field]];
    updated[index] = value;
    setForm({ ...form, [field]: updated });
  };

  const addField = (field: 'supportedBrands' | 'sparePartsIncluded') => {
    setForm({ ...form, [field]: [...form[field], ""] });
  };

  const removeField = (field: 'supportedBrands' | 'sparePartsIncluded', index: number) => {
    const updated = [...form[field]];
    updated.splice(index, 1);
    setForm({ ...form, [field]: updated.length ? updated : [""] });
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setForm({ ...form, image: `data:image/jpeg;base64,${result.assets[0].base64}` });
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.price) {
      Alert.alert("Validation", "Name & Price are required");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        supportedBrands: form.supportedBrands.filter(b => b.trim()),
        sparePartsIncluded: form.sparePartsIncluded.filter(p => p.trim())
      };

      if (isEditing) {
        await apiService.updateService(id as string, payload);
        Alert.alert("Success", "Service updated");
      } else {
        await apiService.createService(payload);
        Alert.alert("Success", "Service added");
      }
      router.back();
    } catch (err) {
      Alert.alert("Error", "Failed to save service");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="flex-1 p-6" contentContainerStyle={{ paddingBottom: 100 }}>
      

          {/* FORM */}
          <View className="gap-6 bg-slate-900 border border-white/5 p-8 rounded-[40px]">
            {/* Image Section */}
            <TouchableOpacity 
              onPress={pickImage}
              className="w-full h-48 bg-slate-950 rounded-3xl border border-dashed border-white/10 items-center justify-center overflow-hidden"
            >
               {form.image ? (
                 <Image source={{ uri: form.image }} className="w-full h-full" />
               ) : (
                 <View className="items-center">
                    <Ionicons name="image-outline" size={32} color="#475569" />
                    <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2">Upload Visual</Text>
                 </View>
               )}
            </TouchableOpacity>

            <View className="gap-2">
               <Text className="text-slate-500 text-[8px] font-black uppercase tracking-[3px] ml-2">Service Identity</Text>
               <TextInput 
                  placeholder="e.g. Engine Detail Wash"
                  placeholderTextColor="#475569"
                  value={form.name}
                  onChangeText={(v) => setForm({...form, name: v})}
                  className="w-full bg-slate-950 rounded-2xl border border-white/5 px-6 py-4 text-white font-black"
               />
            </View>

            <View className="flex-row gap-4">
              <View className="flex-1 gap-2">
                 <Text className="text-slate-500 text-[8px] font-black uppercase tracking-[3px] ml-2">Rate (₹)</Text>
                 <TextInput 
                    placeholder="999"
                    placeholderTextColor="#475569"
                    keyboardType="numeric"
                    value={form.price}
                    onChangeText={(v) => setForm({...form, price: v})}
                    className="w-full bg-slate-950 rounded-2xl border border-white/5 px-6 py-4 text-white font-black"
                 />
              </View>
              <View className="flex-1 gap-2">
                 <Text className="text-slate-500 text-[8px] font-black uppercase tracking-[3px] ml-2">Icon Theme</Text>
                 <View className="flex-row gap-1 bg-slate-950 p-2 rounded-2xl border border-white/5">
                   {ICON_OPTIONS.map((opt) => (
                      <TouchableOpacity 
                        key={opt.name}
                        onPress={() => setForm({...form, icon: opt.name})}
                        className={`flex-1 h-12 rounded-xl items-center justify-center ${form.icon === opt.name ? 'bg-sky-500 border-sky-400' : 'bg-slate-900 border-white/5'}`}
                      >
                         <Ionicons name={opt.icon as any} size={18} color={form.icon === opt.name ? 'black' : '#475569'} />
                      </TouchableOpacity>
                   ))}
                 </View>
              </View>
            </View>

            <View className="gap-2">
               <Text className="text-slate-500 text-[8px] font-black uppercase tracking-[3px] ml-2">Elevator Pitch</Text>
               <TextInput 
                  placeholder="Quick summary..."
                  placeholderTextColor="#475569"
                  value={form.description}
                  onChangeText={(v) => setForm({...form, description: v})}
                  className="w-full bg-slate-950 rounded-2xl border border-white/5 px-6 py-4 text-white font-bold text-xs"
               />
            </View>

            <View className="gap-2">
               <Text className="text-slate-500 text-[8px] font-black uppercase tracking-[3px] ml-2">Comprehensive Details</Text>
               <TextInput 
                  placeholder="Detailed breakdown..."
                  placeholderTextColor="#475569"
                  multiline
                  numberOfLines={4}
                  value={form.bigDescription}
                  onChangeText={(v) => setForm({...form, bigDescription: v})}
                  className="w-full bg-slate-950 rounded-2xl border border-white/5 px-6 py-4 text-white font-bold text-xs"
                  style={{ textAlignVertical: 'top' }}
               />
            </View>

            {/* Arrays */}
            <View className="my-2 h-px bg-white/5" />

            {/* Brands */}
            <View className="gap-4">
              <View className="flex-row justify-between items-center px-2">
                 <Text className="text-slate-500 text-[8px] font-black uppercase tracking-[3px]">Car Brands</Text>
                 <TouchableOpacity onPress={() => addField('supportedBrands')} className="p-2 bg-white rounded-xl">
                    <Ionicons name="add" size={16} color="black" />
                 </TouchableOpacity>
              </View>
              {form.supportedBrands.map((b, i) => (
                 <View key={i} className="flex-row items-center gap-3">
                    <TextInput 
                       placeholder="e.g. BMW"
                       placeholderTextColor="#475569"
                       value={b}
                       onChangeText={(v) => handleArrayChange(i, 'supportedBrands', v)}
                       className="flex-1 bg-slate-950 rounded-2xl border border-white/5 px-6 py-4 text-white font-bold text-xs"
                    />
                    {form.supportedBrands.length > 1 && (
                       <TouchableOpacity onPress={() => removeField('supportedBrands', i)} className="w-12 h-12 bg-rose-500/10 rounded-2xl items-center justify-center border border-rose-500/10">
                          <Ionicons name="close" size={18} color="#ef4444" />
                       </TouchableOpacity>
                    )}
                 </View>
              ))}
            </View>

            {/* Spare Parts */}
            <View className="gap-4">
              <View className="flex-row justify-between items-center px-2">
                 <Text className="text-slate-500 text-[8px] font-black uppercase tracking-[3px]">Included Spares</Text>
                 <TouchableOpacity onPress={() => addField('sparePartsIncluded')} className="p-2 bg-white rounded-xl">
                    <Ionicons name="add" size={16} color="black" />
                 </TouchableOpacity>
              </View>
              {form.sparePartsIncluded.map((p, i) => (
                 <View key={i} className="flex-row items-center gap-3">
                    <TextInput 
                       placeholder="e.g. Air Filter"
                       placeholderTextColor="#475569"
                       value={p}
                       onChangeText={(v) => handleArrayChange(i, 'sparePartsIncluded', v)}
                       className="flex-1 bg-slate-950 rounded-2xl border border-white/5 px-6 py-4 text-white font-bold text-xs"
                    />
                    {form.sparePartsIncluded.length > 1 && (
                       <TouchableOpacity onPress={() => removeField('sparePartsIncluded', i)} className="w-12 h-12 bg-rose-500/10 rounded-2xl items-center justify-center border border-rose-500/10">
                          <Ionicons name="close" size={18} color="#ef4444" />
                       </TouchableOpacity>
                    )}
                 </View>
              ))}
            </View>

            <TouchableOpacity 
               disabled={loading}
               onPress={handleSubmit}
               className="bg-sky-500 rounded-3xl py-6 mt-8 items-center justify-center shadow-2xl shadow-sky-900"
            >
               {loading ? (
                  <ActivityIndicator color="black" />
               ) : (
                  <Text className="text-black font-black text-xs uppercase tracking-widest">
                     {isEditing ? "Apply Adjustments" : "Establish Service"}
                  </Text>
               )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
