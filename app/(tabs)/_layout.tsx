import { Tabs } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import Header from "../../components/Header";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../theme/colors";

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        // 🔥 CUSTOM HEADER
        header: () => <Header />,

        // 🔥 COLORS
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,

        // 🔥 TAB BAR STYLE
        tabBarStyle: {
          backgroundColor: COLORS.card,
          borderTopWidth: 1,
          borderTopColor: COLORS.gray800,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 6,
        },

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >

      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <FontAwesome name="home" color={color} size={20} />
          ),
        }}
      />

      <Tabs.Screen
        name="services"
        options={{
          title: "Services",
          tabBarIcon: ({ color }) => (
            <FontAwesome name="wrench" color={color} size={20} />
          ),
        }}
      />

      <Tabs.Screen
        name="booking"
        options={{
          title: "Booking",
          tabBarIcon: ({ color }) => (
            <FontAwesome name="calendar" color={color} size={20} />
          ),
        }}
      />

      <Tabs.Screen
        name="products"
        options={{
          title: "Products",
          tabBarIcon: ({ color }) => (
            <FontAwesome name="shopping-cart" color={color} size={20} />
          ),
        }}
      />

      <Tabs.Screen
        name="vehicles"
        options={{
          title: "Vehicles",
          tabBarIcon: ({ color }) => (
            <FontAwesome name="car" color={color} size={20} />
          ),
        }}
      />

      {/* Hidden */}
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
        }}
      />

    </Tabs>
  );
}