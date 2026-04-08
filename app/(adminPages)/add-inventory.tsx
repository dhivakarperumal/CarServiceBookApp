import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  Alert,
  Modal
} from "react-native";
import { apiService } from "../../services/api";
import { useRouter, Stack, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../theme/colors";

const AddInventoryItem = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isEditMode = Boolean(id);

  const [form, setForm] = useState({
    partName: "",
    category: "",
    vendor: "",
    stockQty: "",
    minStock: "5",
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);
  const [vendorPickerVisible, setVendorPickerVisible] = useState(false);

  const categories = [
    "Engine Parts",
    "Brake System",
    "Suspension",
    "Electrical",
    "Filters",
    "Oils & Fluids",
    "Tyres & Wheels",
    "Body Parts",
    "Accessories",
  ];

  const vendors = [
    "Bosch Auto Parts",
    "TVS Motor Spares",
    "MRF Distributors",
    "Castrol India",
    "Local Vendor",
  ];

  const fetchItem = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await apiService.api.get(`/inventory/${id}`);
      const data = response.data;
      setForm({
        partName: data.partName || "",
        category: data.category || "",
        vendor: data.vendor || "",
        stockQty: String(data.stockQty || ""),
        minStock: String(data.minStock || "5"),
      });
    } catch {
      Alert.alert("Error", "Failed to load spare part details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItem(); }, [id]);

  const handleSave = async () => {
    if (!form.partName || !form.category || !form.vendor || !form.stockQty) {
      Alert.alert("Validation", "Please complete all required fields manifest.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        stockQty: Number(form.stockQty),
        minStock: Number(form.minStock),
      };

      if (isEditMode) {
        await apiService.api.put(`/inventory/${id}`, payload);
        Alert.alert("Success", "Spare part manifest updated successfully.");
      } else {
        await apiService.api.post("/inventory", payload);
        Alert.alert("Success", "New spare part added to inventory manifest.");
      }
      router.back();
    } catch {
      Alert.alert("Error", "Operation failed. Backend logistics error.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <Stack.Screen options={{ 
        title: isEditMode ? "Edit Specifications" : "Provisioning Manifest",
        headerShown: true,
        headerStyle: { backgroundColor: COLORS.background },
        headerTintColor: COLORS.white,
        headerTitleStyle: { fontWeight: '900', fontSize: 16 }
      }} />

      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ padding: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-8">
           <Text className="text-white text-3xl font-black tracking-tighter uppercase">{isEditMode ? "Update Asset" : "Add Spare Part"}</Text>
           <Text className="text-sky-500 text-[10px] font-black uppercase tracking-[2px]">Logistics Entry & Registry</Text>
        </View>

        <View className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl mb-8">
           <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-6 px-2">Specifications Registry</Text>

           <View className="gap-6">
              {/* PART NAME */}
              <View>
                 <Text className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-2 ml-2">Hardware Identification</Text>
                 <TextInput 
                   placeholder="Part Name (e.g. Front Brake Pads)" 
                   placeholderTextColor="#334155"
                   value={form.partName}
                   onChangeText={(val) => setForm({...form, partName: val})}
                   className="bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white font-bold text-sm"
                 />
              </View>

              {/* CATEGORY */}
              <View>
                 <TouchableOpacity 
                   onPress={() => setCategoryPickerVisible(true)}
                   className="bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 flex-row justify-between items-center"
                 >
                    <View>
                       <Text className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1">Logistics Category</Text>
                       <Text className={`${form.category ? 'text-white' : 'text-slate-700'} font-bold text-sm`}>
                          {form.category || "Select Asset Category..."}
                       </Text>
                    </View>
                    <Ionicons name="chevron-down" size={16} color="#475569" />
                 </TouchableOpacity>
              </View>

              {/* VENDOR */}
              <View>
                 <TouchableOpacity 
                   onPress={() => setVendorPickerVisible(true)}
                   className="bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 flex-row justify-between items-center"
                 >
                    <View>
                       <Text className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1">Approved Supplier</Text>
                       <Text className={`${form.vendor ? 'text-white' : 'text-slate-700'} font-bold text-sm`}>
                          {form.vendor || "Select Supplier Registry..."}
                       </Text>
                    </View>
                    <Ionicons name="chevron-down" size={16} color="#475569" />
                 </TouchableOpacity>
              </View>

              <View className="flex-row gap-4">
                 <View className="flex-1">
                    <Text className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-2 ml-2">Stock Qty</Text>
                    <TextInput 
                      placeholder="Units" 
                      placeholderTextColor="#334155"
                      keyboardType="numeric"
                      value={form.stockQty}
                      onChangeText={(val) => setForm({...form, stockQty: val})}
                      className="bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white font-black text-center"
                    />
                 </View>
                 <View className="flex-1">
                    <Text className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-2 ml-2">Threshold</Text>
                    <TextInput 
                      placeholder="Min" 
                      placeholderTextColor="#334155"
                      keyboardType="numeric"
                      value={form.minStock}
                      onChangeText={(val) => setForm({...form, minStock: val})}
                      className="bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white font-black text-center"
                    />
                 </View>
              </View>
           </View>
        </View>

        <TouchableOpacity 
          onPress={handleSave}
          disabled={saving}
          className={`bg-white py-5 rounded-3xl items-center flex-row justify-center gap-3 shadow-2xl ${saving ? 'opacity-50' : ''}`}
        >
           {saving ? <ActivityIndicator color="#020617" /> : (
             <>
               <Ionicons name="save-outline" size={20} color="#020617" />
               <Text className="text-slate-950 font-black text-xs uppercase tracking-widest">Commit to Inventory Manifest</Text>
             </>
           )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} className="mt-6 items-center">
           <Text className="text-slate-500 font-black text-[10px] uppercase tracking-widest underline">Cancel Provisioning</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* PICKERS */}
      <Modal visible={categoryPickerVisible} animationType="slide" transparent>
         <View className="flex-1 bg-black/80">
            <View className="mt-40 flex-1 bg-slate-900 rounded-t-3xl border-t border-white/10 p-6">
               <View className="flex-row justify-between items-center mb-8">
                  <Text className="text-white font-black text-xl uppercase tracking-tighter">Category Logic</Text>
                  <TouchableOpacity onPress={() => setCategoryPickerVisible(false)}>
                     <Ionicons name="close-circle" size={32} color="#1e293b" />
                  </TouchableOpacity>
               </View>
               <ScrollView className="gap-2">
                  {categories.map(c => (
                    <TouchableOpacity 
                      key={c}
                      onPress={() => { setForm({...form, category: c}); setCategoryPickerVisible(false); }}
                      className={`p-5 rounded-2xl mb-2 flex-row justify-between items-center ${form.category === c ? 'bg-sky-500/20 border border-sky-500' : 'bg-slate-950'}`}
                    >
                       <Text className="text-white font-black text-xs uppercase">{c}</Text>
                       {form.category === c && <Ionicons name="checkmark-circle" size={16} color="#0ea5e9" />}
                    </TouchableOpacity>
                  ))}
               </ScrollView>
            </View>
         </View>
      </Modal>

      <Modal visible={vendorPickerVisible} animationType="slide" transparent>
         <View className="flex-1 bg-black/80">
            <View className="mt-40 flex-1 bg-slate-900 rounded-t-3xl border-t border-white/10 p-6">
               <View className="flex-row justify-between items-center mb-8">
                  <Text className="text-white font-black text-xl uppercase tracking-tighter">Supplier Registry</Text>
                  <TouchableOpacity onPress={() => setVendorPickerVisible(false)}>
                     <Ionicons name="close-circle" size={32} color="#1e293b" />
                  </TouchableOpacity>
               </View>
               <ScrollView className="gap-2">
                  {vendors.map(v => (
                    <TouchableOpacity 
                      key={v}
                      onPress={() => { setForm({...form, vendor: v}); setVendorPickerVisible(false); }}
                      className={`p-5 rounded-2xl mb-2 flex-row justify-between items-center ${form.vendor === v ? 'bg-sky-500/20 border border-sky-500' : 'bg-slate-950'}`}
                    >
                       <Text className="text-white font-black text-xs uppercase">{v}</Text>
                       {form.vendor === v && <Ionicons name="checkmark-circle" size={16} color="#0ea5e9" />}
                    </TouchableOpacity>
                  ))}
               </ScrollView>
            </View>
         </View>
      </Modal>
    </SafeAreaView>
  );
};

export default AddInventoryItem;
