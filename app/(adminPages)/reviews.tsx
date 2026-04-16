import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { api } from "../../services/api";
import { COLORS } from "../../theme/colors";

export default function ReviewsSettings() {
  const router = useRouter();
  const [reviews, setReviews] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editId, setEditId] = useState<any>(null);

  const [form, setForm] = useState({
    name: "",
    rating: 0,
    message: "",
    image: "",
  });

  /* ================= FETCH ================= */
  const fetchReviews = async () => {
    try {
      const res = await api.get("/reviews");
      setReviews(res.data || []);
    } catch (err) {
      console.error("Failed to load reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  /* ================= IMAGE UPLOAD ================= */
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setForm({ ...form, image: `data:image/jpeg;base64,${result.assets[0].base64}` });
    }
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    if (!form.name || !form.rating || !form.message) {
      Alert.alert("Error", "Please fill all required fields and select a rating");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: form.name,
        rating: Number(form.rating),
        message: form.message,
        image: form.image || "",
        status: true // Default to approved for admin entry
      };

      if (editId) {
        await api.put(`/reviews/${editId}`, payload);
        Alert.alert("Success", "Review updated successfully");
      } else {
        await api.post("/reviews", payload);
        Alert.alert("Success", "Review added successfully");
      }

      setForm({ name: "", rating: 0, message: "", image: "" });
      setEditId(null);
      setShowModal(false);
      fetchReviews();
    } catch (error) {
      console.error("Review submit error:", error);
      Alert.alert("Error", "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (review: any) => {
    setEditId(review.id);
    setForm({
      name: review.name,
      rating: review.rating,
      message: review.message,
      image: review.image || "",
    });
    setShowModal(true);
  };

  /* ================= DELETE ================= */
  const handleDelete = async (id: any) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this review?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/reviews/${id}`);
            fetchReviews();
          } catch (err) {
            Alert.alert("Error", "Delete failed");
          }
        },
      },
    ]);
  };

  /* ================= TOGGLE STATUS ================= */
  const toggleStatus = async (id: any, currentStatus: boolean) => {
    try {
      await api.put(`/reviews/${id}/status`, {
        status: !currentStatus,
      });
      fetchReviews();
    } catch (err) {
      Alert.alert("Error", "Status update failed");
    }
  };

  const filtered = reviews.filter(
    (r) =>
      r.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.message?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
     

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        {/* SEARCH */}
        <View className="mb-8">
          <View className="bg-slate-900 rounded-2xl border border-white/10 h-14 flex-row items-center px-4">
            <Ionicons name="search-outline" size={18} color="#64748b" />
            <TextInput
              placeholder="Search feedback..."
              placeholderTextColor="#64748b"
              value={search}
              onChangeText={setSearch}
              className="flex-1 ml-3 text-white font-bold"
            />
          </View>
        </View>

        {/* LIST */}
        {loading ? (
          <ActivityIndicator size="large" color="#0ea5e9" className="mt-20" />
        ) : (
          <View className="gap-4 pb-32">
            {filtered.map((r) => (
              <View key={r.id} className="bg-slate-900/50 p-5 rounded-[32px] border border-white/5">
                <View className="flex-row gap-4">
                  {r.image ? (
                    <Image source={{ uri: r.image }} className="w-14 h-14 rounded-2xl border border-white/10" />
                  ) : (
                    <View className="w-14 h-14 rounded-2xl bg-slate-800 items-center justify-center border border-white/5">
                      <Ionicons name="image-outline" size={24} color="#475569" />
                    </View>
                  )}

                  <View className="flex-1">
                    <View className="flex-row justify-between items-start">
                      <View>
                        <Text className="text-white font-black text-sm uppercase tracking-tight">{r.name}</Text>
                        <View className="flex-row gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Ionicons
                              key={i}
                              name={i <= r.rating ? "star" : "star-outline"}
                              size={12}
                              color={i <= r.rating ? "#fbbf24" : "#475569"}
                            />
                          ))}
                        </View>
                      </View>

                      {/* ACTIONS */}
                      <View className="flex-row gap-2">
                        <TouchableOpacity 
                           onPress={() => toggleStatus(r.id, r.status)}
                           className={`w-9 h-9 rounded-2xl items-center justify-center border ${r.status ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-slate-800 border-slate-700'}`}
                        >
                          <Ionicons name="checkmark-circle" size={18} color={r.status ? "#10b981" : "#475569"} />
                        </TouchableOpacity>
                        <TouchableOpacity 
                           onPress={() => handleEdit(r)}
                           className="w-9 h-9 rounded-2xl bg-slate-800 border border-[#0ea5e9] items-center justify-center"
                        >
                          <Ionicons name="create-outline" size={18} color="#0ea5e9" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                           onPress={() => handleDelete(r.id)}
                           className="w-9 h-9 rounded-2xl bg-rose-500/20 border border-rose-500/30 items-center justify-center"
                        >
                          <Ionicons name="trash-outline" size={18} color="#f43f5e" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <Text className="text-slate-400 text-xs mt-3 leading-5">{r.message}</Text>
                  </View>
                </View>
              </View>
            ))}

            {filtered.length === 0 && (
              <View className="py-20 items-center">
                 <Ionicons name="chatbubbles-outline" size={48} color="#1e293b" />
                 <Text className="text-slate-600 font-black uppercase text-[10px] tracking-widest mt-4">No reviews found</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* MODAL */}
      <Modal visible={showModal} transparent animationType="slide">
        <View className="flex-1 bg-black/60 justify-end">
           <View className="bg-slate-900 rounded-t-[40px] p-8 border-t border-white/10 shadow-2xl">
              <View className="flex-row justify-between items-center mb-8">
                 <Text className="text-white font-black text-2xl tracking-tighter">
                    {editId ? "Update Review" : "Add Review"}
                 </Text>
                 <TouchableOpacity onPress={() => setShowModal(false)} className="w-10 h-10 bg-slate-800 rounded-full items-center justify-center">
                    <Ionicons name="close" size={24} color="white" />
                 </TouchableOpacity>
              </View>

              <ScrollView className="max-h-[60vh] gap-6" showsVerticalScrollIndicator={false}>
                 <View>
                    <Text className="text-slate-500 mb-2 text-[10px] font-black uppercase tracking-widest ml-2 mb-2">Customer Name</Text>
                    <TextInput 
                      placeholder="Enter name" 
                      placeholderTextColor="#475569"
                      value={form.name}
                      onChangeText={(text) => setForm({ ...form, name: text })}
                      className="bg-slate-950 border border-white/5 h-14 rounded-2xl mb-6 px-5 text-white font-bold"
                    />
                 </View>

                 <View>
                    <Text className="text-slate-500  mb-2 text-[10px] font-black uppercase tracking-widest ml-2 mb-2">Customer Photo</Text>
                    <TouchableOpacity 
                       onPress={pickImage}
                       className="bg-slate-950 border-2 border-dashed border-white/10 h-32 rounded-2xl items-center justify-center overflow-hidden"
                    >
                       {form.image ? (
                          <Image source={{ uri: form.image }} className="w-full h-full mb-6" resizeMode="cover" />
                       ) : (
                          <>
                             <Ionicons name="camera-outline" size={32} color="#475569" />
                             <Text className="text-slate-600 text-[8px] font-bold mb-6 uppercase mt-2">Pick Image</Text>
                          </>
                       )}
                    </TouchableOpacity>
                 </View>

                 <View>
                    <Text className="text-slate-500 text-[10px]  mt-8 font-black uppercase tracking-widest ml-2 mb-2">Rating</Text>
                    <View className="flex-row gap-3 bg-slate-950 p-4 mb-6 rounded-2xl border border-white/5 justify-center">
                       {[1, 2, 3, 4, 5].map((i) => (
                          <TouchableOpacity key={i} onPress={() => setForm({ ...form, rating: i })}>
                             <Ionicons 
                                name={i <= form.rating ? "star" : "star-outline"} 
                                size={32} 
                                color={i <= form.rating ? "#fbbf24" : "#1e293b"} 
                             />
                          </TouchableOpacity>
                       ))}
                    </View>
                 </View>

                 <View>
                    <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest ml-2 mb-2">Review Content</Text>
                    <TextInput 
                      placeholder="Write feedback..." 
                      placeholderTextColor="#475569"
                      multiline
                      numberOfLines={4}
                      value={form.message}
                      onChangeText={(text) => setForm({ ...form, message: text })}
                      className="bg-slate-950 border border-white/5 rounded-2xl p-5 text-white font-bold text-xs"
                      textAlignVertical="top"
                    />
                 </View>

                 <TouchableOpacity 
                    onPress={handleSubmit}
                    disabled={submitting}
                    className="bg-white h-16 rounded-2xl items-center justify-center mt-4 flex-row gap-2 active:scale-95 transition-all"
                 >
                    {submitting ? (
                       <ActivityIndicator color="black" />
                    ) : (
                       <>
                          <Ionicons name="shield-checkmark" size={20} color="black" />
                          <Text className="text-black font-black text-sm uppercase tracking-widest">
                             {editId ? "Update Feedback" : "Save Feedback"}
                          </Text>
                       </>
                    )}
                 </TouchableOpacity>
                 <View className="h-10" />
              </ScrollView>
           </View>
        </View>
      </Modal>

      {/* FLOATING ADD BUTTON */}
      <TouchableOpacity
        onPress={() => setShowModal(true)}
        className="absolute bottom-10 mb-8 right-8 w-16 h-16 bg-primary rounded-full items-center justify-center shadow-2xl z-50"
        style={{ elevation: 15 }}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={25} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
