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
import Slider from '@react-native-community/slider';

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
      case "":
        return "All";
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
    stock: "",
    offer: false,
  });

  const [showFilters, setShowFilters] = useState(false);
  const brands = [...new Set(products.map(p => p.brand).filter(Boolean))];

  const prices = products
    .map(p => Number(p.offerPrice || 0))
    .filter(p => p > 0);

  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 1000;

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

      // PRICE
      if (filters.minPrice && price < Number(filters.minPrice)) return false;
      if (filters.maxPrice && price > Number(filters.maxPrice)) return false;

      // BRAND
      if (filters.brand.length > 0 && !filters.brand.includes(p.brand)) {
        return false;
      }

      // RATING
      if (filters.rating && Number(p.rating || 0) < Number(filters.rating)) {
        return false;
      }

      // STOCK
      if (filters.stock === "in" && (!p.totalStock || p.totalStock <= 0)) return false;
      if (filters.stock === "out" && p.totalStock > 0) return false;

      // OFFER
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
            {["", "low-high", "high-low", "a-z", "z-a"].map((item) => (
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
        <View className="flex-1 bg-[#0a0a0b]">

          {/* 🔥 HEADER */}
          <View className="flex-row justify-between items-center px-4 py-4 border-b border-sky-500/20">
            <Text className="text-primary font-semibold text-lg">Filters</Text>

            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Text className="text-white text-xl">✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="p-4">

            {/* 🔥 PRICE RANGE */}
            <Text className="text-primary mb-2">Price Range</Text>

            <Slider
              minimumValue={minPrice}
              maximumValue={maxPrice}
              value={filters.maxPrice ? Number(filters.maxPrice) : maxPrice}
              onValueChange={(val) =>
                setFilters({ ...filters, maxPrice: Math.floor(val).toString() })
              }
              minimumTrackTintColor="#0EA5E9"
              maximumTrackTintColor="#374151"
              thumbTintColor="#0EA5E9"
            />

            <Text className="text-xs text-gray-400 mt-1 mb-4">
              ₹{minPrice} - ₹{filters.maxPrice || maxPrice}
            </Text>

            {/* 🔥 BRANDS */}
            <Text className="text-primary mb-2">Brands</Text>

            {brands.map((b) => (
              <TouchableOpacity
                key={b}
                onPress={() => {
                  if (filters.brand.includes(b)) {
                    setFilters({
                      ...filters,
                      brand: filters.brand.filter((item) => item !== b),
                    });
                  } else {
                    setFilters({
                      ...filters,
                      brand: [...filters.brand, b],
                    });
                  }
                }}
                className="flex-row items-center mb-2"
              >
                <View
                  className={`w-4 h-4 mr-2 rounded border ${filters.brand.includes(b)
                      ? "bg-primary border-primary"
                      : "border-gray-500"
                    }`}
                />
                <Text className="text-gray-300">{b}</Text>
              </TouchableOpacity>
            ))}

            {/* 🔥 RATINGS */}
            <Text className="text-primary mt-4 mb-2">Ratings</Text>

            {[
              { label: "All Ratings", value: "" },
              { label: "4★ & up", value: "4" },
              { label: "3★ & up", value: "3" },
            ].map((r) => (
              <TouchableOpacity
                key={r.label}
                onPress={() => setFilters({ ...filters, rating: r.value })}
                className="flex-row items-center mb-2"
              >
                <View
                  className={`w-4 h-4 mr-2 rounded-full border ${filters.rating === r.value
                      ? "border-primary"
                      : "border-gray-500"
                    }`}
                >
                  {filters.rating === r.value && (
                    <View className="w-2 h-2 bg-primary rounded-full m-auto" />
                  )}
                </View>
                <Text className="text-gray-300">{r.label}</Text>
              </TouchableOpacity>
            ))}

            {/* 🔥 STOCK */}
            <Text className="text-primary mt-4 mb-2">Availability</Text>

            {[
              { label: "All", value: "" },
              { label: "In Stock", value: "in" },
              { label: "Out of Stock", value: "out" },
            ].map((s) => (
              <TouchableOpacity
                key={s.label}
                onPress={() => setFilters({ ...filters, stock: s.value })}
                className="flex-row items-center mb-2"
              >
                <View
                  className={`w-4 h-4 mr-2 rounded-full border ${filters.stock === s.value
                      ? "border-primary"
                      : "border-gray-500"
                    }`}
                >
                  {filters.stock === s.value && (
                    <View className="w-2 h-2 bg-primary rounded-full m-auto" />
                  )}
                </View>
                <Text className="text-gray-300">{s.label}</Text>
              </TouchableOpacity>
            ))}

            {/* 🔥 OFFER */}
            <TouchableOpacity
              onPress={() => setFilters({ ...filters, offer: !filters.offer })}
              className="flex-row items-center mt-4 mb-4"
            >
              <View
                className={`w-4 h-4 mr-2 rounded border ${filters.offer
                    ? "bg-primary border-primary"
                    : "border-gray-500"
                  }`}
              />
              <Text className="text-gray-300">Offers Only</Text>
            </TouchableOpacity>

            {/* 🔥 CLEAR BUTTON */}
            <TouchableOpacity
              onPress={() =>
                setFilters({
                  minPrice: "",
                  maxPrice: "",
                  brand: [],
                  rating: "",
                  stock: "",
                  offer: false,
                })
              }
              className="w-full bg-primary/20 border border-primary py-2 rounded-lg mb-3"
            >
              <Text className="text-primary text-center font-medium">
                Clear Filters
              </Text>
            </TouchableOpacity>

            {/* 🔥 APPLY BUTTON */}
            <TouchableOpacity
              onPress={() => setShowFilters(false)}
              className="w-full bg-primary py-2 rounded-lg"
            >
              <Text className="text-black text-center font-semibold">
                Apply Filters
              </Text>
            </TouchableOpacity>

          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}