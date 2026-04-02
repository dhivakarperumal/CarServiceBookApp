import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '../../services/api';
import { COLORS } from '../../theme/colors';

const { width } = Dimensions.get('window');

// Actual API product shape
interface ApiProduct {
  docId: number;
  id: string;
  name: string;
  slug: string;
  brand: string;
  description: string | null;
  mrp: string;
  offer: string;
  offerPrice: string;
  tags: string[];
  isFeatured: number;
  isActive: number;
  rating: string;
  variants: any[];
  images: string[];
  category?: string;
}

export default function ProductsScreen() {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await apiService.getProducts();
      setProducts(data as unknown as ApiProduct[]);
    } catch (error) {
      Alert.alert('Error', 'Failed to load products. Please try again.');
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProductImage = (images: string[] | undefined): string | null => {
    if (!images || images.length === 0) return null;
    const img = images[0];
    if (!img) return null;
    if (img.startsWith('data:')) return img;
    if (img.startsWith('http')) return img;
    return `https://cars.qtechx.com/${img}`;
  };

  const formatPrice = (price: string | number | undefined): string => {
    if (price === undefined || price === null) return '0.00';
    const num = parseFloat(String(price).replace(/[^0-9.]/g, ''));
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#0B1120]">
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text className="text-[#94A3B8] mt-3 text-sm">Loading products...</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: ApiProduct }) => {
    const imageUri = getProductImage(item.images);
    const offerPercent = parseFloat(item.offer || '0');

    return (
      <View className="w-[48%] bg-[#111827] rounded-[18px] p-2.5 mb-5 border border-[#0EA5E9]/20">
        {/* Image + Badge */}
        <View className="relative mb-2.5">
          {imageUri ? (
            <Image source={{ uri: imageUri }} className="w-full h-[110px] rounded-xl" resizeMode="cover" />
          ) : (
            <View className="w-full h-[110px] rounded-xl bg-[#1F2937]" />
          )}
          {offerPercent > 0 && (
            <View className="absolute top-1.5 left-1.5 bg-[#0EA5E9] px-2 py-1 rounded-full">
              <Text className="text-white text-[9px] font-bold tracking-[0.5px]">{offerPercent}% OFF</Text>
            </View>
          )}
        </View>

        {/* Name */}
        <Text className="text-white text-[13px] font-bold mb-1" numberOfLines={1}>{item.name}</Text>

        {/* Brand & Rating */}
        <View className="flex-row justify-between items-center mb-1">
          {item.brand ? <Text className="text-[#94A3B8] text-[11px]">{item.brand}</Text> : <Text />}
          {item.rating && parseFloat(item.rating) > 0 ? (
            <Text className="text-[#FBBF24] text-[11px]">⭐ {item.rating}</Text>
          ) : null}
        </View>

        {/* Price row */}
        <View className="flex-row items-center mb-2">
          <Text className="text-[#0EA5E9] text-sm font-bold mr-1.5">₹ {formatPrice(item.offerPrice)}</Text>
          {offerPercent > 0 && (
            <Text className="text-[#64748B] text-[11px] line-through">₹ {formatPrice(item.mrp)}</Text>
          )}
        </View>

        {/* Button */}
        <TouchableOpacity
          onPress={() => Alert.alert('Purchase', `Added ${item.name} to cart!`)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 25 }}
            className="self-center w-[90%] py-1.5 justify-center items-center mt-0.5 overflow-hidden"
          >
            <Text className="text-white font-bold text-xs tracking-[0.5px]">Add to Cart</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ImageBackground
      source={{
        uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQfAJ3Ai3tu58SWAJ2mK_EhozE-OIgQXcLXNg&s',
      }}
      className="flex-1"
    >
      <View className="absolute inset-0 bg-black/80" />
      <View className="flex-1 p-5">
       
        <FlatList
          data={products}
          keyExtractor={(item) => String(item.docId)}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListEmptyComponent={() => (
            <View className="flex-1 items-center pt-15">
              <Text className="text-[#94A3B8] text-sm">No products available at the moment</Text>
            </View>
          )}
        />
      </View>
    </ImageBackground>
  );
}