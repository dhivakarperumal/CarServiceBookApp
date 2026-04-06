import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

type PricingPackage = {
    id: number;
    title?: string;
    price: string | number;
    description?: string;
    features?: string[] | string;
};

type Props = {
    pkg: PricingPackage;
};

const PricingCard: React.FC<Props> = ({ pkg }) => {
    const router = useRouter();
    const features =
        typeof pkg.features === "string"
            ? JSON.parse(pkg.features)
            : pkg.features || [];

    return (
        <View className="bg-card rounded-2xl p-4 mb-4 border border-primary/30 w-[48%]">

            {/* ✅ NAME → CAPS */}
            <Text
                numberOfLines={2}
                className="text-primary text-sm font-bold uppercase mb-1 h-[40px]"
            >
                {pkg.title}
            </Text>

            {/* ✅ PRICE → BIG + WHITE */}
            <Text className="text-white text-3xl font-extrabold mb-3">
                ₹{pkg.price}
            </Text>

            {/* ✅ FEATURES → LIGHT WHITE */}
            <View className="mb-4">
                {features.map((item: string, index: number) => (
                    <View key={index} className="flex-row items-center mb-2">

                        {/* 🔵 ICON */}
                        <View className="w-[18px] h-[18px] rounded-full bg-primary items-center justify-center mr-2">
                            <Ionicons name="checkmark" size={12} color="white" />
                        </View>

                        {/* ✅ LIGHT WHITE TEXT */}
                        <Text className="text-white/70 text-xs">
                            {item}
                        </Text>

                    </View>
                ))}
            </View>

            {/* ✅ BUTTON */}
            <TouchableOpacity
                className="bg-primary py-2 rounded-xl items-center"
                activeOpacity={0.8}
                onPress={() => router.push("/booking")}
            >
                <Text className="text-white font-bold text-sm">
                    Choose Plan
                </Text>
            </TouchableOpacity>
        </View>
    );
};

export default PricingCard;