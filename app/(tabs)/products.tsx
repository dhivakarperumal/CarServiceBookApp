import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '../../services/api';

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
  images: string[]; // base64 or URL strings
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
    // Already a data URI (base64)
    if (img.startsWith('data:')) return img;
    // Full URL
    if (img.startsWith('http')) return img;
    // Relative path
    return `https://cars.qtechx.com/${img}`;
  };

  const formatPrice = (price: string | number | undefined): string => {
    if (price === undefined || price === null) return '0.00';
    const num = parseFloat(String(price).replace(/[^0-9.]/g, ''));
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0EA5E9" />
        <Text style={styles.loaderText}>Loading products...</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: ApiProduct }) => {
    const imageUri = getProductImage(item.images);
    const offerPercent = parseFloat(item.offer || '0');

    return (
      <View style={styles.card}>
        {/* Image + Badge */}
        <View style={styles.imageContainer}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder} />
          )}
          {offerPercent > 0 && (
            <View style={styles.offerBadge}>
              <Text style={styles.offerBadgeText}>{offerPercent}% OFF</Text>
            </View>
          )}
        </View>

        {/* Name */}
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>

        {/* Brand & Rating */}
        <View style={styles.brandRatingRow}>
          {item.brand ? <Text style={styles.brand}>{item.brand}</Text> : <Text />}
          {item.rating && parseFloat(item.rating) > 0 ? (
            <Text style={styles.rating}>⭐ {item.rating}</Text>
          ) : null}
        </View>

        {/* Price row */}
        <View style={styles.priceRow}>
          <Text style={styles.offerPrice}>₹ {formatPrice(item.offerPrice)}</Text>
          {offerPercent > 0 && (
            <Text style={styles.mrp}>₹ {formatPrice(item.mrp)}</Text>
          )}
        </View>

        {/* Button */}
        <TouchableOpacity
          onPress={() => Alert.alert('Purchase', `Added ${item.name} to cart!`)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#0EA5E9', '#2563EB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientButton}
          >
            <Text style={styles.gradientButtonText}>Add to Cart</Text>
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
      style={{ flex: 1 }}
    >
      <View style={styles.overlay} />
      <View style={styles.container}>
        <Text style={styles.title}>Car Products</Text>
        <Text style={styles.subtitle}>Premium parts & accessories</Text>

        <FlatList
          data={products}
          keyExtractor={(item) => String(item.docId)}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No products available at the moment</Text>
            </View>
          )}
        />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0B1120',
  },
  loaderText: {
    color: '#94A3B8',
    marginTop: 12,
    fontSize: 14,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.82)',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 20,
  },
  /* ── card ── */
  card: {
    width: '48%',
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(14,165,233,0.2)',
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  image: {
    width: '100%',
    height: 110,
    borderRadius: 12,
  },
  imagePlaceholder: {
    width: '100%',
    height: 110,
    borderRadius: 12,
    backgroundColor: '#1F2937',
  },
  offerBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#0EA5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  offerBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  brandRatingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  brand: {
    color: '#94A3B8',
    fontSize: 11,
  },
  rating: {
    color: '#FBBF24',
    fontSize: 11,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  offerPrice: {
    color: '#0EA5E9',
    fontSize: 14,
    fontWeight: '700',
    marginRight: 6,
  },
  mrp: {
    color: '#64748B',
    fontSize: 11,
    textDecorationLine: 'line-through',
  },
  gradientButton: {
    alignSelf: 'center',
    width: '90%',
    paddingVertical: 7,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  gradientButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
  },
});