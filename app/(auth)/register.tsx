import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register } = useAuth();

  const handleRegister = async () => {
    if (loading) return;

    // Validations
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!username.trim()) {
      Alert.alert('Error', 'Username is required');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Error', 'Email is required');
      return;
    }
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    if (!mobile.trim()) {
      Alert.alert('Error', 'Mobile number is required');
      return;
    }
    if (mobile.length !== 10) {
      Alert.alert('Error', 'Enter valid 10 digit mobile number');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const isAdmin = adminCode === "ADMIN123DENTAL";
      const role = isAdmin ? "admin" : "user";

      const registrationData = {
        username,
        email,
        mobile,
        password,
        role,
      };

      console.log('Registration data to send:', registrationData);

      await register(registrationData);

      Alert.alert('Success', 'Account created successfully');
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Registration failed:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data ||
        error.message ||
        'Something went wrong';
      Alert.alert('Registration Failed', String(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="justify-center px-6 py-12">
        {/* Header */}
        <View className="items-center mb-8">
          <Text className="text-3xl font-bold text-gray-800 mb-2">
            Create Account
          </Text>
          <Text className="text-gray-600 text-center">
            Register to access car service features
          </Text>
        </View>

        {/* Form Fields */}
        <View className="space-y-4">
          {/* Username */}
          <View className="relative">
            <Ionicons name="person" size={20} color="#6b7280" style={{ position: 'absolute', left: 12, top: 14 }} />
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 pl-10"
              placeholder="Username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          {/* Mobile */}
          <View className="relative">
            <Ionicons name="call" size={20} color="#6b7280" style={{ position: 'absolute', left: 12, top: 14 }} />
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 pl-10"
              placeholder="Mobile Number"
              value={mobile}
              onChangeText={(text) => setMobile(text.replace(/\D/g, ''))}
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>

          {/* Email */}
          <View className="relative">
            <Ionicons name="mail" size={20} color="#6b7280" style={{ position: 'absolute', left: 12, top: 14 }} />
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 pl-10"
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
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

          {/* Confirm Password */}
          <View className="relative">
            <Ionicons name="lock-closed" size={20} color="#6b7280" style={{ position: 'absolute', left: 12, top: 14 }} />
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 pl-10 pr-12"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={{ position: 'absolute', right: 12, top: 14 }}
            >
              <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Admin Code (Optional) */}
          <View className="relative">
            <Ionicons name="shield-checkmark" size={20} color="#6b7280" style={{ position: 'absolute', left: 12, top: 14 }} />
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 pl-10"
              placeholder="Admin Code (Optional)"
              value={adminCode}
              onChangeText={setAdminCode}
              autoCapitalize="characters"
            />
          </View>
        </View>

        {/* Register Button */}
        <TouchableOpacity
          className="bg-green-600 py-3 rounded-lg mt-6 mb-4"
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center font-semibold">Register</Text>
          )}
        </TouchableOpacity>

        {/* Login Link */}
        <View className="flex-row justify-center">
          <Text className="text-gray-600">Already have an account? </Text>
          <Link href="/(auth)/login" className="text-blue-600 font-semibold">
            Login
          </Link>
        </View>
      </View>
    </ScrollView>
  );
}