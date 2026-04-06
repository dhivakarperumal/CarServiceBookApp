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
  TextInput,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '../../services/api';
import { COLORS } from '../../theme/colors';
import { useFavorites } from '../../contexts/FavoriteContext';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 48) / 2;

interface ApiProduct {
  docId: number | string;
  id: string;
  name: string;
  slug: string;
  brand: string;
  description: string | null;
  mrp: number | string;
  offer: number | string;
  offerPrice: number | string;
  tags: string[];
  isFeatured: boolean;
  isActive: boolean;
  rating: string;
  variants: any[];
  images: string[];
  category?: string;
  thumbnail?: string;
}

const CATEGORIES = ['All', 'Engine', 'Exterior', 'Interior', 'Electronics', 'Brakes', 'Suspension'];

export default function ProductsScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const { toggleFavorite, isFavorite } = useFavorites();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await apiService.getProducts();
      setProducts(data as any[]);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const getProductImage = (item: ApiProduct): string | null => {
    if (item.thumbnail) return item.thumbnail;
    if (item.images && item.images.length > 0) return item.images[0];
    return null;
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(search.toLowerCase()) || 
                         p.brand?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    return matchesSearch && matchesCategory && p.isActive;
  });

  const renderProductItem = ({ item }: { item: ApiProduct }) => {
    const imageUrl = getProductImage(item);
    const hasOffer = Number(item.offer) > 0;

    return (
      <TouchableOpacity
        style={{ width: COLUMN_WIDTH }}
        onPress={() => router.push(`/product/${item.slug}` as any)}
        className="mb-6 bg-slate-900 border border-white/5 rounded-[32px] overflow-hidden shadow-2xl relative"
      >
        {/* Favorite Button */}
        <TouchableOpacity 
          onPress={() => toggleFavorite(item.docId as number)}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/40 items-center justify-center backdrop-blur-md"
        >
          <Ionicons 
            name={isFavorite(item.docId as number) ? "heart" : "heart-outline"} 
            size={16} 
            color={isFavorite(item.docId as number) ? "#ef4444" : "white"} 
          />
        </TouchableOpacity>

        {/* Product Image */}
        <View className="relative h-44 w-full bg-slate-800">
          {imageUrl ? (
            <Image source={{ uri: imageUrl || undefined }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <View className="w-full h-full items-center justify-center">
              <MaterialCommunityIcons name="image-off" size={32} color="#1e293b" />
            </View>
          )}
          {hasOffer && (
             <LinearGradient 
               colors={['#0ea5e9', '#3b82f6']} 
               start={{x:0,y:0}} end={{x:1,y:1}}
               className="absolute top-3 left-3 px-2 py-1 rounded-lg"
             >
               <Text className="text-white text-[8px] font-black uppercase">{item.offer}% OFF</Text>
             </LinearGradient>
          )}
        </View>

        {/* Content */}
        <View className="p-4">
           <Text className="text-white font-black text-xs uppercase tracking-tighter" numberOfLines={1}>{item.name}</Text>
           <Text className="text-slate-500 text-[8px] font-black uppercase mt-0.5">{item.brand || 'Premium Quality'}</Text>
           
           <View className="flex-row items-center justify-between mt-3">
              <View>
                 <Text className="text-sky-400 font-black text-sm">₹ {item.offerPrice || item.mrp}</Text>
                 {hasOffer && (
                    <Text className="text-slate-600 text-[10px] line-through">₹ {item.mrp}</Text>
                 )}
              </View>
              <View className="flex-row items-center">
                 <Ionicons name="star" size={10} color="#fbbf24" />
                 <Text className="text-amber-500 text-[10px] font-bold ml-1">{item.rating || '4.5'}</Text>
              </View>
           </View>

           <TouchableOpacity 
             onPress={() => router.push(`/product/${item.slug}` as any)}
             className="mt-4 bg-white/5 py-3 rounded-2xl items-center border border-white/5"
           >
              <Text className="text-white font-black text-[9px] uppercase tracking-widest">View Detail →</Text>
           </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <View className="flex-1 p-4">
        {/* HEADER */}
        <View className="flex-row justify-between items-center mb-6 px-2">
           <View>
              <Text className="text-white font-black text-2xl uppercase tracking-tighter">Spare Parts</Text>
              <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Premium Inventory Catalog</Text>
           </View>
           <TouchableOpacity onPress={() => router.push('/cart' as any)} className="w-12 h-12 bg-white/5 rounded-full items-center justify-center border border-white/10">
              <Ionicons name="cart" size={20} color="white" />
              <View className="absolute -top-1 -right-1 bg-sky-500 w-5 h-5 rounded-full items-center justify-center border-2 border-slate-950">
                 <Text className="text-white text-[8px] font-black">2</Text>
              </View>
           </TouchableOpacity>
        </View>

        {/* SEARCH BAR */}
        <View className="bg-slate-900 rounded-[24px] px-5 h-14 border border-white/5 flex-row items-center shadow-inner mb-6 mx-2">
           <Ionicons name="search" size={20} color="#475569" />
           <TextInput 
             placeholder="Search parts, brands, keywords..." 
             placeholderTextColor="#475569"
             className="flex-1 ml-3 text-white font-bold text-xs"
             value={search}
             onChangeText={setSearch}
           />
           <TouchableOpacity className="bg-slate-800 p-2 rounded-xl">
              <Ionicons name="options-outline" size={18} color="#0ea5e9" />
           </TouchableOpacity>
        </View>

        {/* CATEGORIES */}
        <View className="mb-8 h-10">
           <FlatList 
             horizontal
             showsHorizontalScrollIndicator={false}
             data={CATEGORIES}
             keyExtractor={(item) => item}
             renderItem={({ item }) => (
               <TouchableOpacity 
                 onPress={() => setSelectedCategory(item)}
                 className={`mr-3 px-6 py-2.5 rounded-full border ${selectedCategory === item ? 'bg-sky-500 border-sky-400' : 'bg-slate-900 border-white/5'}`}
               >
                 <Text className={`${selectedCategory === item ? 'text-white' : 'text-slate-500'} text-[10px] font-black uppercase tracking-tighter`}>{item}</Text>
               </TouchableOpacity>
             )}
             contentContainerStyle={{ paddingHorizontal: 8 }}
           />
        </View>

        {/* PRODUCT LIST */}
        {loading ? (
          <View className="flex-1 items-center justify-center">
             <ActivityIndicator size="large" color="#0ea5e9" />
             <Text className="text-slate-600 text-[10px] font-black uppercase mt-4 tracking-widest">Initializing Inventory...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredProducts}
            renderItem={renderProductItem}
            keyExtractor={(item) => String(item.docId || item.id)}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 8 }}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0ea5e9" />}
            contentContainerStyle={{ paddingBottom: 100 }}
            ListEmptyComponent={() => (
              <View className="flex-1 items-center justify-center pt-20">
                 <MaterialCommunityIcons name="package-variant" size={64} color="#1e293b" />
                 <Text className="text-white font-black text-sm mt-6 uppercase">No Components Found</Text>
                 <Text className="text-slate-500 text-[10px] mt-2 font-bold uppercase">Try another category or search term</Text>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}