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
  View
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS } from '../../theme/colors';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [secure, setSecure] = useState(true);
  const [secureConfirm, setSecureConfirm] = useState(true);

  const { register } = useAuth();

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleRegister = async () => {
    if (loading) return;

    if (!username.trim()) return Alert.alert('Username Required', 'Please enter your username');
    if (!email.trim()) {
      return Alert.alert('Email Required', 'Please enter your email');
    }

    if (!isValidEmail(email)) {
      return Alert.alert('Invalid Email', 'Please enter a valid email address');
    }
    if (!mobile.trim()) return Alert.alert('Mobile Required', 'Please enter your mobile number');
    if (mobile.length !== 10) return Alert.alert('Invalid Mobile', 'Enter a valid 10 digit mobile number');
    if (password.length < 6) return Alert.alert('Weak Password', 'Password must be at least 6 characters');
    if (password !== confirmPassword) return Alert.alert('Password Mismatch', 'Passwords do not match');

    setLoading(true);
    try {
      const isAdmin = adminCode === 'ADMIN123DENTAL';
      await register({ username, email, mobile, password, role: isAdmin ? 'admin' : 'user' });
      Alert.alert('Account Created', 'Your account was created successfully');
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Something went wrong';
      Alert.alert('Register Failed', String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">

      {/* Logo */}
      <View className="items-center pt-5 mb-6">
        <Image
          source={require('../../assets/images/logo_no_bg.png')}
          className="w-[110px] h-[110px] mb-2"
          resizeMode="contain"
        />
        <Text className="text-2xl font-bold text-text-primary mt-1">
          Create Account
        </Text>
        <Text className="text-sm text-text-secondary mt-1 text-center">
          Register to access car service features
        </Text>
      </View>

      {/* FORM */}
      <KeyboardAwareScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* Username */}
        <View className="flex-row items-center bg-card rounded-2xl px-4 py-4 mb-4">
          <Ionicons name="person-outline" size={20} color={COLORS.textSecondary} />
          <TextInput
            placeholder="Username"
            placeholderTextColor={COLORS.textMuted}
            value={username}
            onChangeText={setUsername}
            className="flex-1 text-text-primary ml-3"
          />
        </View>

        {/* Mobile */}
        <View className="flex-row items-center bg-card rounded-2xl px-4 py-4 mb-4">
          <Ionicons name="call-outline" size={20} color={COLORS.textSecondary} />
          <TextInput
            placeholder="Mobile Number"
            placeholderTextColor={COLORS.textMuted}
            value={mobile}
            onChangeText={(t) => setMobile(t.replace(/[^0-9]/g, ''))}
            keyboardType="numeric"
            maxLength={10}
            className="flex-1 text-text-primary ml-3"
          />
        </View>

        {/* Email */}
        <View className="flex-row items-center bg-card rounded-2xl px-4 py-4 mb-4">
          <Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} />
          <TextInput
            placeholder="Email"
            placeholderTextColor={COLORS.textMuted}
            value={email}
            onChangeText={setEmail}
            className="flex-1 text-text-primary ml-3"
          />
        </View>

        {/* Password */}
        <View className="flex-row items-center bg-card rounded-2xl px-4 py-4 mb-4">
          <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} />
          <TextInput
            placeholder="Password"
            placeholderTextColor={COLORS.textMuted}
            secureTextEntry={secure}
            value={password}
            onChangeText={setPassword}
            className="flex-1 text-text-primary ml-3"
          />
          <TouchableOpacity onPress={() => setSecure(!secure)}>
            <Ionicons name={secure ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Confirm Password */}
        <View className="flex-row items-center bg-card rounded-2xl px-4 py-4 mb-4">
          <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} />
          <TextInput
            placeholder="Confirm Password"
            placeholderTextColor={COLORS.textMuted}
            secureTextEntry={secureConfirm}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            className="flex-1 text-text-primary ml-3"
          />
          <TouchableOpacity onPress={() => setSecureConfirm(!secureConfirm)}>
            <Ionicons name={secureConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* BUTTON */}
        <View className="items-center mt-6 mb-8">
          <TouchableOpacity
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
            className="w-52"
          >
            {/* ✅ Wrapper controls border radius */}
            <View className="rounded-full overflow-hidden">

              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="flex-row w-full py-4 justify-center items-center"
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="person-add-outline" size={20} color="#fff" />
                    <Text className="text-text-primary font-bold text-base ml-2">
                      Register
                    </Text>
                  </>
                )}
              </LinearGradient>

            </View>
          </TouchableOpacity>

          <Text className="text-center text-text-secondary mt-5 text-sm">
            Already have an account?{' '}
            <Text className="text-accent" onPress={() => router.push('/(auth)/login')}>
              Login
            </Text>
          </Text>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}