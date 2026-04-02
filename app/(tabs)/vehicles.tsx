import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, Image, Dimensions } from 'react-native';
import { apiService, Vehicle } from '../../services/api';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 48) / 2;

export default function VehiclesScreen() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const data = await apiService.getVehicles();
      setVehicles(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load vehicles. Please try again.');
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (vehicleName: string) => {
    Alert.alert('Vehicle Details', `More info about ${vehicleName} coming soon!`);
  };

  const getVehicleImage = (imageString: string | undefined) => {
    if (!imageString) return 'https://via.placeholder.com/150?text=🚗';

    try {
      if (imageString.startsWith('[') && imageString.endsWith(']')) {
        const images = JSON.parse(imageString);
        if (Array.isArray(images) && images.length > 0) {
          const img = images[0];
          return img.startsWith('http') ? img : `https://cars.qtechx.com/${img}`;
        }
      }
      return imageString.startsWith('http') ? imageString : `https://cars.qtechx.com/${imageString}`;
    } catch (e) {
      return imageString.startsWith('http') ? imageString : `https://cars.qtechx.com/${imageString}`;
    }
  };

  const formatPrice = (price: any) => {
    if (typeof price !== 'string' && typeof price !== 'number') return '0.00';
    const priceStr = String(price);
    const numericPart = priceStr.replace(/[^0-9.]/g, '');
    return numericPart ? parseFloat(numericPart).toLocaleString() : '0.00';
  };

  const renderVehicleItem = ({ item }: { item: Vehicle }) => (
    <TouchableOpacity 
      className="bg-white rounded-xl mb-4 shadow-sm border border-gray-100 overflow-hidden" 
      style={{ width: COLUMN_WIDTH, margin: 6 }}
      onPress={() => handleViewDetails(item.name)}
    >
      <Image
        source={{ uri: getVehicleImage(item.image) }}
        className="w-full h-40 bg-gray-100"
        resizeMode="cover"
      />
      <View className="p-3">
        <Text className="text-sm font-semibold text-gray-800 mb-1" numberOfLines={1}>
          {item.name}
        </Text>
        <Text className="text-gray-500 text-[11px] mb-2 leading-4">
          Year: {item.year}
        </Text>
        <View className="flex-row justify-between items-center mt-1">
          <Text className="text-green-600 font-bold text-sm">
            ${formatPrice(item.price)}
          </Text>
          <View className="bg-blue-50 px-2 py-1 rounded">
            <Text className="text-blue-600 text-[10px] font-bold">Details</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="mt-4 text-gray-600">Loading vehicles...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={vehicles}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderVehicleItem}
        numColumns={2}
        contentContainerStyle={{ padding: 12 }}
        ListHeaderComponent={() => (
          <View className="px-3 py-4">
            <Text className="text-2xl font-bold text-gray-800">
              Available Vehicles
            </Text>
            <Text className="text-gray-500 mt-1">
              Browse our selection of quality vehicles
            </Text>
          </View>
        )}
        ListEmptyComponent={() => (
          <View className="flex-1 items-center justify-center pt-20">
            <Text className="text-gray-400">No vehicles available</Text>
          </View>
        )}
        ListFooterComponent={() => (
          <View className="p-4 mb-6">
            <View className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
              <Text className="text-yellow-800 font-semibold text-center text-sm">
                Financing available - Apply now!
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}