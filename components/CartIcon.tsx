import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCart } from '../contexts/CartContext';

export default function CartIcon() {
  const { totalItems } = useCart();

  return (
    <TouchableOpacity
      onPress={() => router.push('/cart')}
      style={styles.container}
      activeOpacity={0.7}
    >
      <Ionicons name="cart-outline" size={24} color="#fff" />
      {totalItems > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{totalItems > 9 ? '9+' : totalItems}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginRight: 15,
    padding: 5,
  },
  badge: {
    position: 'absolute',
    right: -2,
    top: -2,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#2563eb',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
