import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';

export default function AdminPagesLayout() {
  const router = useRouter();
  
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0f172a', // Using a dark slate color that fits the background (slate-900)
        },
        contentStyle: {
          backgroundColor: '#020617', // Match the rest of the dark pages (slate-950)
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: '900',
          fontSize: 16,
        },
        headerShadowVisible: false, // Removes the ugly border under the header
        headerTitleAlign: 'left',
        headerLeft: () => (
          <TouchableOpacity 
             onPress={() => router.back()}
             style={{ 
               width: 40, 
               height: 40, 
               borderRadius: 14, 
               backgroundColor: 'rgba(255,255,255,0.05)', 
               alignItems: 'center', 
               justifyContent: 'center', 
               marginLeft: 8,
               marginRight: 12,
               borderWidth: 1,
               borderColor: 'rgba(255,255,255,0.1)'
             }}
          >
            <Ionicons name="arrow-back-outline" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        ),
      }}
    >
       <Stack.Screen name="users" options={{ title: 'USERS & DIRECTORY' }} />
       <Stack.Screen name="orders" options={{ title: 'ALL ORDERS' }} />
       <Stack.Screen name="order-details" options={{ title: 'ORDER COMPLETE DETAILS' }} />
       <Stack.Screen name="stock-details" options={{ title: 'STOCK DETAILS' }} />
       <Stack.Screen name="billings" options={{ title: 'BILLINGS LEDGER' }} />
       <Stack.Screen name="car-services" options={{ title: 'SERVICE CATALOG' }} />
       <Stack.Screen name="service-areas" options={{ title: 'SERVICE AREAS' }} />
       <Stack.Screen name="reviews" options={{ title: 'CUSTOMER REVIEWS' }} />
       <Stack.Screen name="pricing" options={{ title: 'PRICING PACKAGES' }} />
       <Stack.Screen name="add-appointment" options={{ title: 'NEW APPOINTMENT' }} />
       <Stack.Screen name="add-booking" options={{ title: 'NEW BOOKING' }} />
       <Stack.Screen name="booked-vehicles" options={{ title: 'VEHICLE BOOKED' }} />
       <Stack.Screen name="add-vehicle" options={{ title: 'ADD VEHICLE' }} />
       <Stack.Screen name="add-car-service" options={{ title: 'ADD CAR SERVICE' }} />
       <Stack.Screen name="add-pricing" options={{ title: 'ADD PRICING' }} />
       <Stack.Screen name="completed-history" options={{ headerShown: false }} />
    </Stack>
  );
}
