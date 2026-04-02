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
}

// API functions
export const apiService = {
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
  getProducts: async (): Promise<Product[]> => {
    try {
      const response = await api.get('/products');
      return response.data;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  getProductById: async (id: number): Promise<Product> => {
    try {
      const response = await api.get(`/products/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
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

  // Bookings
  getBookings: async (): Promise<Booking[]> => {
    try {
      const response = await api.get('/bookings');
      return response.data;
    } catch (error) {
      console.error('Error fetching bookings:', error);
      throw error;
    }
  },

  createBooking: async (bookingData: Partial<Booking>): Promise<Booking> => {
    try {
      const response = await api.post('/bookings', bookingData);
      return response.data;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
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
    } catch (error) {
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