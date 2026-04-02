import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';

export default function HomeScreen() {
  const quickActions = [
    { title: 'Book Service', description: 'Schedule a car service', route: '/booking' },
    { title: 'Shop Products', description: 'Buy car parts & accessories', route: '/products' },
    { title: 'View Vehicles', description: 'Browse available cars', route: '/vehicles' },
    { title: 'Service History', description: 'View past services', route: '/services' },
  ];

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-6">
        <Text className="text-3xl font-bold text-gray-800 mb-2">
          Welcome back!
        </Text>
        <Text className="text-gray-600 mb-8">
          Your car service companion
        </Text>

        <View className="mb-8">
          <Text className="text-xl font-semibold text-gray-800 mb-4">
            Quick Actions
          </Text>
          {quickActions.map((action, index) => (
            <Link key={index} href={action.route} asChild>
              <TouchableOpacity className="bg-blue-50 p-4 rounded-lg mb-3 border border-blue-200">
                <Text className="text-lg font-semibold text-blue-800 mb-1">
                  {action.title}
                </Text>
                <Text className="text-blue-600">
                  {action.description}
                </Text>
              </TouchableOpacity>
            </Link>
          ))}
        </View>

        <View>
          <Text className="text-xl font-semibold text-gray-800 mb-4">
            Upcoming Services
          </Text>
          <View className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <Text className="text-gray-600">
              No upcoming services scheduled
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}