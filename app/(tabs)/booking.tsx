import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { apiService, Service } from '../../services/api';

export default function BookingScreen() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState('');

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

  const handleBookService = async (service: Service) => {
    try {
      // Here you would typically get the user ID from auth context
      const bookingData = {
        service_id: service.id,
        user_id: 1, // Replace with actual user ID
        date: new Date().toISOString(),
        status: 'pending',
        notes: `Booking for ${service.name}`
      };

      await apiService.createBooking(bookingData);
      setSelectedService(service.name);
      Alert.alert('Booking Confirmed', `Your ${service.name} has been booked!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to book service. Please try again.');
      console.error('Error booking service:', error);
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
          Book a Service
        </Text>

        <Text className="text-gray-600 mb-4">
          Select a service to book an appointment
        </Text>

        {services.length === 0 ? (
          <Text className="text-gray-600 text-center">No services available</Text>
        ) : (
          services.map((service) => (
            <TouchableOpacity
              key={service.id}
              className="bg-gray-50 p-4 rounded-lg mb-4 border border-gray-200"
              onPress={() => handleBookService(service)}
            >
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="text-lg font-semibold text-gray-800 mb-1">
                    {service.name}
                  </Text>
                  <Text className="text-gray-600 text-sm mb-2">
                    {service.description}
                  </Text>
                  {service.price && (
                    <Text className="text-blue-600 font-bold">
                      {service.price}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  className="bg-blue-600 px-4 py-2 rounded-lg"
                  onPress={() => handleBookService(service)}
                >
                  <Text className="text-white font-semibold">Book Now</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}

        {selectedService && (
          <View className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <Text className="text-green-800 font-semibold">
              ✓ {selectedService} booked successfully!
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}