import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, ImageBackground, TouchableOpacity, Image, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiService, Service } from '../../services/api';
import { COLORS } from '../../theme/colors';
import { LinearGradient } from 'expo-linear-gradient';

export default function ServiceDetailsScreen() {
  const { id, name } = useLocalSearchParams();
  const router = useRouter();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchServiceDetails();
    }
  }, [id]);

  useEffect(() => {
    if (service?.name) {
      router.setParams({ title: service.name });
    }
  }, [service]);


  const fetchServiceDetails = async () => {
    try {
      setLoading(true);
      const selectedId = typeof id === 'string' ? parseInt(id, 10) : parseInt(id[0], 10);
      if (!isNaN(selectedId)) {
        const data = await apiService.getServiceById(selectedId);
        setService(data);
      }
    } catch (error) {
      console.error('Error fetching service details:', error);
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
        <Text className="mt-4 text-[#94A3B8]">Loading details...</Text>
      </View>
    );
  }

  if (!service) {
    return (
      <View className="flex-1 justify-center items-center bg-[#0B1120]">
        <Text className="text-[#94A3B8] mb-4">Service not found.</Text>
        <TouchableOpacity onPress={() => router.back()} className="px-6 py-2 bg-[#1F2937] rounded-full">
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const imageUri = getServiceImage((service as any)?.image || (service as any)?.images?.[0]);

  return (
    <ImageBackground
      source={{ uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQfAJ3Ai3tu58SWAJ2mK_EhozE-OIgQXcLXNg&s' }}
      className="flex-1"
    >
      <View className="absolute inset-0 bg-black/85" />
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>

        {/* Back Button */}
        <TouchableOpacity onPress={() => router.back()} className="mb-6 self-start bg-[#1F2937] px-4 py-2 rounded-full flex-row items-center border border-gray-700">
          <Text className="text-white text-xs font-bold tracking-[0.5px]">← Back</Text>
        </TouchableOpacity>

        {imageUri && (
          <View className="w-full h-[220px] mb-6 rounded-2xl overflow-hidden shadow-2xl border border-[#0EA5E9]/20">
            <Image source={{ uri: imageUri }} className="w-full h-full" resizeMode="cover" />
          </View>
        )}

        <Text className="text-white text-3xl font-bold mb-2">
          {service.name}
        </Text>

        {service.price ? (
          <Text className="text-[#0EA5E9] text-2xl font-bold mb-6">
            {service.price}
          </Text>
        ) : (
          <Text className="text-[#64748B] italic text-lg mb-6">Price on request</Text>
        )}

        <View className="bg-[#111827]/80 p-5 rounded-[20px] border border-[#1F2937] mb-6">
          <Text className="text-white font-semibold text-lg mb-3 border-b border-[#1F2937] pb-2">About this Service</Text>
          <Text className="text-[#94A3B8] text-[15px] leading-7">
            {service.description || "No detailed description available for this service."}
          </Text>
        </View>

        {/* <TouchableOpacity
          onPress={() => Alert.alert('Booking', 'Booking flow coming soon!')}
          activeOpacity={0.8}
          className="rounded-full overflow-hidden w-full mt-2"
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 30 }}
            className="py-4 justify-center items-center h-[55px]"
          >
            <Text className="text-white font-bold text-[15px] tracking-[1px]">Book Service Now</Text>
          </LinearGradient>
        </TouchableOpacity> */}
      </ScrollView>
    </ImageBackground>
  );
}
