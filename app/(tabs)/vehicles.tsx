import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { apiService, Vehicle } from '../../services/api';

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

  if (loading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="mt-4 text-gray-600">Loading vehicles...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-6">
        <Text className="text-2xl font-bold text-gray-800 mb-6">
          Available Vehicles
        </Text>

        <Text className="text-gray-600 mb-6">
          Browse our selection of quality vehicles
        </Text>

        {vehicles.length === 0 ? (
          <Text className="text-gray-600 text-center">No vehicles available</Text>
        ) : (
          vehicles.map((vehicle) => (
            <TouchableOpacity
              key={vehicle.id}
              className="bg-gray-50 p-4 rounded-lg mb-4 border border-gray-200"
              onPress={() => handleViewDetails(vehicle.name)}
            >
              <View className="flex-row items-center">
                <Text className="text-4xl mr-4">
                  {vehicle.image || '🚗'}
                </Text>
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-gray-800 mb-1">
                    {vehicle.name}
                  </Text>
                  <Text className="text-gray-600 mb-1">
                    Year: {vehicle.year}
                  </Text>
                  <Text className="text-green-600 font-bold text-lg">
                    {vehicle.price}
                  </Text>
                </View>
                <TouchableOpacity
                  className="bg-blue-600 px-4 py-2 rounded-lg"
                  onPress={() => handleViewDetails(vehicle.name)}
                >
                  <Text className="text-white font-semibold">Details</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}

        <View className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <Text className="text-yellow-800 font-semibold text-center">
            Financing available - Apply now!
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}