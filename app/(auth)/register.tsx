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
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';

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

  const handleRegister = async () => {
    if (loading) return;

    if (!username.trim()) {
      Alert.alert('Username Required', 'Please enter your username');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Email Required', 'Please enter your email');
      return;
    }
    if (!mobile.trim()) {
      Alert.alert('Mobile Required', 'Please enter your mobile number');
      return;
    }
    if (mobile.length !== 10) {
      Alert.alert('Invalid Mobile', 'Enter a valid 10 digit mobile number');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const isAdmin = adminCode === 'ADMIN123DENTAL';
      await register({ username, email, mobile, password, role: isAdmin ? 'admin' : 'user' });
      Alert.alert('Account Created', 'Your account was created successfully');
      router.replace('/(tabs)');
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        error.response?.data ||
        error.message ||
        'Something went wrong';
      Alert.alert('Register Failed', String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B1120' }}>

      {/* LOGO — fixed above scroll */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/images/logo_no_bg.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Register to access car service features</Text>
      </View>

      {/* SCROLLABLE FIELDS */}
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContainer}
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Username */}
        <View style={styles.inputWrapper}>
          <Ionicons name="person-outline" size={20} color="#94A3B8" />
          <TextInput
            placeholder="Username"
            placeholderTextColor="#64748B"
            value={username}
            onChangeText={setUsername}
            style={styles.input}
            autoCapitalize="none"
          />
        </View>

        {/* Mobile */}
        <View style={styles.inputWrapper}>
          <Ionicons name="call-outline" size={20} color="#94A3B8" />
          <TextInput
            placeholder="Mobile Number"
            placeholderTextColor="#64748B"
            value={mobile}
            onChangeText={(t) => setMobile(t.replace(/[^0-9]/g, ''))}
            keyboardType="numeric"
            maxLength={10}
            style={styles.input}
          />
        </View>

        {/* Email */}
        <View style={styles.inputWrapper}>
          <Ionicons name="mail-outline" size={20} color="#94A3B8" />
          <TextInput
            placeholder="Email"
            placeholderTextColor="#64748B"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />
        </View>

       
        {/* Password */}
        <View style={styles.inputWrapper}>
          <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" />
          <TextInput
            placeholder="Password"
            placeholderTextColor="#64748B"
            secureTextEntry={secure}
            value={password}
            onChangeText={setPassword}
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

        {/* Confirm Password */}
        <View style={styles.inputWrapper}>
          <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" />
          <TextInput
            placeholder="Confirm Password"
            placeholderTextColor="#64748B"
            secureTextEntry={secureConfirm}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            style={styles.input}
          />
          <TouchableOpacity onPress={() => setSecureConfirm(!secureConfirm)}>
            <Ionicons
              name={secureConfirm ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#94A3B8"
            />
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>

      {/* FIXED BOTTOM — button + login link */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.bottomContainer}>
          <TouchableOpacity onPress={handleRegister} disabled={loading} activeOpacity={0.8}>
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
                  <Ionicons name="person-add-outline" size={20} color="#fff" />
                  <Text style={styles.gradientButtonText}>Register</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.loginRedirect}>
            Already have an account?{' '}
            <Text style={{ color: '#06B6D4' }} onPress={() => router.push('/(auth)/login')}>
              Login
            </Text>
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    alignItems: 'center',
    paddingTop: 20,
    marginBottom: 24,
  },
  logo: {
    width: 110,
    height: 110,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 6,
    textAlign: 'center',
  },
  scrollContainer: {
    paddingHorizontal: 24,
    paddingBottom: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 15,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    marginLeft: 10,
    fontSize: 15,
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingBottom: 10,
    backgroundColor: '#0B1120',
  },
  gradientButton: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 16,
  },
  gradientButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  loginRedirect: {
    textAlign: 'center',
    color: '#94A3B8',
    marginTop: 20,
    marginBottom: 10,
    fontSize: 14,
  },
});