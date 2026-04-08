import axios from 'axios';

const API_BASE_URL = 'https://cars.qtechx.com/api';

// Create axios instance with base configuration
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const authHeader = api.defaults.headers.common['Authorization'];
    if (authHeader) {
      config.headers.Authorization = authHeader;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Types for API responses
export interface Service {
  id: number;
  name: string;
  description: string;
  price: string;
  category?: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  category?: string;
  image?: string;
}

export interface Vehicle {
  id: number;
  name: string;
  year: string;
  price: string;
  description?: string;
  image?: string;
  images?: any;
  make?: string;
  model?: string;
}

export interface Booking {
  id: number;
  service_id: number;
  user_id: number;
  date: string;
  status: string;
  notes?: string;
  name?: string;
  email?: string;
  phone?: string;
}

// API functions
export const apiService = {
  api,
  // Test API connection
  testConnection: async () => {
    try {
      const response = await api.get('/test');
      return response.data;
    } catch (error) {
      console.log('API test endpoint not available, trying services endpoint');
      try {
        const response = await api.get('/services');
        return { status: 'API reachable', data: response.data };
      } catch (fallbackError) {
        console.error('API connection test failed:', fallbackError);
        throw fallbackError;
      }
    }
  },
  // Services
  getServices: async (): Promise<Service[]> => {
    try {
      const response = await api.get('/services');
      return response.data;
    } catch (error) {
      console.error('Error fetching services:', error);
      throw error;
    }
  },

  getServiceById: async (id: number): Promise<Service> => {
    try {
      const response = await api.get(`/services/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching service:', error);
      throw error;
    }
  },

  // Products
  getProducts: async (category?: string): Promise<any[]> => {
    try {
      const endpoint = category ? `/products?category=${category}` : '/products';
      const response = await api.get(endpoint);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  },

  getProductById: async (id: number): Promise<Product> => {
    try {
      const response = await api.get(`/products/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching product:', error);
      throw error;
    }
  },

  getProductBySlug: async (slug: string): Promise<any> => {
    try {
      const response = await api.get(`/products/slug/${slug}`);
      return response.data;
    } catch (error) {
      console.warn(`Error fetching product by slug ${slug}, trying fallback...`, error);
      // Fallback: try to fetch all products and find matching slug
      try {
        const response = await api.get('/products');
        const products = Array.isArray(response.data) ? response.data : [];
        const match = products.find((p: any) => p.slug === slug);
        if (match) return match;
        throw new Error('Product not found in fallback');
      } catch (fallbackError) {
        console.error('Initial slug fetch and fallback both failed:', fallbackError);
        throw fallbackError;
      }
    }
  },

  updateProductStock: async (docId: string | number, stockData: { variants: any[], totalStock: number }): Promise<any> => {
    try {
      const response = await api.put(`/products/stock/${docId}`, stockData);
      return response.data;
    } catch (error) {
      console.error('Error updating product stock:', error);
      throw error;
    }
  },

  // Pricing
  getPricingPackages: async (): Promise<any[]> => {
    try {
      const response = await api.get('/pricing_packages');
      return response.data;
    } catch (error) {
      console.error('Error fetching pricing packages:', error);
      throw error;
    }
  },

  getPricingPackageById: async (id: number | string): Promise<any> => {
    try {
      const response = await api.get(`/pricing_packages/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching pricing package:', error);
      throw error;
    }
  },

  createPricingPackage: async (data: any): Promise<any> => {
    try {
      const response = await api.post('/pricing_packages', data);
      return response.data;
    } catch (error) {
      console.error('Error creating pricing package:', error);
      throw error;
    }
  },

  updatePricingPackage: async (id: number | string, data: any): Promise<any> => {
    try {
      const response = await api.put(`/pricing_packages/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating pricing package:', error);
      throw error;
    }
  },

  deletePricingPackage: async (id: number | string): Promise<any> => {
    try {
      const response = await api.delete(`/pricing_packages/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting pricing package:', error);
      throw error;
    }
  },

  getReviews: async (productId: number): Promise<any[]> => {
    try {
      const response = await api.get(`/reviews?productId=${productId}`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return [];
    }
  },

  // Vehicles
  getVehicles: async (): Promise<Vehicle[]> => {
    try {
      const response = await api.get('/bikes');
      return response.data;
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      throw error;
    }
  },

  getVehicleById: async (id: number): Promise<Vehicle> => {
    try {
      const response = await api.get(`/bikes/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      throw error;
    }
  },

  getStaff: async (): Promise<any[]> => {
    try {
      const response = await api.get('/staff');
      return response.data;
    } catch (error) {
      console.error('Error fetching staff:', error);
      return [];
    }
  },

  getOrders: async (): Promise<any[]> => {
    try {
      const response = await api.get('/orders');
      return response.data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
  },

  getBillings: async (): Promise<any[]> => {
    try {
      const response = await api.get('/billings');
      return response.data;
    } catch (error) {
      console.error('Error fetching billings:', error);
      return [];
    }
  },

  getBillingById: async (id: number | string): Promise<any> => {
    try {
      const response = await api.get(`/billings/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching billing details:', error);
      throw error;
    }
  },

  createBilling: async (data: any): Promise<any> => {
    try {
      const response = await api.post('/billings', data);
      return response.data;
    } catch (error) {
      console.error('Error creating billing:', error);
      throw error;
    }
  },

  updateBillingStatus: async (id: number | string, status: string): Promise<any> => {
    try {
      const response = await api.patch(`/billings/${id}`, { paymentStatus: status });
      return response.data;
    } catch (error) {
      console.error('Error updating billing status:', error);
      throw error;
    }
  },

  deleteBilling: async (id: number | string): Promise<any> => {
    try {
      const response = await api.delete(`/billings/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting billing:', error);
      throw error;
    }
  },

  getInventory: async (): Promise<any[]> => {
    try {
      const response = await api.get('/inventory');
      return response.data;
    } catch (error) {
      console.error('Error fetching inventory:', error);
      return [];
    }
  },

  getVehicleBookings: async (): Promise<any[]> => {
    try {
      const response = await api.get('/vehicle-bookings');
      return response.data;
    } catch (error) {
      console.error('Error fetching vehicle bookings:', error);
      return [];
    }
  },

  updateVehicleBookingStatus: async (id: number | string, data: any): Promise<any> => {
    try {
      const response = await api.put(`/vehicle-bookings/${id}/status`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating vehicle booking status:', error);
      throw error;
    }
  },

  deleteVehicleBooking: async (id: number | string): Promise<any> => {
    try {
      const response = await api.delete(`/vehicle-bookings/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting vehicle booking:', error);
      throw error;
    }
  },

  getServiceAreas: async (): Promise<any[]> => {
    try {
      const response = await api.get('/service-areas');
      return response.data;
    } catch (error) {
      console.error('Error fetching service areas:', error);
      return [];
    }
  },

  createServiceArea: async (data: any): Promise<any> => {
    try {
      const response = await api.post('/service-areas', data);
      return response.data;
    } catch (error) {
      console.error('Error creating service area:', error);
      throw error;
    }
  },

  updateServiceArea: async (id: number | string, data: any): Promise<any> => {
    try {
      const response = await api.put(`/service-areas/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating service area:', error);
      throw error;
    }
  },

  deleteServiceArea: async (id: number | string): Promise<any> => {
    try {
      const response = await api.delete(`/service-areas/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting service area:', error);
      throw error;
    }
  },

  toggleServiceAreaStatus: async (id: number | string, status: string): Promise<any> => {
    try {
      const response = await api.patch(`/service-areas/${id}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error toggling service area status:', error);
      throw error;
    }
  },

  getUsers: async (): Promise<any[]> => {
    try {
      const response = await api.get('/users');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  },

  getAuthUsers: async (): Promise<any[]> => {
    try {
      const response = await api.get('/auth/users');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching auth users:', error);
      return [];
    }
  },

  updateUserRole: async (id: number | string, role: string): Promise<any> => {
    try {
      const response = await api.put(`/auth/users/${id}/role`, { role });
      return response.data;
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  },

  updateUserStatus: async (id: number | string, active: boolean): Promise<any> => {
    try {
      const response = await api.put(`/auth/users/${id}/status`, { active });
      return response.data;
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  },

  deleteUser: async (id: number | string): Promise<any> => {
    try {
      const response = await api.delete(`/auth/users/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  // Bookings
  getBookings: async (): Promise<Booking[]> => {
    try {
      const response = await api.get('/bookings');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching bookings:', error);
      throw error;
    }
  },

  getAppointments: async (): Promise<any[]> => {
    try {
      const response = await api.get('/appointments/all');
      const data = response.data;
      if (Array.isArray(data)) return data;
      if (data?.data && Array.isArray(data.data)) return data.data;
      if (data?.appointments && Array.isArray(data.appointments)) return data.appointments;
      return [];
    } catch (error: any) {
      console.error('Error fetching appointments:', error);
      throw error;
    }
  },


  getAllServices: async (uid: string): Promise<any[]> => {
    try {
      const response = await api.get('/all-services', {
        params: { uid },
      });

      console.log('✅ ALL SERVICES API:', response.data);

      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];

      return data;
    } catch (_error) {
      console.error('❌ getAllServices error:', _error);
      return [];
    }
  },

  createBooking: async (bookingData: Partial<Booking>): Promise<Booking> => {
    try {
      const response = await api.post('/bookings', bookingData);
      return response.data;
    } catch (_error) {
      console.error('Error creating booking:', _error);
      throw _error;
    }
  },

  createAppointment: async (appointmentData: any): Promise<any> => {
    // List of potential endpoints to try in order
    const endpoints = [
      '/appointments',
      '/appointments/create',
      '/bookings/appointment',
      '/bookings/create',
      '/bookings',
    ];

    let lastError: any = null;
    for (const endpoint of endpoints) {
      try {
        console.log(`Trying appointment submission to: ${endpoint}`);
        const response = await api.post(endpoint, appointmentData);
        return response.data;
      } catch (err: any) {
        lastError = err;
        console.warn(`${endpoint} failed with status ${err.response?.status}`);
        // If it's a validation error (400), don't try other endpoints, it's a data issue
        if (err.response?.status === 400) break;
      }
    }

    throw lastError;
  },

  // User authentication (if needed)

  login: async (identifier: string, password: string) => {
    try {
      const loginData = {
        identifier, // Can be email or username
        password,
      };

      console.log('Sending login data:', loginData);

      const response = await api.post('/auth/login', loginData);
      console.log('Login response:', response.data);

      return response.data;
    } catch (error: any) {
      console.error('Error logging in:', error);
      console.error('Error details:', error.response?.data);
      throw error;
    }
  },

  register: async (userData: { username: string; email: string; mobile: string; password: string; role?: string }) => {
    const apiData = {
      name: userData.username,
      email: userData.email,
      password: userData.password,
      role: userData.role || 'user',
      mobile: userData.mobile,
      username: userData.username,
      phone: userData.mobile,
    };

    const endpoints = ['/auth/register', '/register', '/auth/local/register'];

    const buildFormData = (data: Record<string, string>) => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value);
      });
      return formData;
    };

    let errorRecord: any = null;

    for (const endpoint of endpoints) {
      try {
        console.log(`Register attempt to ${endpoint} with JSON`, apiData);
        const response = await api.post(endpoint, apiData);
        console.log('Registration response:', response.data);
        return response.data;
      } catch (jsonError: any) {
        console.warn(`Register JSON attempt failed for ${endpoint}:`, jsonError.response?.status, jsonError.response?.data);
        errorRecord = jsonError;

        if (jsonError.response?.status >= 400 && jsonError.response?.status < 500) {
          // client error -> stop trying other endpoints, return as-is
          break;
        }

        try {
          console.log(`Register attempt to ${endpoint} with form-data`, apiData);
          const response = await api.post(endpoint, buildFormData(apiData), {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          console.log('Registration response (form-data):', response.data);
          return response.data;
        } catch (formError: any) {
          console.warn(`Form-data attempt failed for ${endpoint}:`, formError.response?.status, formError.response?.data);
          errorRecord = formError;

          if (formError.response?.status >= 400 && formError.response?.status < 500) {
            break;
          }
        }
      }
    }

    const errorMessage =
      errorRecord?.response?.data?.message ||
      errorRecord?.response?.data ||
      errorRecord?.message ||
      'Registration failed';

    const err = new Error(`Registration failed: ${errorMessage}`);
    console.error('Error registering:', err, 'original error:', errorRecord);
    throw err;
  },

  // Set authentication token for API requests
  setAuthToken: (token: string | null) => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  },
};