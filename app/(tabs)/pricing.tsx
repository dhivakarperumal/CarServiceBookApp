import React, { useEffect, useState } from "react";
import {
    View,
    FlatList,
    ImageBackground,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { api } from "../../services/api";
import PricingCard from "@/components/PricingCard";
import { COLORS, withOpacity } from "../../theme/colors";

export default function PricingScreen() {
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPricingPackages = async () => {
            try {
                const res = await api.get("/pricing_packages");
                setPackages(res.data || []);
            } catch (err) {
                console.error("Failed to load pricing packages", err);
            } finally {
                setLoading(false);
            }
        };

        fetchPricingPackages();
    }, []);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background, }}
            edges={["left", "right"]} >

            <ImageBackground
                source={{
                    uri: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQfAJ3Ai3tu58SWAJ2mK_EhozE-OIgQXcLXNg&s",
                }}
                resizeMode="cover"
                style={{ flex: 1 }}
            >
                {/* Overlay */}
                <View
                    style={{
                        flex: 1,
                        backgroundColor: withOpacity(COLORS.black, 0.8),
                        paddingHorizontal: 16,
                        paddingTop: 8,
                        paddingBottom: 5,
                    }}
                >
                    {loading ? (
                        <ActivityIndicator size="large" color={COLORS.primary} />
                    ) : (
                        <FlatList
                            data={packages}
                            keyExtractor={(item) => item.id.toString()}
                            numColumns={2} // ✅ IMPORTANT
                            columnWrapperStyle={{ justifyContent: "space-between" }} // ✅ spacing
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 5 }}
                            renderItem={({ item }) => (
                                <PricingCard pkg={item} />
                            )}
                        />
                    )}
                </View>
            </ImageBackground>
        </SafeAreaView>
    );
}