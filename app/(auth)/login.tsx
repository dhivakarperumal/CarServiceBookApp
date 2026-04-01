import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();

  const handleLogin = async () => {
    if (loading) return;

    if (!identifier.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      await login(identifier, password);
      Alert.alert('Login Successful', 'Welcome back!');
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Login failed:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    Alert.alert('Google Login', 'Google Login is disabled. Please use standard login.');
  };

  return (
    <View className="flex-1 bg-white justify-center px-6">
      {/* Logo/Title */}
      <View className="items-center mb-8">
        <Ionicons name="car" size={60} color="#2563eb" />
        <Text className="text-2xl font-bold text-gray-800 mt-4">
          Car Service Login
        </Text>
        <Text className="text-gray-600 text-center mt-1">
          Sign in to manage services & bookings
        </Text>
      </View>

      {/* Form */}
      <View className="space-y-4">
        {/* Email/Username */}
        <View className="relative">
          <Ionicons name="mail" size={20} color="#6b7280" style={{ position: 'absolute', left: 12, top: 14 }} />
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 pl-10"
            placeholder="Email or Username"
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
          />
        </View>

        {/* Password */}
        <View className="relative">
          <Ionicons name="lock-closed" size={20} color="#6b7280" style={{ position: 'absolute', left: 12, top: 14 }} />
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 pl-10 pr-12"
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={{ position: 'absolute', right: 12, top: 14 }}
          >
            <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Login Button */}
        <TouchableOpacity
          className="bg-blue-600 py-3 rounded-lg"
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center font-semibold">Sign In</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* OR Divider */}
      <View className="flex-row items-center my-6">
        <View className="flex-1 h-px bg-gray-300" />
        <Text className="mx-4 text-gray-500 text-sm">OR</Text>
        <View className="flex-1 h-px bg-gray-300" />
      </View>

      {/* Google Login */}
      <TouchableOpacity
        className="border border-gray-300 py-3 rounded-lg flex-row items-center justify-center"
        onPress={handleGoogleLogin}
      >
        <Ionicons name="logo-google" size={20} color="#db4437" />
        <Text className="ml-3 text-gray-700 font-medium">Continue with Google</Text>
      </TouchableOpacity>

      {/* Register Link */}
      <View className="flex-row justify-center mt-6">
        <Text className="text-gray-600">Don&apos;t have an account? </Text>
        <Link href="/(auth)/register" className="text-blue-600 font-semibold">
          Register
        </Link>
      </View>
    </View>
  );
}