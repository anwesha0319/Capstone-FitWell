import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { getWaterIntake } from '../api/client';

// Notification types
export const NOTIFICATION_TYPES = {
  WATER_INTAKE: 'water_intake',
  WORKOUT_REMINDER: 'workout_reminder',
  MEAL_REMINDER: 'meal_reminder',
  GOAL_PROGRESS: 'goal_progress',
  WELCOME: 'welcome'
};

// Check and show water intake notification
export const checkWaterIntakeNotification = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const waterData = await getWaterIntake(today);
    
    if (waterData.success) {
      const { amount, goal } = waterData;
      const remaining = goal - amount;
      
      // Show notification if user hasn't reached goal and it's afternoon (after 2 PM)
      const currentHour = new Date().getHours();
      if (remaining > 0 && currentHour >= 14) {
        const percentage = (amount / goal) * 100;
        
        if (percentage < 50) {
          showWaterNotification(amount, goal, remaining, 'morning');
        } else if (percentage < 80) {
          showWaterNotification(amount, goal, remaining, 'afternoon');
        } else {
          showWaterNotification(amount, goal, remaining, 'evening');
        }
      }
    }
  } catch (error) {
    console.error('Error checking water intake:', error);
  }
};

// Show water intake notification
const showWaterNotification = (amount, goal, remaining, timeOfDay) => {
  const messages = {
    morning: `Good morning! You've had ${amount}L of water. ${remaining}L to go to reach your ${goal}L goal.`,
    afternoon: `Afternoon check-in! You're at ${amount}L water. Just ${remaining}L left to hit your ${goal}L goal.`,
    evening: `Evening reminder! You've had ${amount}L water today. ${remaining}L more to reach your ${goal}L goal.`
  };
  
  Alert.alert(
    '💧 Water Reminder',
    messages[timeOfDay],
    [
      {
        text: 'Add 0.5L',
        onPress: () => updateWaterIntake(amount + 0.5, goal)
      },
      {
        text: 'Add 1L',
        onPress: () => updateWaterIntake(amount + 1, goal)
      },
      {
        text: 'Skip',
        style: 'cancel'
      }
    ],
    { cancelable: true }
  );
};

// Update water intake
const updateWaterIntake = async (newAmount, goal) => {
  try {
    const { saveWaterIntake } = require('../api/client');
    await saveWaterIntake(newAmount, goal);
    
    Alert.alert(
      '✅ Updated',
      `Water intake updated to ${newAmount}L`,
      [{ text: 'OK' }]
    );
  } catch (error) {
    Alert.alert('Error', 'Failed to update water intake');
  }
};

// Check workout reminders
export const checkWorkoutReminder = async () => {
  try {
    const { getTodaysWorkout } = require('../api/client');
    const workoutData = await getTodaysWorkout();
    
    if (workoutData.has_workout && !workoutData.workout.all_completed) {
      const currentHour = new Date().getHours();
      
      // Show reminder in the morning (8-10 AM) or evening (5-7 PM)
      if ((currentHour >= 8 && currentHour <= 10) || (currentHour >= 17 && currentHour <= 19)) {
        const completedCount = workoutData.workout.exercises.filter(e => e.completed).length;
        const totalCount = workoutData.workout.exercises.length;
        
        Alert.alert(
          '🏋️‍♂️ Workout Reminder',
          `You have ${totalCount - completedCount} exercises left in today's workout. Ready to continue?`,
          [
            {
              text: 'Continue Workout',
              onPress: () => {
                // Navigate to workout screen
                // This would require navigation context
              }
            },
            {
              text: 'Later',
              style: 'cancel'
            }
          ]
        );
      }
    }
  } catch (error) {
    console.error('Error checking workout reminder:', error);
  }
};

// Check meal reminders
export const checkMealReminder = async () => {
  try {
    const currentHour = new Date().getHours();
    let mealType = '';
    
    if (currentHour >= 7 && currentHour <= 9) {
      mealType = 'breakfast';
    } else if (currentHour >= 12 && currentHour <= 14) {
      mealType = 'lunch';
    } else if (currentHour >= 18 && currentHour <= 20) {
      mealType = 'dinner';
    }
    
    if (mealType) {
      Alert.alert(
        '🍽️ Meal Time',
        `Time for ${mealType}! Have you eaten according to your meal plan?`,
        [
          {
            text: 'Yes, I ate',
            onPress: () => logMeal(mealType)
          },
          {
            text: 'No, I skipped',
            onPress: () => logSkippedMeal(mealType)
          },
          {
            text: 'Later',
            style: 'cancel'
          }
        ]
      );
    }
  } catch (error) {
    console.error('Error checking meal reminder:', error);
  }
};

const logMeal = async (mealType) => {
  Alert.alert('✅ Logged', `${mealType} logged successfully!`);
  // Here you would call API to log the meal
};

const logSkippedMeal = async (mealType) => {
  Alert.alert('⚠️ Skipped', `${mealType} marked as skipped.`);
  // Here you would call API to log skipped meal
};

// Check goal progress
export const checkGoalProgress = async () => {
  try {
    const userData = await AsyncStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      
      // Check if it's end of day (8-10 PM)
      const currentHour = new Date().getHours();
      if (currentHour >= 20 && currentHour <= 22) {
        Alert.alert(
          '📊 Daily Summary',
          'How was your day? Did you meet your fitness goals?',
          [
            {
              text: 'Great Day!',
              onPress: () => logDailyFeedback('great')
            },
            {
              text: 'Okay Day',
              onPress: () => logDailyFeedback('okay')
            },
            {
              text: 'Could Be Better',
              onPress: () => logDailyFeedback('needs_improvement')
            },
            {
              text: 'Skip',
              style: 'cancel'
            }
          ]
        );
      }
    }
  } catch (error) {
    console.error('Error checking goal progress:', error);
  }
};

const logDailyFeedback = async (feedback) => {
  Alert.alert('✅ Feedback Saved', 'Thanks for sharing!');
  // Here you would call API to log daily feedback
};

// Initialize notification checks
export const initializeNotifications = () => {
  // Check water intake every hour
  setInterval(checkWaterIntakeNotification, 60 * 60 * 1000);
  
  // Check workout reminders every 2 hours
  setInterval(checkWorkoutReminder, 2 * 60 * 60 * 1000);
  
  // Check meal reminders every hour
  setInterval(checkMealReminder, 60 * 60 * 1000);
  
  // Check goal progress once a day
  setInterval(checkGoalProgress, 24 * 60 * 60 * 1000);
  
  // Initial check
  setTimeout(() => {
    checkWaterIntakeNotification();
    checkWorkoutReminder();
    checkMealReminder();
    checkGoalProgress();
  }, 5000); // Wait 5 seconds after app starts
};

// Show welcome notification for new users
export const showWelcomeNotification = (userName) => {
  Alert.alert(
    '🎉 Welcome to FitWell!',
    `Hi ${userName}! We're excited to help you achieve your fitness goals. Let's get started!`,
    [
      {
        text: 'Get Started',
        onPress: () => {
          // The user will already be on the main screen after signup
        }
      }
    ]
  );
};