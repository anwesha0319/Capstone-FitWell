import { GoogleSignin } from '@react-native-google-signin/google-signin';
import axios from 'axios';
import { Alert } from 'react-native';

const GOOGLE_FIT_API_BASE = 'https://www.googleapis.com/fitness/v1/users/me';

class GoogleFitService {
  constructor() {
    this.isConfigured = false;
    this.accessToken = null;
  }

  /**
   * Configure Google Sign-In
   * Call this once when the app starts
   * For Android-only, no webClientId needed
   */
  configure() {
    try {
      GoogleSignin.configure({
        scopes: [
          'https://www.googleapis.com/auth/fitness.activity.read',
          'https://www.googleapis.com/auth/fitness.body.read',
          'https://www.googleapis.com/auth/fitness.heart_rate.read',
          'https://www.googleapis.com/auth/fitness.sleep.read',
          'https://www.googleapis.com/auth/fitness.location.read',
          'https://www.googleapis.com/auth/fitness.blood_pressure.read',
          'https://www.googleapis.com/auth/fitness.oxygen_saturation.read',
        ],
        offlineAccess: false, // Android-only doesn't need offline access
      });
      this.isConfigured = true;
      console.log('✅ Google Sign-In configured successfully (Android-only)');
    } catch (error) {
      console.error('❌ Google Sign-In configuration failed:', error);
      throw error;
    }
  }

  /**
   * Sign in with Google and get access token
   */
  async signIn() {
    try {
      if (!this.isConfigured) {
        throw new Error('Google Sign-In not configured. Call configure() first.');
      }

      // Check if already signed in
      const isSignedIn = await GoogleSignin.isSignedIn();
      
      if (isSignedIn) {
        console.log('Already signed in, getting current user...');
        const userInfo = await GoogleSignin.signInSilently();
        const tokens = await GoogleSignin.getTokens();
        this.accessToken = tokens.accessToken;
        return { success: true, userInfo, accessToken: this.accessToken };
      }

      // Sign in
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();
      
      this.accessToken = tokens.accessToken;
      
      console.log('✅ Google Sign-In successful');
      console.log('User:', userInfo.user.email);
      
      return { success: true, userInfo, accessToken: this.accessToken };
    } catch (error) {
      console.error('❌ Google Sign-In failed:', error);
      
      if (error.code === 'SIGN_IN_CANCELLED') {
        throw new Error('Sign-in cancelled by user');
      } else if (error.code === 'IN_PROGRESS') {
        throw new Error('Sign-in already in progress');
      } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        throw new Error('Google Play Services not available');
      }
      
      throw error;
    }
  }

  /**
   * Sign out from Google
   */
  async signOut() {
    try {
      await GoogleSignin.signOut();
      this.accessToken = null;
      console.log('✅ Signed out successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Sign out failed:', error);
      throw error;
    }
  }

  /**
   * Check if user is signed in
   */
  async isSignedIn() {
    try {
      return await GoogleSignin.isSignedIn();
    } catch (error) {
      console.error('❌ Failed to check sign-in status:', error);
      return false;
    }
  }

  /**
   * Get current user info
   */
  async getCurrentUser() {
    try {
      const userInfo = await GoogleSignin.getCurrentUser();
      return userInfo;
    } catch (error) {
      console.error('❌ Failed to get current user:', error);
      return null;
    }
  }

  /**
   * Refresh access token if needed
   */
  async refreshTokenIfNeeded() {
    try {
      const tokens = await GoogleSignin.getTokens();
      this.accessToken = tokens.accessToken;
      return this.accessToken;
    } catch (error) {
      console.error('❌ Failed to refresh token:', error);
      // Try to sign in again
      await this.signIn();
      return this.accessToken;
    }
  }

  /**
   * Make authenticated request to Google Fit API
   */
  async makeRequest(endpoint, data) {
    try {
      if (!this.accessToken) {
        await this.refreshTokenIfNeeded();
      }

      const response = await axios.post(
        `${GOOGLE_FIT_API_BASE}${endpoint}`,
        data,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('❌ Google Fit API request failed:', error.response?.data || error.message);
      
      // If unauthorized, try to refresh token and retry
      if (error.response?.status === 401) {
        console.log('Token expired, refreshing...');
        await this.refreshTokenIfNeeded();
        
        // Retry request
        const response = await axios.post(
          `${GOOGLE_FIT_API_BASE}${endpoint}`,
          data,
          {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );
        
        return response.data;
      }
      
      throw error;
    }
  }

  /**
   * Get time range for data queries
   */
  getTimeRange(days = 7) {
    const endTime = new Date();
    const startTime = new Date();
    startTime.setDate(startTime.getDate() - days);
    
    return {
      startTimeMillis: startTime.getTime(),
      endTimeMillis: endTime.getTime(),
    };
  }

  /**
   * Get steps data
   */
  async getSteps(days = 7) {
    try {
      const timeRange = this.getTimeRange(days);
      
      const requestBody = {
        aggregateBy: [{
          dataTypeName: 'com.google.step_count.delta',
          dataSourceId: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps'
        }],
        bucketByTime: { durationMillis: 86400000 }, // 1 day in milliseconds
        startTimeMillis: timeRange.startTimeMillis,
        endTimeMillis: timeRange.endTimeMillis,
      };

      const data = await this.makeRequest('/dataset:aggregate', requestBody);
      
      // Parse response
      const steps = [];
      if (data.bucket) {
        data.bucket.forEach(bucket => {
          if (bucket.dataset && bucket.dataset[0] && bucket.dataset[0].point) {
            bucket.dataset[0].point.forEach(point => {
              const date = new Date(parseInt(point.startTimeNanos) / 1000000);
              const stepCount = point.value[0].intVal || 0;
              
              steps.push({
                date: date.toISOString().split('T')[0],
                steps: stepCount,
                timestamp: date.toISOString(),
              });
            });
          }
        });
      }
      
      console.log(`✅ Fetched ${steps.length} days of steps data`);
      return steps;
    } catch (error) {
      console.error('❌ Failed to fetch steps:', error);
      throw error;
    }
  }

  /**
   * Get heart rate data
   */
  async getHeartRate(days = 7) {
    try {
      const timeRange = this.getTimeRange(days);
      
      const requestBody = {
        aggregateBy: [{
          dataTypeName: 'com.google.heart_rate.bpm'
        }],
        bucketByTime: { durationMillis: 3600000 }, // 1 hour buckets
        startTimeMillis: timeRange.startTimeMillis,
        endTimeMillis: timeRange.endTimeMillis,
      };

      const data = await this.makeRequest('/dataset:aggregate', requestBody);
      
      // Parse response
      const heartRates = [];
      if (data.bucket) {
        data.bucket.forEach(bucket => {
          if (bucket.dataset && bucket.dataset[0] && bucket.dataset[0].point) {
            bucket.dataset[0].point.forEach(point => {
              const timestamp = new Date(parseInt(point.startTimeNanos) / 1000000);
              const bpm = point.value[0].fpVal || 0;
              
              heartRates.push({
                timestamp: timestamp.toISOString(),
                heart_rate: Math.round(bpm),
                date: timestamp.toISOString().split('T')[0],
              });
            });
          }
        });
      }
      
      console.log(`✅ Fetched ${heartRates.length} heart rate readings`);
      return heartRates;
    } catch (error) {
      console.error('❌ Failed to fetch heart rate:', error);
      throw error;
    }
  }

  /**
   * Get calories burned data
   */
  async getCalories(days = 7) {
    try {
      const timeRange = this.getTimeRange(days);
      
      const requestBody = {
        aggregateBy: [{
          dataTypeName: 'com.google.calories.expended',
          dataSourceId: 'derived:com.google.calories.expended:com.google.android.gms:merge_calories_expended'
        }],
        bucketByTime: { durationMillis: 86400000 }, // 1 day in milliseconds
        startTimeMillis: timeRange.startTimeMillis,
        endTimeMillis: timeRange.endTimeMillis,
      };

      const data = await this.makeRequest('/dataset:aggregate', requestBody);
      
      // Parse response
      const calories = [];
      if (data.bucket) {
        data.bucket.forEach(bucket => {
          if (bucket.dataset && bucket.dataset[0] && bucket.dataset[0].point) {
            bucket.dataset[0].point.forEach(point => {
              const date = new Date(parseInt(point.startTimeNanos) / 1000000);
              const caloriesBurned = point.value[0].fpVal || 0;
              
              calories.push({
                date: date.toISOString().split('T')[0],
                calories: Math.round(caloriesBurned),
                timestamp: date.toISOString(),
              });
            });
          }
        });
      }
      
      console.log(`✅ Fetched ${calories.length} days of calories data`);
      return calories;
    } catch (error) {
      console.error('❌ Failed to fetch calories:', error);
      throw error;
    }
  }

  /**
   * Get sleep data
   */
  async getSleepData(days = 7) {
    try {
      const timeRange = this.getTimeRange(days);
      
      const requestBody = {
        aggregateBy: [{
          dataTypeName: 'com.google.sleep.segment'
        }],
        bucketByTime: { durationMillis: 86400000 }, // 1 day in milliseconds
        startTimeMillis: timeRange.startTimeMillis,
        endTimeMillis: timeRange.endTimeMillis,
      };

      const data = await this.makeRequest('/dataset:aggregate', requestBody);
      
      // Parse response
      const sleepData = [];
      if (data.bucket) {
        data.bucket.forEach(bucket => {
          if (bucket.dataset && bucket.dataset[0] && bucket.dataset[0].point) {
            bucket.dataset[0].point.forEach(point => {
              const startTime = new Date(parseInt(point.startTimeNanos) / 1000000);
              const endTime = new Date(parseInt(point.endTimeNanos) / 1000000);
              const durationHours = (endTime - startTime) / (1000 * 60 * 60);
              
              sleepData.push({
                date: startTime.toISOString().split('T')[0],
                sleep_duration: durationHours,
                sleep_quality: this.categorizeSleepQuality(durationHours),
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString(),
              });
            });
          }
        });
      }
      
      console.log(`✅ Fetched ${sleepData.length} sleep records`);
      return sleepData;
    } catch (error) {
      console.error('❌ Failed to fetch sleep data:', error);
      throw error;
    }
  }

  /**
   * Get blood pressure data
   */
  async getBloodPressure(days = 7) {
    try {
      const timeRange = this.getTimeRange(days);
      
      const requestBody = {
        aggregateBy: [{
          dataTypeName: 'com.google.blood_pressure'
        }],
        bucketByTime: { durationMillis: 86400000 }, // 1 day in milliseconds
        startTimeMillis: timeRange.startTimeMillis,
        endTimeMillis: timeRange.endTimeMillis,
      };

      const data = await this.makeRequest('/dataset:aggregate', requestBody);
      
      // Parse response
      const bloodPressure = [];
      if (data.bucket) {
        data.bucket.forEach(bucket => {
          if (bucket.dataset && bucket.dataset[0] && bucket.dataset[0].point) {
            bucket.dataset[0].point.forEach(point => {
              const timestamp = new Date(parseInt(point.startTimeNanos) / 1000000);
              const systolic = point.value[0]?.fpVal || 0; // Systolic pressure
              const diastolic = point.value[1]?.fpVal || 0; // Diastolic pressure
              
              bloodPressure.push({
                timestamp: timestamp.toISOString(),
                systolic: Math.round(systolic),
                diastolic: Math.round(diastolic),
                date: timestamp.toISOString().split('T')[0],
              });
            });
          }
        });
      }
      
      console.log(`✅ Fetched ${bloodPressure.length} blood pressure readings`);
      return bloodPressure;
    } catch (error) {
      console.error('❌ Failed to fetch blood pressure:', error);
      return [];
    }
  }

  /**
   * Get SpO2 (oxygen saturation) data
   */
  async getOxygenSaturation(days = 7) {
    try {
      const timeRange = this.getTimeRange(days);
      
      const requestBody = {
        aggregateBy: [{
          dataTypeName: 'com.google.oxygen_saturation'
        }],
        bucketByTime: { durationMillis: 3600000 }, // 1 hour buckets
        startTimeMillis: timeRange.startTimeMillis,
        endTimeMillis: timeRange.endTimeMillis,
      };

      const data = await this.makeRequest('/dataset:aggregate', requestBody);
      
      // Parse response
      const spo2Data = [];
      if (data.bucket) {
        data.bucket.forEach(bucket => {
          if (bucket.dataset && bucket.dataset[0] && bucket.dataset[0].point) {
            bucket.dataset[0].point.forEach(point => {
              const timestamp = new Date(parseInt(point.startTimeNanos) / 1000000);
              const spo2 = point.value[0]?.fpVal || 0;
              
              spo2Data.push({
                timestamp: timestamp.toISOString(),
                spo2: Math.round(spo2),
                date: timestamp.toISOString().split('T')[0],
              });
            });
          }
        });
      }
      
      console.log(`✅ Fetched ${spo2Data.length} SpO2 readings`);
      return spo2Data;
    } catch (error) {
      console.error('❌ Failed to fetch SpO2:', error);
      return [];
    }
  }

  /**
   * Get distance data
   */
  async getDistance(days = 7) {
    try {
      const timeRange = this.getTimeRange(days);
      
      const requestBody = {
        aggregateBy: [{
          dataTypeName: 'com.google.distance.delta',
          dataSourceId: 'derived:com.google.distance.delta:com.google.android.gms:merge_distance_delta'
        }],
        bucketByTime: { durationMillis: 86400000 }, // 1 day in milliseconds
        startTimeMillis: timeRange.startTimeMillis,
        endTimeMillis: timeRange.endTimeMillis,
      };

      const data = await this.makeRequest('/dataset:aggregate', requestBody);
      
      // Parse response
      const distances = [];
      if (data.bucket) {
        data.bucket.forEach(bucket => {
          if (bucket.dataset && bucket.dataset[0] && bucket.dataset[0].point) {
            bucket.dataset[0].point.forEach(point => {
              const date = new Date(parseInt(point.startTimeNanos) / 1000000);
              const distanceMeters = point.value[0].fpVal || 0;
              const distanceKm = distanceMeters / 1000;
              
              distances.push({
                date: date.toISOString().split('T')[0],
                distance: distanceKm,
                timestamp: date.toISOString(),
              });
            });
          }
        });
      }
      
      console.log(`✅ Fetched ${distances.length} days of distance data`);
      return distances;
    } catch (error) {
      console.error('❌ Failed to fetch distance:', error);
      throw error;
    }
  }

  /**
   * Get all fitness data at once
   */
  async getAllFitnessData(days = 7) {
    try {
      console.log(`📊 Fetching ${days} days of fitness data from Google Fit...`);
      
      // Fetch all data in parallel
      const [steps, heartRate, calories, sleep, distance, bloodPressure, spo2] = await Promise.all([
        this.getSteps(days),
        this.getHeartRate(days),
        this.getCalories(days),
        this.getSleepData(days),
        this.getDistance(days),
        this.getBloodPressure(days),
        this.getOxygenSaturation(days),
      ]);

      // Aggregate by date
      const dataByDate = new Map();

      // Add steps
      steps.forEach(item => {
        if (!dataByDate.has(item.date)) {
          dataByDate.set(item.date, {
            date: item.date,
            steps: 0,
            calories_burned: 0,
            distance: 0,
            active_minutes: 0,
          });
        }
        dataByDate.get(item.date).steps = item.steps;
      });

      // Add calories
      calories.forEach(item => {
        if (!dataByDate.has(item.date)) {
          dataByDate.set(item.date, {
            date: item.date,
            steps: 0,
            calories_burned: 0,
            distance: 0,
            active_minutes: 0,
          });
        }
        dataByDate.get(item.date).calories_burned = item.calories;
      });

      // Add distance
      distance.forEach(item => {
        if (!dataByDate.has(item.date)) {
          dataByDate.set(item.date, {
            date: item.date,
            steps: 0,
            calories_burned: 0,
            distance: 0,
            active_minutes: 0,
          });
        }
        dataByDate.get(item.date).distance = item.distance;
      });

      const healthData = Array.from(dataByDate.values()).sort((a, b) => 
        new Date(a.date) - new Date(b.date)
      );

      console.log('✅ Google Fit data fetched successfully:');
      console.log(`  - ${healthData.length} daily records`);
      console.log(`  - ${heartRate.length} heart rate readings`);
      console.log(`  - ${sleep.length} sleep records`);
      console.log(`  - ${bloodPressure.length} blood pressure readings`);
      console.log(`  - ${spo2.length} SpO2 readings`);

      return {
        health_data: healthData,
        heart_rate_data: heartRate,
        sleep_data: sleep,
        blood_pressure_data: bloodPressure,
        spo2_data: spo2,
      };
    } catch (error) {
      console.error('❌ Failed to fetch all fitness data:', error);
      throw error;
    }
  }

  /**
   * Categorize sleep quality based on duration
   */
  categorizeSleepQuality(hours) {
    if (hours >= 7 && hours <= 9) return 'excellent';
    if (hours >= 6 && hours < 7) return 'good';
    if (hours >= 5 && hours < 6) return 'fair';
    return 'poor';
  }

  /**
   * Get today's summary
   */
  async getTodaySummary() {
    try {
      const data = await this.getAllFitnessData(1);
      
      if (data.health_data.length === 0) {
        return {
          steps: 0,
          calories: 0,
          distance: 0,
          heartRate: 0,
          sleep: 0,
        };
      }

      const today = data.health_data[0];
      const avgHeartRate = data.heart_rate_data.length > 0
        ? Math.round(data.heart_rate_data.reduce((sum, hr) => sum + hr.heart_rate, 0) / data.heart_rate_data.length)
        : 0;
      const sleepHours = data.sleep_data.length > 0
        ? data.sleep_data[0].sleep_duration
        : 0;

      return {
        steps: today.steps,
        calories: today.calories_burned,
        distance: today.distance,
        heartRate: avgHeartRate,
        sleep: sleepHours,
      };
    } catch (error) {
      console.error('❌ Failed to get today\'s summary:', error);
      throw error;
    }
  }
}

export default new GoogleFitService();
