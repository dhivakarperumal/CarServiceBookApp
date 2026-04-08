import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Image,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { COLORS } from "../theme/colors";

// ✅ User Type
type User = {
  username?: string;
  name?: string;
};

// ✅ Auth Context Type
type AuthContextType = {
  user: User | null;
  logout: () => Promise<void>;
  isLoading: boolean;
};

// ✅ Cart Context Type
type CartContextType = {
  totalItems: number;
};

const Header: React.FC = () => {
  const router = useRouter();

  const { user, logout } = useAuth() as AuthContextType;
  const { totalItems: cartCount } = useCart() as CartContextType;

  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  // 🔥 Logout Function
  const handleLogout = async (): Promise<void> => {
    setMenuOpen(false);
    await logout();
    router.replace("/(auth)/login");
  };

  return (
    <>
      {/* 🔷 HEADER */}
      <SafeAreaView edges={["top"]} className="bg-background">
        <View
          className="flex-row items-center justify-between px-5 py-4"
          style={{
            borderBottomWidth: 0.6,
            borderBottomColor: COLORS.primary,
          }}
        >

          {/* 🧩 LOGO */}
          <TouchableOpacity
            onPress={() => router.push("/")}
            activeOpacity={0.7}
          >
            <Image
              source={require("../assets/images/logo_no_bg.png")}
              className="w-16 h-10"
              resizeMode="contain"
            />
          </TouchableOpacity>

          {/* 🔷 RIGHT SIDE */}
          <View className="flex-row items-center gap-3">

            {/* 🛒 CART */}
            <View className="relative">
              <TouchableOpacity
                onPress={() => router.push("/cart")}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="cart-outline"
                  size={22}
                  color={COLORS.primary}
                />
              </TouchableOpacity>

              {/* 🔴 CART BADGE */}
              {cartCount > 0 && (
                <View className="absolute -top-2 -right-2 bg-red-500 rounded-full px-1.5 min-w-[16px] h-[16px] items-center justify-center">
                  <Text className="text-[10px] text-white font-bold">
                    {cartCount}
                  </Text>
                </View>
              )}
            </View>

            {/* 🔔 NOTIFICATIONS */}
            <TouchableOpacity activeOpacity={0.7}>
              <Ionicons
                name="notifications-outline"
                size={22}
                color={COLORS.primary}
              />
            </TouchableOpacity>

            {/* 👤 USER / LOGIN */}
            {user ? (
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
              <TouchableOpacity
                onPress={() => router.replace("/(auth)/login")}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="person-outline"
                  size={22}
                  color={COLORS.primary}
                />
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

        {/* MENU BOX */}
        <View className="absolute top-20 right-5 w-44 bg-card rounded-2xl border border-primary/30 py-2 shadow-lg">

          {/* PROFILE */}
          <TouchableOpacity
            onPress={() => {
              setMenuOpen(false);
              router.push("/(tabs)/profile");
            }}
            className="px-4 py-3"
            activeOpacity={0.7}
          >
            <Text className="text-white font-semibold">
              My Profile
            </Text>
          </TouchableOpacity>

          {/* LOGOUT */}
          <TouchableOpacity
            onPress={handleLogout}
            className="px-4 py-3"
            activeOpacity={0.7}
          >
            <Text className="text-error font-semibold">
              Logout
            </Text>
          </TouchableOpacity>

        </View>
      </Modal>
    </>
  );
};

export default Header;