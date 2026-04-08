import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '../../services/api';
import { COLORS } from '../../theme/colors';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useFavorites } from '../../contexts/FavoriteContext';

const { width } = Dimensions.get('window');

export default function ProductDetailsScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [reviews, setReviews] = useState<any[]>([]);

  const { addToCart } = useCart();
  const { user } = useAuth();
  const { toggleFavorite, isFavorite } = useFavorites();
  const router = useRouter();

  useEffect(() => {
    if (slug) fetchProduct();
  }, [slug]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const data = await apiService.getProductBySlug(slug);
      setProduct(data);
      setSelectedVariantIndex(0);
      setActiveImage(0);

      if (data?.docId) {
        const reviewsData = await apiService.getReviews(data.docId);
        setReviews(reviewsData.filter((r: any) => r.status === 1 || r.status === true));
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      Alert.alert('Error', 'Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const productImages = useMemo(() => {
    let imgs = product?.images;
    if (typeof imgs === 'string') {
      try {
        imgs = JSON.parse(imgs);
      } catch (e) {
        imgs = [imgs];
      }
    }
    if (Array.isArray(imgs) && imgs.length > 0) return imgs;
    if (product?.thumbnail) return [product.thumbnail];
    return ['https://via.placeholder.com/600x400?text=No+Image+Available'];
  }, [product]);

  const getImgUri = (img: string) => {
    if (!img) return 'https://via.placeholder.com/600x400?text=No+Image+Available';
    if (img.startsWith('data:')) return img;
    if (img.startsWith('http')) return img;
    // Handle leading slash
    const path = img.startsWith('/') ? img.substring(1) : img;
    return `https://cars.qtechx.com/${path}`;
  };

  const handleAddToCart = () => {
    if (!product) return;
    addToCart({
      ...product,
      quantity: qty,
      selectedVariant: product.variants?.[selectedVariantIndex]
    });
    Alert.alert('Success', 'Added to cart!');
  };

  const handleBuyNow = () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to continue');
      router.push('/(auth)/login');
      return;
    }

    const variant = product.variants?.[selectedVariantIndex] || {};
    const itemData = {
      docId: product.docId,
      sku: variant.sku,
      name: product.name,
      price: product.offerPrice,
      image: productImages[0],
      quantity: qty,
      variant: (variant.position || variant.material)
        ? `${variant.position || ''} ${variant.material || ''}`.trim()
        : variant.sku,
    };

    router.push({
      pathname: '/checkout',
      params: { isBuyNow: 'true', product: JSON.stringify(itemData) }
    });
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#0F172A]">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View className="flex-1 justify-center items-center bg-[#0F172A]">
        <Text className="text-white text-lg">Product not found</Text>
      </View>
    );
  }

  const currentVariant = product.variants?.[selectedVariantIndex] || {};
  const stockAvailable = currentVariant.stock || 0;

  return (
    <View className="flex-1 bg-[#0F172A]">
      <ScrollView showsVerticalScrollIndicator={false}>
        <Stack.Screen options={{
          title: product.name,
          headerBackTitle: 'Back',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => toggleFavorite(product.docId)}
              className="mr-2"
            >
              <Ionicons
                name={isFavorite(product.docId) ? "heart" : "heart-outline"}
                size={24}
                color={isFavorite(product.docId) ? "#ef4444" : "#fff"}
              />
            </TouchableOpacity>
          )
        }} />

        {/* Image Gallery */}
        <View className="bg-[#1E293B] pb-5">
          <Image
            source={{ uri: getImgUri(productImages[activeImage]) }}
            style={{ width: width, height: 300 }}
            resizeMode="contain"
          />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 mt-4">
            {productImages.map((img: string, i: number) => (
              <TouchableOpacity
                key={i}
                onPress={() => setActiveImage(i)}
                className={`w-14 h-14 rounded-lg mr-2.5 border p-1 bg-[#0F172A] ${activeImage === i ? 'border-[#0EA5E9]' : 'border-[#334155]'}`}
              >
                <Image source={{ uri: getImgUri(img) }} className="w-full h-full rounded" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Product Info */}
        <View className="p-5">
          <Text className="text-[#94A3B8] text-sm mb-1">{product.brand}</Text>
          <Text className="text-white text-2xl font-bold mb-4">{product.name}</Text>

          <View className="flex-row items-center mb-2.5">
            <Text className="text-[#0EA5E9] text-3xl font-bold mr-2.5">₹{product.offerPrice}</Text>
            <Text className="text-[#64748B] text-lg line-through mr-4">₹{product.mrp}</Text>
            {product.offer && (
              <View className="bg-[#10B981] px-2 py-1 rounded-md">
                <Text className="text-white text-xs font-bold">{product.offer}% OFF</Text>
              </View>
            )}
          </View>

          <View className="flex-row items-center">
            <Ionicons name="star" size={16} color="#FBBF24" />
            <Text className="text-[#94A3B8] text-sm ml-1">{product.rating || '0.0'} Rating</Text>
          </View>

          <View className="h-[1] bg-[#334155] my-5" />

          {/* Variants */}
          {product.variants?.length > 0 && (
            <View className="mb-6">
              <Text className="text-white text-lg font-bold mb-4">Select Variant</Text>
              <View className="flex-row flex-wrap">
                {product.variants.map((v: any, i: number) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => setSelectedVariantIndex(i)}
                    className={`bg-[#111827] border px-4 py-2 rounded-full mr-2.5 mb-2.5 ${selectedVariantIndex === i ? 'border-[#0EA5E9] bg-[#0EA5E920]' : 'border-[#334155]'}`}
                  >
                    <Text className={`text-sm ${selectedVariantIndex === i ? 'text-[#0EA5E9] font-bold' : 'text-[#94A3B8]'}`}>
                      {v.sku}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Quantity */}
          <View className="mb-6">
            <Text className="text-white text-lg font-bold mb-4">Quantity</Text>
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => setQty(Math.max(1, qty - 1))}
                className="bg-[#334155] w-9 h-9 rounded-xl justify-center items-center"
              >
                <Ionicons name="remove" size={20} color="#fff" />
              </TouchableOpacity>
              <Text className="text-white text-lg font-bold mx-5">{qty}</Text>
              <TouchableOpacity
                onPress={() => setQty(Math.min(stockAvailable || 99, qty + 1))}
                className="bg-[#334155] w-9 h-9 rounded-xl justify-center items-center"
              >
                <Ionicons name="add" size={20} color="#fff" />
              </TouchableOpacity>
              <Text className="text-[#64748B] text-xs ml-4">
                {stockAvailable > 0 ? `${stockAvailable} in stock` : 'Out of stock'}
              </Text>
            </View>
          </View>

          {/* Description */}
          <View className="mb-6">
            <Text className="text-white text-lg font-bold mb-4">Description</Text>
            <Text className="text-[#CBD5E1] text-[15px] leading-6">{product.description}</Text>
          </View>

          {/* Reviews */}
          {/* <View className="mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-white text-lg font-bold">Reviews ({reviews.length})</Text>
              <TouchableOpacity>
                <Text className="text-[#0EA5E9] font-bold">Write a review</Text>
              </TouchableOpacity>
            </View>
            {reviews.length === 0 ? (
              <Text className="text-[#64748B] italic">No reviews yet.</Text>
            ) : (
              reviews.map((rev: any, i: number) => (
                <View key={i} className="bg-[#1E293B] p-4 rounded-xl mb-2.5">
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-white font-bold">{rev.name}</Text>
                    <View className="flex-row">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Ionicons
                          key={s}
                          name={s <= rev.rating ? "star" : "star-outline"}
                          size={12}
                          color="#FBBF24"
                        />
                      ))}
                    </View>
                  </View>
                  <Text className="text-[#94A3B8] text-sm">{rev.message}</Text>
                </View>
              ))
            )}
          </View> */}
        </View>

        <View className="h-32" />
      </ScrollView>

      {/* Fixed Footer Buttons */}
      <View className="px-5 pt-4 pb-9 bg-[#1E293B] border-t border-[#334155] flex-row gap-4 absolute bottom-0 w-full">
        <TouchableOpacity
          onPress={handleAddToCart}
          activeOpacity={0.8}
          className="flex-1"
        >
          <View className="h-14 rounded-2xl overflow-hidden">
            <LinearGradient
              colors={['#2563EB', '#0EA5E9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="flex-1 justify-center items-center"
            >
              <Text className="text-white text-base font-bold">
                Add to Cart
              </Text>
            </LinearGradient>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleBuyNow}
          activeOpacity={0.8}
          className="flex-1 border border-[#0EA5E9] rounded-2xl overflow-hidden"
        >
          <View className="h-14 justify-center items-center bg-transparent">
            <Text className="text-[#0EA5E9] text-base font-bold">Buy Now</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}
