import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';


const API_BASE_URL = 'http://192.168.29.52:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        await AsyncStorage.setItem('access_token', access);

        originalRequest.headers.Authorization = `Bearer ${access}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;


// AI Model API Functions
export const generateDietPlan = async (data) => {
  try {
    const response = await apiClient.post('/ml/generate-ai-meal-plan/', {
      ...data,
      activity: data.activity || 'moderate',
      diet_type: data.dietary_preference || 'balanced',
      allergies: data.allergies || '',
      goal: data.goal || 'maintain',
      days: data.duration || 7,
      force_new: data.force_new || false
    });
    return response.data;
  } catch (error) {
    console.error('Diet plan generation error:', error.response?.data || error.message);
    throw error;
  }
};

export const checkActivePlan = async () => {
  try {
    const response = await apiClient.get('/ml/check-active-plan/');
    return response.data;
  } catch (error) {
    console.error('Check active plan error:', error.response?.data || error.message);
    throw error;
  }
};

export const getMealPlan = async (date = null) => {
  try {
    const dateParam = date || new Date().toISOString().split('T')[0];
    const response = await apiClient.get(`/ml/meal-plan/?date=${dateParam}`);
    return response.data;
  } catch (error) {
    console.error('Get meal plan error:', error.response?.data || error.message);
    throw error;
  }
};

export const trackMealItem = async (mealItemId, status, quantityRatio = 1.0) => {
  try {
    const response = await apiClient.post('/ml/track-meal-item/', {
      meal_item_id: mealItemId,
      status: status,  // 'eaten' or 'skipped'
      quantity_ratio: quantityRatio
    });
    return response.data;
  } catch (error) {
    console.error('Track meal error:', error.response?.data || error.message);
    throw error;
  }
};

export const recalculateMealPlan = async (data = {}) => {
  try {
    const response = await apiClient.post('/ml/recalculate-meal-plan/', {
      activity: data.activity || 'moderate',
      diet_type: data.dietary_preference || 'none',
      allergies: data.allergies || ''
    });
    return response.data;
  } catch (error) {
    console.error('Recalculate meal plan error:', error.response?.data || error.message);
    throw error;
  }
};

export const generateWorkoutPlan = async (data) => {
  try {
    const response = await apiClient.post('/ml/workout-plan/', data);
    return response.data;
  } catch (error) {
    console.error('Workout plan generation error:', error.response?.data || error.message);
    throw error;
  }
};

export const generateMarathonPlan = async (data) => {
  try {
    const response = await apiClient.post('/ml/marathon-plan/', data);
    return response.data;
  } catch (error) {
    console.error('Marathon plan generation error:', error.response?.data || error.message);
    throw error;
  }
};

// Water Intake API Functions
export const saveWaterIntake = async (amount, goal = 3.0, date = null) => {
  try {
    const dateParam = date || new Date().toISOString().split('T')[0];
    const response = await apiClient.post('/health/water-intake/', {
      amount: amount,
      goal: goal,
      date: dateParam
    });
    return response.data;
  } catch (error) {
    console.error('Save water intake error:', error.response?.data || error.message);
    throw error;
  }
};

export const getWaterIntake = async (date = null, days = 7) => {
  try {
    const params = date ? `date=${date}` : `days=${days}`;
    const response = await apiClient.get(`/health/water-intake/get/?${params}`);
    return response.data;
  } catch (error) {
    console.error('Get water intake error:', error.response?.data || error.message);
    throw error;
  }
};

// Health Data API Functions
export const getHealthData = async (days = 7) => {
  try {
    const response = await apiClient.get(`/health/health-data/?days=${days}`);
    return response.data;
  } catch (error) {
    console.error('Get health data error:', error.response?.data || error.message);
    throw error;
  }
};
