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
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '../../services/api';
import { COLORS } from '../../theme/colors';
import { useCart } from '../../contexts/CartContext';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

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
  const { addToCart } = useCart();

  const getLabel = (value: string) => {
    switch (value) {
      case "low-high":
        return "Price: Low to High";
      case "high-low":
        return "Price: High to Low";
      case "a-z":
        return "Name: A to Z";
      case "z-a":
        return "Name: Z to A";
      default:
        return value;
    }
  };
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("");

  const [filters, setFilters] = useState({
    minPrice: "",
    maxPrice: "",
    brand: [],
    rating: "",
    offer: false,
  });

  const [showFilters, setShowFilters] = useState(false);

  const filteredProducts = products
    .filter((p) => {
      const searchValue = search.toLowerCase();

      return (
        p.name.toLowerCase().includes(searchValue) ||
        p.brand?.toLowerCase().includes(searchValue) ||
        String(p.offerPrice).includes(searchValue)
      );
    })

    .filter((p) => {
      const price = Number(p.offerPrice || 0);

      if (filters.minPrice && price < Number(filters.minPrice)) return false;
      if (filters.maxPrice && price > Number(filters.maxPrice)) return false;

      if (filters.brand.length > 0 && !filters.brand.includes(p.brand)) {
        return false;
      }

      if (filters.rating && Number(p.rating || 0) < Number(filters.rating)) {
        return false;
      }

      if (filters.offer && !p.offerPrice) return false;

      return true;
    })

    .sort((a, b) => {
      if (sort === "low-high") return Number(a.offerPrice) - Number(b.offerPrice);
      if (sort === "high-low") return Number(b.offerPrice) - Number(a.offerPrice);
      if (sort === "a-z") return a.name.localeCompare(b.name);
      if (sort === "z-a") return b.name.localeCompare(a.name);
      return 0;
    });

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
      <TouchableOpacity
        className="w-[48%] mb-5"
        onPress={() => router.push(`/product/${item.slug}`)}
        activeOpacity={0.9}
      >
        <View className="bg-[#111827] rounded-[18px] p-2.5 border border-[#0EA5E9]/20">
          {/* Image + Badge */}
          <View className="relative mb-2.5">
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                className="w-full h-[110px] rounded-xl"
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-[110px] rounded-xl bg-[#1F2937]" />
            )}

            {offerPercent > 0 && (
              <View className="absolute top-1.5 left-1.5 bg-[#0EA5E9] px-2 py-1 rounded-full">
                <Text className="text-white text-[9px] font-bold tracking-[0.5px]">
                  {offerPercent}% OFF
                </Text>
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
          <View className="rounded-full overflow-hidden w-[90%] self-center mt-0.5">
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 25 }}
              className="py-1.5 justify-center items-center"
            >
              <Text className="text-white font-bold text-xs tracking-[0.5px]">View Details</Text>
            </LinearGradient>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-background ">
      <View className="flex-1 p-5">
        <View className="flex-row items-center mb-4 gap-2">

          {/* SEARCH */}
          <View className="flex-1 bg-[#1F2937] rounded-lg px-3 py-2 flex-row items-center">
            <Ionicons name="search" size={16} color="#94A3B8" />
            <TextInput
              placeholder="Search products..."
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
              className="ml-2 text-white flex-1"
            />
          </View>

          {/* FILTER BUTTON */}
          <TouchableOpacity
            onPress={() => setShowFilters(true)}
            className="bg-[#0EA5E9] p-2 rounded-lg"
          >
            <Ionicons name="options" size={18} color="white" />
          </TouchableOpacity>

        </View>

        <View className="mb-3">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {["low-high", "high-low", "a-z", "z-a"].map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => setSort(item)}
                className={`px-3 py-1 mr-2 rounded-full ${sort === item ? "bg-[#0EA5E9]" : "bg-[#1F2937]"
                  }`}
              >
                <Text className="text-white text-xs">
                  {getLabel(item)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <FlatList
          data={filteredProducts}
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
      <Modal visible={showFilters} animationType="slide">
        <View className="flex-1 bg-[#0B1120] p-5">

          <Text className="text-white text-lg font-bold mb-4">Filters</Text>

          {/* PRICE */}
          <Text className="text-gray400 mb-1">Max Price</Text>
          <TextInput
            value={filters.maxPrice}
            onChangeText={(val) => setFilters({ ...filters, maxPrice: val })}
            keyboardType="numeric"
            className="bg-[#1F2937] text-white p-2 rounded mb-3"
          />

          {/* RATING */}
          {[4, 3].map((r) => (
            <TouchableOpacity
              key={r}
              onPress={() => setFilters({ ...filters, rating: String(r) })}
              className="mb-2"
            >
              <Text className="text-white">{r}★ & up</Text>
            </TouchableOpacity>
          ))}

          {/* OFFER */}
          <TouchableOpacity
            onPress={() => setFilters({ ...filters, offer: !filters.offer })}
          >
            <Text className="text-white mb-4">
              {filters.offer ? "✓ " : ""}Offers Only
            </Text>
          </TouchableOpacity>

          {/* APPLY */}
          <TouchableOpacity
            onPress={() => setShowFilters(false)}
            className="bg-[#0EA5E9] p-3 rounded-lg"
          >
            <Text className="text-white text-center">Apply Filters</Text>
          </TouchableOpacity>

        </View>
      </Modal>
    </View>
  );
}