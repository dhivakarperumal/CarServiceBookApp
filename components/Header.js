import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, Modal, Pressable, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../contexts/AuthContext";
import { COLORS } from "../theme/colors";

export default function Header() {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  // 🔥 LOGOUT
  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    router.replace("/(auth)/login");
  };

  return (
    <>
      <SafeAreaView edges={["top"]} className="bg-background">

        <View className="flex-row items-center justify-between px-5 py-4">

          {/* LOGO */}
          <Image
            source={require("../assets/images/logo_no_bg.png")}
            className="w-16 h-10"
            resizeMode="contain"
          />

          {/* RIGHT SIDE */}
          <View className="flex-row items-center gap-3">

            {/* CART */}
            <TouchableOpacity>
              <Ionicons name="cart-outline" size={22} color={COLORS.primary} />
            </TouchableOpacity>

            {/* NOTIFICATION */}
            <TouchableOpacity>
              <Ionicons name="notifications-outline" size={22} color={COLORS.primary} />
            </TouchableOpacity>

            {/* 🔥 USER / AVATAR */}
            {user ? (
              // 👤 When logged in - show avatar that opens dropdown
              <TouchableOpacity
                onPress={() => setMenuOpen(true)}
                className="w-9 h-9 rounded-full bg-primary items-center justify-center"
                activeOpacity={0.7}
              >
                <Text className="text-white font-bold">
                  {(user.username || user.name || "U")[0].toUpperCase()}
                </Text>
              </TouchableOpacity>
            ) : (
              // 🚪 When not logged in - show person icon that navigates to login
              <TouchableOpacity
                onPress={() => router.replace("/(auth)/login")}
                activeOpacity={0.7}
              >
                <Ionicons name="person-outline" size={22} color={COLORS.primary} />
              </TouchableOpacity>
            )}

          </View>

        </View>

      </SafeAreaView>

      {/* 🔥 DROPDOWN MENU */}
      <Modal visible={menuOpen} transparent animationType="fade">

        {/* BACKDROP */}
        <Pressable
          className="flex-1 bg-black/60"
          onPress={() => setMenuOpen(false)}
        />

        {/* MENU */}
        <View className="absolute top-20 right-5 w-44 bg-card rounded-2xl border border-primary/30 py-2">

          <TouchableOpacity
            onPress={() => {
              setMenuOpen(false);
              router.push("/(tabs)/profile");
            }}
            className="px-4 py-3"
          >
            <Text className="text-white font-semibold">
              My Profile
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogout}
            className="px-4 py-3"
          >
            <Text className="text-error font-semibold">
              Logout
            </Text>
          </TouchableOpacity>

        </View>

      </Modal>
    </>
  );
}