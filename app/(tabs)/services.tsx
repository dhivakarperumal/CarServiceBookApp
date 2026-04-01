import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { apiService, Service } from '../../services/api';

export default function ServicesScreen() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="mt-4 text-gray-600">Loading services...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-6">
        <Text className="text-2xl font-bold text-gray-800 mb-6">
          Car Services
        </Text>

        {services.length === 0 ? (
          <Text className="text-gray-600 text-center">No services available</Text>
        ) : (
          services.map((service) => (
            <TouchableOpacity
              key={service.id}
              className="bg-gray-50 p-4 rounded-lg mb-4 border border-gray-200"
            >
              <Text className="text-lg font-semibold text-gray-800 mb-2">
                {service.name}
              </Text>
              <Text className="text-gray-600 mb-2">
                {service.description}
              </Text>
              {service.price && (
                <Text className="text-blue-600 font-bold">
                  {service.price}
                </Text>
              )}
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}