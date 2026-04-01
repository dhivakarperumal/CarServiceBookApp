import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Link, router } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // TODO: Implement actual login logic
    if (email && password) {
      // Simulate login success
      Alert.alert('Login Successful', 'Welcome back!');
      router.replace('/(tabs)');
    } else {
      Alert.alert('Error', 'Please fill in all fields');
    }
  };

  return (
    <View className="flex-1 bg-white justify-center px-6">
      <Text className="text-3xl font-bold text-gray-800 text-center mb-8">
        Login
      </Text>

      <View className="mb-4">
        <Text className="text-gray-600 mb-2">Email</Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3"
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View className="mb-6">
        <Text className="text-gray-600 mb-2">Password</Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3"
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      <TouchableOpacity
        className="bg-blue-600 py-3 rounded-lg mb-4"
        onPress={handleLogin}
      >
        <Text className="text-white text-center font-semibold">Login</Text>
      </TouchableOpacity>

      <View className="flex-row justify-center">
        <Text className="text-gray-600">Don&apos;t have an account? </Text>
        <Link href="/register" className="text-blue-600 font-semibold">
          Register
        </Link>
      </View>
    </View>
  );
}