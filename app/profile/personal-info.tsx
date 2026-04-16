import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../services/api";
import { COLORS, GRADIENT } from "../../theme/colors";

export default function PersonalInfo() {
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // FETCH USER DATA
  useEffect(() => {
    if (!user?.uid) return;

    const fetchUser = async () => {
      try {
        const res = await api.get(`/auth/profile/${user.uid}`);

        setName(res.data.username || "");
        setMobile(res.data.mobile || "");
        setEmail(res.data.email || "");
      } catch (err) {
        Alert.alert("Error", "Failed to load profile");
      }
    };

    fetchUser();
  }, [user]);

  // UPDATE PROFILE
  const handleUpdate = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Name is required");
      return;
    }

    if (!mobile.trim()) {
      Alert.alert("Error", "Mobile number is required");
      return;
    }

    if (mobile.length !== 10) {
      Alert.alert("Error", "Enter valid 10 digit mobile number");
      return;
    }

    try {
      setLoading(true);

      await api.put(`/auth/profile/${user?.uid}`, {
        username: name,
        mobile,
      });

      Alert.alert("Success", "Profile updated successfully");
    } catch (err) {
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Simulate refresh for form-based page (clear form fields)
      setName("");
      setMobile("");
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="px-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >

        {/* TITLE */}
        <View className="flex-row items-center gap-2 mt-6 mb-6">
          <Ionicons name="person-outline" size={22} color={COLORS.primary} />
          <Text className="text-text-primary text-xl font-bold">
            Personal Information
          </Text>
        </View>

        {/* INPUTS */}
        <View className="space-y-4">

          {/* NAME */}
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Full Name"
            placeholderTextColor="#94a3b8"
            className="bg-card px-4 py-4 rounded-xl text-white border border-primary/30"
          />

          {/* MOBILE */}
          <TextInput
            value={mobile}
            onChangeText={(text) => setMobile(text.replace(/[^0-9]/g, ""))}
            maxLength={10}
            keyboardType="numeric"
            placeholder="Mobile Number"
            placeholderTextColor="#94a3b8"
            className="bg-card px-4 py-4 mt-4 rounded-xl text-white border border-primary/30"
          />

          {/* EMAIL (READ ONLY) */}
          <TextInput
            value={email}
            editable={false}
            placeholder="Email Address"
            placeholderTextColor="#94a3b8"
            className="bg-slate800 px-4 py-4 mt-4 rounded-xl text-gray-400 border border-white/10"
          />
        </View>

        {/* BUTTON */}
        <TouchableOpacity
          onPress={handleUpdate}
          disabled={loading}
          activeOpacity={0.8}
          className="mt-8 rounded-xl overflow-hidden"
        >
          <LinearGradient
            colors={GRADIENT}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 12 }}
            className="py-4 flex-row justify-center items-center"
          >
            {loading ? (
              <>
                <ActivityIndicator color="#000" />
                <Text className="ml-2 font-bold text-black">
                  Updating...
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="save-outline" size={18} color="#000" />
                <Text className="ml-2 font-bold text-black">
                  Update Changes
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}