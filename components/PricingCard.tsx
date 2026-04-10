import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { GRADIENT } from "../theme/colors";

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

            <Text className="text-primary text-xs mb-2">
                Place:{" "}
                <Text className="text-white font-semibold">
                    {pkg.place === "home" ? "Home & Shop" : "Shop"}
                </Text>
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

            <TouchableOpacity
                onPress={() => router.push({
                    pathname: "/booking",
                    params: { selectedPackage: JSON.stringify(pkg) }
                })}
                activeOpacity={0.8}
                className="rounded-full overflow-hidden w-[90%] self-center"
            >
                <LinearGradient
                    colors={GRADIENT}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ borderRadius: 25 }}
                    className="py-2 items-center justify-center"
                >
                    <Text className="text-white font-bold text-sm tracking-[0.5px]">
                        Choose Plan
                    </Text>
                </LinearGradient>
            </TouchableOpacity>
        </View >
    );
};

export default PricingCard;