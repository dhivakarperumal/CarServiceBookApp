import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import PricingCard from "@/components/PricingCard";
import { api } from "../../services/api";
import { COLORS } from "../../theme/colors";

export default function PricingScreen() {
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

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

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            const res = await api.get("/pricing_packages");
            setPackages(res.data || []);
        } catch (err) {
            console.error("Failed to refresh pricing packages", err);
        } finally {
            setRefreshing(false);
        }
    };

    return (
        <SafeAreaView
            style={{ flex: 1, backgroundColor: COLORS.background }}
            edges={["left", "right"]}
        >
            <View
                style={{
                    flex: 1,
                    paddingHorizontal: 16,
                    paddingTop: 10,
                }}
            >
                {loading && packages.length === 0 ? (
                    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                ) : (
                    <FlatList
                        data={packages}
                        keyExtractor={(item) => item.id.toString()}
                        numColumns={2}
                        columnWrapperStyle={{
                            justifyContent: "space-between",
                            marginBottom: 12,
                        }}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{
                            paddingTop: 20,
                            paddingBottom: 50,
                        }}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                        }
                        renderItem={({ item }) => (
                            <PricingCard pkg={item} />
                        )}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}