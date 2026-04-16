import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import React, { useState } from 'react';
import {
    FlatList,
    Image,
    RefreshControl,
    SafeAreaView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { CartItem, useCart } from '../contexts/CartContext';
import { useFavorites } from '../contexts/FavoriteContext';
import { COLORS } from '../theme/colors';

export default function CartScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const { cart, removeFromCart, updateQuantity, totalAmount } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();

  const onRefresh = () => {
    setRefreshing(true);
    // Cart items are managed by context, so just simulate refresh
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    router.push('/checkout');
  };

  const renderCartItem = ({ item }: { item: CartItem }) => {
    const getImgUri = (img: string | null) => {
      if (!img) return 'https://via.placeholder.com/100';
      
      // Handle the case where img is actually a stringified array
      let imgPath = img;
      if (typeof img === 'string' && img.startsWith('[')) {
        try {
          const parsed = JSON.parse(img);
          if (Array.isArray(parsed) && parsed.length > 0) {
            imgPath = parsed[0];
          }
        } catch (e) {
          // ignore
        }
      }
      
      if (imgPath.startsWith('data:')) return imgPath;
      if (imgPath.startsWith('http')) return imgPath;
      const path = imgPath.startsWith('/') ? imgPath.substring(1) : imgPath;
      return `https://cars.qtechx.com/${path}`;
    };

    return (
      <View className="flex-row bg-[#1E293B] rounded-2xl p-3 mb-4 items-center border border-[#334155]">
        <Image 
          source={{ uri: getImgUri(item.image) }} 
          className="w-20 h-20 rounded-xl bg-[#334155]" 
        />
        <View className="flex-1 ml-4">
          <Text className="text-white text-base font-bold mb-0.5" numberOfLines={1}>{item.name}</Text>
          <Text className="text-[#64748B] text-xs mb-1">{item.brand || 'Premium Product'}</Text>
          <Text className="text-[#0EA5E9] text-base font-bold mb-2.5">₹ {item.price.toFixed(2)}</Text>
          
          <View className="flex-row items-center">
            <TouchableOpacity 
              onPress={() => updateQuantity(item.docId, item.quantity - 1)}
              className="bg-[#334155] w-7 h-7 rounded-lg justify-center items-center"
            >
              <Ionicons name="remove" size={16} color="#fff" />
            </TouchableOpacity>
            <Text className="text-white mx-4 text-base font-bold">{item.quantity}</Text>
            <TouchableOpacity 
              onPress={() => updateQuantity(item.docId, item.quantity + 1)}
              className="bg-[#334155] w-7 h-7 rounded-lg justify-center items-center"
            >
              <Ionicons name="add" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        <View className="items-center justify-center">
          <TouchableOpacity 
            onPress={() => toggleFavorite(item.docId)}
            className="p-2 mb-2.5"
          >
            <Ionicons 
              name={isFavorite(item.docId) ? "heart" : "heart-outline"} 
              size={22} 
              color={isFavorite(item.docId) ? "#ef4444" : "#94a3b8"} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => removeFromCart(item.docId)}
            className="p-2"
          >
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0F172A]">
      <Stack.Screen options={{ 
        title: 'Shopping Cart', 
        headerBackTitle: 'Back',
        headerStyle: { backgroundColor: '#1E293B' },
        headerTitleStyle: { color: '#FFF' },
      }} />
      
      {cart.length === 0 ? (
        <View className="flex-1 justify-center items-center px-10">
          <Ionicons name="cart-outline" size={100} color="#334155" />
          <Text className="text-[#64748B] text-lg mt-5 mb-8">Your cart is empty</Text>
          <TouchableOpacity 
            onPress={() => router.push('/(tabs)/products')}
            className="bg-[#2563EB] px-6 py-4 rounded-full"
          >
            <Text className="text-white text-base font-bold">Shop Services & Products</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View className="flex-1">
          <FlatList
            data={cart}
            keyExtractor={(item) => String(item.docId)}
            renderItem={renderCartItem}
            contentContainerStyle={{ padding: 20, paddingBottom: 150 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0EA5E9" />
            }
          />
          
          <View className="bg-[#1E293B] p-6 rounded-t-[30px] border-t border-[#334155] absolute bottom-0 w-full">
            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-[#94A3B8] text-base">Total Amount:</Text>
              <Text className="text-white text-2xl font-bold">₹ {totalAmount.toFixed(2)}</Text>
            </View>
            
            <TouchableOpacity onPress={handleCheckout} activeOpacity={0.8}>
  <View className="rounded-2xl overflow-hidden">
    <LinearGradient
      colors={[COLORS.primary, COLORS.primaryDark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-row justify-center items-center py-4"
    >
      <Text className="text-white text-lg font-bold mr-2.5">
        Proceed to Checkout
      </Text>
      <Ionicons name="arrow-forward" size={20} color="#fff" />
    </LinearGradient>
  </View>
</TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
