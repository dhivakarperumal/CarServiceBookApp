import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../services/api";
import { COLORS, GRADIENT } from "../../theme/colors";

export default function ChangePassword() {
    const { user } = useAuth();

    const [currentPwd, setCurrentPwd] = useState("");
    const [newPwd, setNewPwd] = useState("");
    const [confirmPwd, setConfirmPwd] = useState("");
    const [loading, setLoading] = useState(false);

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handlePasswordUpdate = async () => {
        if (!currentPwd.trim()) {
            Alert.alert("Error", "Enter current password");
            return;
        }

        if (newPwd.length < 6) {
            Alert.alert("Error", "Password must be at least 6 characters");
            return;
        }

        if (newPwd !== confirmPwd) {
            Alert.alert("Error", "Passwords do not match");
            return;
        }

        try {
            setLoading(true);

            await api.put(`/auth/profile/${user?.uid}/password`, {
                currentPassword: currentPwd,
                newPassword: newPwd,
            });

            Alert.alert("Success", "Password updated successfully");

            setCurrentPwd("");
            setNewPwd("");
            setConfirmPwd("");
        } catch (err: any) {
            Alert.alert(
                "Error",
                err?.response?.data?.message || "Failed to update password"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-background px-4">

            {/* TITLE */}
            <View className="flex-row items-center gap-2 mt-6 mb-6">
                <Ionicons name="lock-closed-outline" size={22} color={COLORS.primary} />
                <Text className="text-text-primary text-xl font-bold">
                    Set / Change Password
                </Text>
            </View>

            {/* INPUTS */}
            <View className="space-y-4">

  {/* CURRENT PASSWORD */}
  <View className="relative">
    <TextInput
      placeholder="Current Password"
      placeholderTextColor="#94a3b8"
      secureTextEntry={!showCurrent}
      value={currentPwd}
      onChangeText={setCurrentPwd}
      className="bg-card px-4 py-4 pr-12 rounded-xl text-white border border-primary/30"
    />

    <TouchableOpacity
      onPress={() => setShowCurrent(!showCurrent)}
      className="absolute right-4 top-4"
    >
      <Ionicons
        name={showCurrent ? "eye-off-outline" : "eye-outline"}
        size={20}
        color="#94a3b8"
      />
    </TouchableOpacity>
  </View>


  {/* NEW PASSWORD */}
  <View className="relative mt-4">
    <TextInput
      placeholder="New Password"
      placeholderTextColor="#94a3b8"
      secureTextEntry={!showNew}
      value={newPwd}
      onChangeText={setNewPwd}
      className="bg-card px-4 py-4 pr-12 rounded-xl text-white border border-primary/30"
    />

    <TouchableOpacity
      onPress={() => setShowNew(!showNew)}
      className="absolute right-4 top-4"
    >
      <Ionicons
        name={showNew ? "eye-off-outline" : "eye-outline"}
        size={20}
        color="#94a3b8"
      />
    </TouchableOpacity>
  </View>


  {/* CONFIRM PASSWORD */}
  <View className="relative mt-4">
    <TextInput
      placeholder="Confirm New Password"
      placeholderTextColor="#94a3b8"
      secureTextEntry={!showConfirm}
      value={confirmPwd}
      onChangeText={setConfirmPwd}
      className="bg-card px-4 py-4 pr-12 rounded-xl text-white border border-primary/30"
    />

    <TouchableOpacity
      onPress={() => setShowConfirm(!showConfirm)}
      className="absolute right-4 top-4"
    >
      <Ionicons
        name={showConfirm ? "eye-off-outline" : "eye-outline"}
        size={20}
        color="#94a3b8"
      />
    </TouchableOpacity>
  </View>

</View>

            {/* BUTTON */}
            <TouchableOpacity
                onPress={handlePasswordUpdate}
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
                            <Ionicons name="key-outline" size={18} color="#000" />
                            <Text className="ml-2 font-bold text-black">
                                Update Password
                            </Text>
                        </>
                    )}
                </LinearGradient>
            </TouchableOpacity>

        </SafeAreaView>
    );
}