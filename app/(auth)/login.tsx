import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS } from '../../theme/colors';

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [secure, setSecure] = useState(true);

  const { login } = useAuth();

  const handleLogin = async () => {
    if (loading) return;
    if (!identifier.trim() || !password.trim()) {
      Alert.alert('Missing Details', 'Please enter both email and password');
      return;
    }
    setLoading(true);
    try {
      const userData = await login(identifier, password);
      
      // Determine dashboard based on role
      const roleStr = userData?.role?.toLowerCase() || '';
      console.log('Login successful, role:', roleStr);
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Login failed';
      Alert.alert('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAwareScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 }}
      enableOnAndroid={true}
      extraScrollHeight={20}
      keyboardShouldPersistTaps="handled"
    >
      {/* Logo */}
      <View className="items-center mb-10">
        <Image
          source={require('../../assets/images/logo_no_bg.png')}
          className="w-[120px] h-[120px] mb-3"
          resizeMode="contain"
        />
        <Text className="text-2xl font-bold text-text-primary">
          Car Service Login
        </Text>
        <Text className="text-sm text-text-secondary mt-1 text-center">
          Sign in to manage services & bookings
        </Text>
      </View>

      {/* Email / Username */}
      <View className="flex-row items-center bg-card rounded-2xl px-4 py-4 mb-5">
        <Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} />
        <TextInput
          placeholder="Email or Username"
          placeholderTextColor={COLORS.textMuted}
          value={identifier}
          onChangeText={setIdentifier}
          className="flex-1 text-text-primary ml-3 text-[15px]"
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>

      {/* Password */}
      <View className="flex-row items-center bg-card rounded-2xl px-4 py-4 mb-5">
        <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} />
        <TextInput
          placeholder="Password"
          placeholderTextColor={COLORS.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={secure}
          className="flex-1 text-text-primary ml-3 text-[15px]"
        />
        <TouchableOpacity onPress={() => setSecure(!secure)}>
          <Ionicons
            name={secure ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={COLORS.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Sign In Button */}
      <TouchableOpacity
        onPress={handleLogin}
        disabled={loading}
        activeOpacity={0.8}
        className="mt-3 items-center"
      >
        <View className="rounded-full overflow-hidden">
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="flex-row py-4 px-10 justify-center items-center"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="log-in-outline" size={20} color="#fff" />
                <Text className="text-text-primary font-bold text-base ml-2 tracking-wide">
                  Login
                </Text>
              </>
            )}
          </LinearGradient>
        </View>
      </TouchableOpacity>

      {/* Register */}
      <Text
        onPress={() => router.push('/(auth)/register')}
        className="text-center text-text-secondary mt-6 text-sm"
      >
        Don't have an account?{' '}
        <Text className="text-accent">Register</Text>
      </Text>
    </KeyboardAwareScrollView>
  );
}