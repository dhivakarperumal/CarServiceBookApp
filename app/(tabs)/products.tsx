import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { apiService, Product } from '../../services/api';

export default function ProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await apiService.getProducts();
      setProducts(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load products. Please try again.');
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyProduct = (productName: string) => {
    Alert.alert('Purchase', `Added ${productName} to cart!`);
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="mt-4 text-gray-600">Loading products...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-6">
        <Text className="text-2xl font-bold text-gray-800 mb-6">
          Car Products
        </Text>

        <Text className="text-gray-600 mb-6">
          Shop for car parts and accessories
        </Text>

        {products.length === 0 ? (
          <Text className="text-gray-600 text-center">No products available</Text>
        ) : (
          products.map((product) => (
            <View
              key={product.id}
              className="bg-gray-50 p-4 rounded-lg mb-4 border border-gray-200"
            >
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-gray-800 mb-1">
                    {product.name}
                  </Text>
                  <Text className="text-gray-600 text-sm mb-2">
                    {product.description}
                  </Text>
                  <Text className="text-green-600 font-bold text-lg">
                    {product.price}
                  </Text>
                </View>
                <TouchableOpacity
                  className="bg-green-600 px-4 py-2 rounded-lg ml-4"
                  onPress={() => handleBuyProduct(product.name)}
                >
                  <Text className="text-white font-semibold">Buy</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <View className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <Text className="text-blue-800 font-semibold text-center">
            Free shipping on orders over $100
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}