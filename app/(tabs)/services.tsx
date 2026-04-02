import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ScrollView, TouchableOpacity, ActivityIndicator, Alert, ImageBackground, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { apiService, Service } from '../../services/api';
import { COLORS } from '../../theme/colors';
import { LinearGradient } from 'expo-linear-gradient';

export default function ServicesScreen() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const data = await apiService.getServices();
      setServices(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load services. Please try again.');
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const getServiceImage = (img: string | undefined | null) => {
    if (!img) return null;
    if (img.startsWith('data:')) return img;
    if (img.startsWith('http')) return img;
    return `https://cars.qtechx.com/${img}`;
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#0B1120]">
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text className="mt-4 text-[#94A3B8]">Loading services...</Text>
      </View>
    );
  }

  const renderServiceCard = ({ item: service }: { item: Service }) => {
    const imageUri = getServiceImage((service as any).image || (service as any).images?.[0]);

    return (
      <View className="w-[48%] bg-[#111827] p-2.5 rounded-[18px] mb-5 border border-[#0EA5E9]/20">
        {/* Service Image Placeholder */}
        <View className="relative mb-2.5">
          {imageUri ? (
            <Image source={{ uri: imageUri }} className="w-full h-[110px] rounded-xl" resizeMode="cover" />
          ) : (
            <View className="w-full h-[110px] rounded-xl bg-[#1F2937] justify-center items-center">
              <Text className="text-[#94A3B8] text-xs">No Image</Text>
            </View>
          )}
        </View>

        <Text className="text-white text-[13px] font-bold mb-1" numberOfLines={1}>
          {service.name}
        </Text>
        
        <Text className="text-[#94A3B8] text-[11px] mb-2" numberOfLines={2}>
          {service.description || "No description provided."}
        </Text>
        
        <View className="flex-row items-center mb-1">
          {service.price ? (
            <Text className="text-[#0EA5E9] font-bold text-sm">
              {service.price}
            </Text>
          ) : (
            <Text className="text-[#64748B] italic text-[11px]">Price on request</Text>
          )}
        </View>

        <TouchableOpacity
          onPress={() => router.push({ pathname: '/service/[id]', params: { id: service.id } })}
          activeOpacity={0.8}
          className="rounded-full overflow-hidden w-[90%] self-center mt-1"
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 25 }}
            className="py-1.5 justify-center items-center"
          >
            <Text className="text-white font-bold text-xs tracking-[0.5px]">Details</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ImageBackground
      source={{ uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQfAJ3Ai3tu58SWAJ2mK_EhozE-OIgQXcLXNg&s' }}
      className="flex-1"
    >
      <View className="absolute inset-0 bg-black/80" />
      <View className="flex-1 p-5">
    

        <FlatList
          data={services}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderServiceCard}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListEmptyComponent={() => (
            <View className="flex-1 items-center pt-10">
              <Text className="text-[#94A3B8] text-center">No services available</Text>
            </View>
          )}
        />
      </View>
    </ImageBackground>
  );
}