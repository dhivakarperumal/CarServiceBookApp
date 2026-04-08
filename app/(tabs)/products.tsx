// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   TouchableOpacity,
//   ActivityIndicator,
//   Alert,
//   Image,
//   Dimensions,
//   TextInput,
//   RefreshControl,
//   SafeAreaView,
// } from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient';
// import { apiService } from '../../services/api';
// import { COLORS } from '../../theme/colors';
// import { useFavorites } from '../../contexts/FavoriteContext';
// import { useRouter } from 'expo-router';
// import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// const { width } = Dimensions.get('window');
// const COLUMN_WIDTH = (width - 48) / 2;

// interface ApiProduct {
//   docId: number | string;
//   id: string;
//   name: string;
//   slug: string;
//   brand: string;
//   description: string | null;
//   mrp: number | string;
//   offer: number | string;
//   offerPrice: number | string;
//   tags: string[];
//   isFeatured: boolean;
//   isActive: boolean;
//   rating: string;
//   variants: any[];
//   images: string[];
//   category?: string;
//   thumbnail?: string;
// }

// const CATEGORIES = ['All', 'Engine', 'Exterior', 'Interior', 'Electronics', 'Brakes', 'Suspension'];

// export default function ProductsScreen() {
//   const router = useRouter();
//   const [products, setProducts] = useState<ApiProduct[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [search, setSearch] = useState("");
//   const [selectedCategory, setSelectedCategory] = useState("All");
//   const { toggleFavorite, isFavorite } = useFavorites();

//   useEffect(() => {
//     fetchProducts();
//   }, []);

//   const fetchProducts = async () => {
//     try {
//       const data = await apiService.getProducts();
//       setProducts(data as any[]);
//     } catch (error) {
//       console.error('Error fetching products:', error);
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   };

//   const onRefresh = () => {
//     setRefreshing(true);
//     fetchProducts();
//   };

//   const getProductImage = (item: ApiProduct): string | null => {
//     if (item.thumbnail) return item.thumbnail;
//     if (item.images && item.images.length > 0) return item.images[0];
//     return null;
//   };

//   const filteredProducts = products.filter(p => {
//     const matchesSearch = p.name?.toLowerCase().includes(search.toLowerCase()) || 
//                          p.brand?.toLowerCase().includes(search.toLowerCase());
//     const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
//     return matchesSearch && matchesCategory && p.isActive;
//   });

//   const renderProductItem = ({ item }: { item: ApiProduct }) => {
//     const imageUrl = getProductImage(item);
//     const hasOffer = Number(item.offer) > 0;

//     return (
//       <TouchableOpacity
//         style={{ width: COLUMN_WIDTH }}
//         onPress={() => router.push(`/product/${item.slug}` as any)}
//         className="mb-6 bg-slate-900 border border-white/5 rounded-[32px] overflow-hidden shadow-2xl relative"
//       >
//         {/* Favorite Button */}
//         <TouchableOpacity 
//           onPress={() => toggleFavorite(item.docId as number)}
//           className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/40 items-center justify-center backdrop-blur-md"
//         >
//           <Ionicons 
//             name={isFavorite(item.docId as number) ? "heart" : "heart-outline"} 
//             size={16} 
//             color={isFavorite(item.docId as number) ? "#ef4444" : "white"} 
//           />
//         </TouchableOpacity>

//         {/* Product Image */}
//         <View className="relative h-44 w-full bg-slate-800">
//           {imageUrl ? (
//             <Image source={{ uri: imageUrl || undefined }} className="w-full h-full" resizeMode="cover" />
//           ) : (
//             <View className="w-full h-full items-center justify-center">
//               <MaterialCommunityIcons name="image-off" size={32} color="#1e293b" />
//             </View>
//           )}
//           {hasOffer && (
//              <LinearGradient 
//                colors={['#0ea5e9', '#3b82f6']} 
//                start={{x:0,y:0}} end={{x:1,y:1}}
//                className="absolute top-3 left-3 px-2 py-1 rounded-lg"
//              >
//                <Text className="text-white text-[8px] font-black uppercase">{item.offer}% OFF</Text>
//              </LinearGradient>
//           )}
//         </View>

//         {/* Content */}
//         <View className="p-4">
//            <Text className="text-white font-black text-xs uppercase tracking-tighter" numberOfLines={1}>{item.name}</Text>
//            <Text className="text-slate-500 text-[8px] font-black uppercase mt-0.5">{item.brand || 'Premium Quality'}</Text>
           
//            <View className="flex-row items-center justify-between mt-3">
//               <View>
//                  <Text className="text-sky-400 font-black text-sm">₹ {item.offerPrice || item.mrp}</Text>
//                  {hasOffer && (
//                     <Text className="text-slate-600 text-[10px] line-through">₹ {item.mrp}</Text>
//                  )}
//               </View>
//               <View className="flex-row items-center">
//                  <Ionicons name="star" size={10} color="#fbbf24" />
//                  <Text className="text-amber-500 text-[10px] font-bold ml-1">{item.rating || '4.5'}</Text>
//               </View>
//            </View>

//            <TouchableOpacity 
//              onPress={() => router.push(`/product/${item.slug}` as any)}
//              className="mt-4 bg-white/5 py-3 rounded-2xl items-center border border-white/5"
//            >
//               <Text className="text-white font-black text-[9px] uppercase tracking-widest">View Detail →</Text>
//            </TouchableOpacity>
//         </View>
//       </TouchableOpacity>
//     );
//   };

//   return (
//     <SafeAreaView className="flex-1 bg-slate-950">
//       <View className="flex-1 p-4">
//         {/* HEADER */}
//         <View className="flex-row justify-between items-center mb-6 px-2">
//            <View>
//               <Text className="text-white font-black text-2xl uppercase tracking-tighter">Spare Parts</Text>
//               <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Premium Inventory Catalog</Text>
//            </View>
//            <TouchableOpacity onPress={() => router.push('/cart' as any)} className="w-12 h-12 bg-white/5 rounded-full items-center justify-center border border-white/10">
//               <Ionicons name="cart" size={20} color="white" />
//               <View className="absolute -top-1 -right-1 bg-sky-500 w-5 h-5 rounded-full items-center justify-center border-2 border-slate-950">
//                  <Text className="text-white text-[8px] font-black">2</Text>
//               </View>
//            </TouchableOpacity>
//         </View>

//         {/* SEARCH BAR */}
//         <View className="bg-slate-900 rounded-[24px] px-5 h-14 border border-white/5 flex-row items-center shadow-inner mb-6 mx-2">
//            <Ionicons name="search" size={20} color="#475569" />
//            <TextInput 
//              placeholder="Search parts, brands, keywords..." 
//              placeholderTextColor="#475569"
//              className="flex-1 ml-3 text-white font-bold text-xs"
//              value={search}
//              onChangeText={setSearch}
//            />
//            <TouchableOpacity className="bg-slate-800 p-2 rounded-xl">
//               <Ionicons name="options-outline" size={18} color="#0ea5e9" />
//            </TouchableOpacity>
//         </View>

//         {/* CATEGORIES */}
//         <View className="mb-8 h-10">
//            <FlatList 
//              horizontal
//              showsHorizontalScrollIndicator={false}
//              data={CATEGORIES}
//              keyExtractor={(item) => item}
//              renderItem={({ item }) => (
//                <TouchableOpacity 
//                  onPress={() => setSelectedCategory(item)}
//                  className={`mr-3 px-6 py-2.5 rounded-full border ${selectedCategory === item ? 'bg-sky-500 border-sky-400' : 'bg-slate-900 border-white/5'}`}
//                >
//                  <Text className={`${selectedCategory === item ? 'text-white' : 'text-slate-500'} text-[10px] font-black uppercase tracking-tighter`}>{item}</Text>
//                </TouchableOpacity>
//              )}
//              contentContainerStyle={{ paddingHorizontal: 8 }}
//            />
//         </View>

//         {/* PRODUCT LIST */}
//         {loading ? (
//           <View className="flex-1 items-center justify-center">
//              <ActivityIndicator size="large" color="#0ea5e9" />
//              <Text className="text-slate-600 text-[10px] font-black uppercase mt-4 tracking-widest">Initializing Inventory...</Text>
//           </View>
//         ) : (
//           <FlatList
//             data={filteredProducts}
//             renderItem={renderProductItem}
//             keyExtractor={(item) => String(item.docId || item.id)}
//             numColumns={2}
//             columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 8 }}
//             showsVerticalScrollIndicator={false}
//             refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0ea5e9" />}
//             contentContainerStyle={{ paddingBottom: 100 }}
//             ListEmptyComponent={() => (
//               <View className="flex-1 items-center justify-center pt-20">
//                  <MaterialCommunityIcons name="package-variant" size={64} color="#1e293b" />
//                  <Text className="text-white font-black text-sm mt-6 uppercase">No Components Found</Text>
//                  <Text className="text-slate-500 text-[10px] mt-2 font-bold uppercase">Try another category or search term</Text>
//               </View>
//             )}
//           />
//         )}
//       </View>
//     </SafeAreaView>
//   );
// }


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
import { useCart } from '../../contexts/CartContext';
import { useFavorites } from '../../contexts/FavoriteContext';
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
  const { toggleFavorite, isFavorite } = useFavorites();

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
              <Image source={{ uri: imageUri }} className="w-full h-[110px] rounded-xl" resizeMode="cover" />
            ) : (
              <View className="w-full h-[110px] rounded-xl bg-[#1F2937]" />
            )}
            {offerPercent > 0 && (
              <View className="absolute top-1.5 left-1.5 bg-[#0EA5E9] px-2 py-1 rounded-full">
                <Text className="text-white text-[9px] font-bold tracking-[0.5px]">{offerPercent}% OFF</Text>
              </View>
            )}
            <TouchableOpacity
              className="absolute top-1.5 right-1.5 bg-black/40 p-1.5 rounded-full"
              onPress={() => toggleFavorite(item.docId)}
            >
              <Ionicons
                name={isFavorite(item.docId) ? "heart" : "heart-outline"}
                size={16}
                color={isFavorite(item.docId) ? "#ef4444" : "#fff"}
              />
            </TouchableOpacity>
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