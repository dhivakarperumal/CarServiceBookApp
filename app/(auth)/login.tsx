import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useAuth } from '../../contexts/AuthContext';

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
      await login(identifier, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Login failed';
      Alert.alert('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAwareScrollView
      style={{ flex: 1, backgroundColor: '#0B1120' }}
      contentContainerStyle={styles.container}
      enableOnAndroid={true}
      extraScrollHeight={20}
      keyboardShouldPersistTaps="handled"
    >
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/images/logo_no_bg.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Car Service Login</Text>
        <Text style={styles.subtitle}>Sign in to manage services & bookings</Text>
      </View>

      {/* Email / Username */}
      <View style={styles.inputWrapper}>
        <Ionicons name="mail-outline" size={20} color="#94A3B8" />
        <TextInput
          placeholder="Email or Username"
          placeholderTextColor="#64748B"
          value={identifier}
          onChangeText={setIdentifier}
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>

      {/* Password */}
      <View style={styles.inputWrapper}>
        <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" />
        <TextInput
          placeholder="Password"
          placeholderTextColor="#64748B"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={secure}
          style={styles.input}
        />
        <TouchableOpacity onPress={() => setSecure(!secure)}>
          <Ionicons
            name={secure ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color="#94A3B8"
          />
        </TouchableOpacity>
      </View>

      {/* Sign In Button */}
      <TouchableOpacity
        onPress={handleLogin}
        disabled={loading}
        activeOpacity={0.8}
        style={{ marginTop: 10 }}
      >
        <LinearGradient
          colors={['#0EA5E9', '#2563EB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientButton}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="log-in-outline" size={20} color="#fff" />
              <Text style={styles.gradientButtonText}>Sign In</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>

      {/* Register */}
      <Text
        onPress={() => router.push('/(auth)/register')}
        style={styles.registerText}
      >
        Don't have an account?{' '}
        <Text style={{ color: '#06B6D4' }}>Register</Text>
      </Text>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 6,
    textAlign: 'center',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 15,
    marginBottom: 18,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    marginLeft: 10,
    fontSize: 15,
  },
  gradientButton: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 10,
  },
  gradientButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  registerText: {
    textAlign: 'center',
    color: '#94A3B8',
    marginTop: 24,
    fontSize: 14,
  },
});