import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

export interface CartItem {
  id: string;
  docId: number;
  name: string;
  price: number;
  quantity: number;
  image: string | null;
  brand?: string;
  userId?: number;
  uid?: string;
  email?: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: any) => void;
  removeFromCart: (docId: number) => void;
  updateQuantity: (docId: number, quantity: number) => void;
  clearCart: () => void;
  totalAmount: number;
  totalItems: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_KEY = '@cart_data';

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const { user } = useAuth() as any;

  useEffect(() => {
    loadCart();
  }, []);

  useEffect(() => {
    saveCart();
  }, [cart]);

  const loadCart = async () => {
    try {
      const storedCart = await AsyncStorage.getItem(CART_KEY);
      if (storedCart) {
        setCart(JSON.parse(storedCart));
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  };

  const saveCart = async () => {
    try {
      await AsyncStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  };

  const addToCart = (product: any) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (item) =>
          item.docId === product.docId &&
          (
            item.userId === user?.id ||
            item.uid === user?.uid ||
            item.email?.toLowerCase() === user?.email?.toLowerCase()
          )
      );
      if (existingItem) {
        return prevCart.map((item) =>
          item.docId === product.docId &&
            (
              item.userId === user?.id ||
              item.uid === user?.uid ||
              item.email?.toLowerCase() === user?.email?.toLowerCase()
            )
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      const newItem: CartItem = {
        id: product.id,
        docId: product.docId,
        name: product.name,
        price: parseFloat(String(product.offerPrice).replace(/[^0-9.]/g, '')) || 0,
        quantity: 1,
        image: Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null,
        brand: product.brand,

        userId: user?.id,
        uid: user?.uid,
        email: user?.email,
      };
      return [...prevCart, newItem];
    });
  };

  const removeFromCart = (docId: number) => {
    setCart((prevCart) =>
      prevCart.filter(
        (item) =>
          !(
            item.docId === docId &&
            (
              item.userId === user?.id ||
              item.uid === user?.uid ||
              item.email?.toLowerCase() === user?.email?.toLowerCase()
            )
          )
      )
    );
  };

  const updateQuantity = (docId: number, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(docId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) => (item.docId === docId &&
        (
          item.userId === user?.id ||
          item.uid === user?.uid ||
          item.email?.toLowerCase() === user?.email?.toLowerCase()
        )
        ? { ...item, quantity }
        : item))
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalAmount,
        totalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
