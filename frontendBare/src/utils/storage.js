import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const KEYS = {
  WEIGHT_GOAL: 'weightGoal',
  CURRENT_WEIGHT: 'currentWeight',
  STEPS_GOAL: 'stepsGoal',
  SLEEP_GOAL: 'sleepGoal',
  BEDTIME: 'bedtime',
  SCREEN_TIME_TARGET: 'screenTimeTarget',
  HEALTH_DATA: 'healthData',
  USER_GOALS: 'userGoals',
  TODAY_DATA: 'todayData', // New key for today's activity data
  DIET_PLAN: 'dietPlan', // AI-generated diet plan
  WORKOUT_PLAN: 'workoutPlan', // AI-generated workout plan
  MARATHON_PLAN: 'marathonPlan', // AI-generated marathon plan
  MEAL_LOG: 'mealLog', // Daily meal completion tracking
  WORKOUT_LOG: 'workoutLog', // Workout completion tracking
};

// Health Data Storage
export const saveHealthData = async (data) => {
  try {
    const existingData = await getHealthData();
    const updatedData = { ...existingData, ...data };
    await AsyncStorage.setItem(KEYS.HEALTH_DATA, JSON.stringify(updatedData));
    return true;
  } catch (error) {
    console.error('Error saving health data:', error);
    return false;
  }
};

export const getHealthData = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.HEALTH_DATA);
    return data ? JSON.parse(data) : getDefaultHealthData();
  } catch (error) {
    console.error('Error loading health data:', error);
    return getDefaultHealthData();
  }
};

const getDefaultHealthData = () => ({
  height: '175',
  weight: '75',
  pulse: '72',
  temperature: '98.6',
  calories: '2200',
  hydration: '3.0',
  diet: 'Vegetarian',
  smokingStatus: 'Non-smoker',
  alcoholConsumption: 'Occasional',
  stressLevel: 42,
  sleep: '7.2',
  sleepQuality: '85',
});

// Goals Storage
export const saveGoals = async (goals) => {
  try {
    const existingGoals = await getGoals();
    const updatedGoals = { ...existingGoals, ...goals };
    await AsyncStorage.setItem(KEYS.USER_GOALS, JSON.stringify(updatedGoals));
    return true;
  } catch (error) {
    console.error('Error saving goals:', error);
    return false;
  }
};

export const getGoals = async () => {
  try {
    const goals = await AsyncStorage.getItem(KEYS.USER_GOALS);
    return goals ? JSON.parse(goals) : getDefaultGoals();
  } catch (error) {
    console.error('Error loading goals:', error);
    return getDefaultGoals();
  }
};

const getDefaultGoals = () => ({
  stepsGoal: '10000',
  weightGoal: '70',
  sleepGoal: '8',
  bedtime: '22:00',
  screenTimeTarget: '4',
  caloriesGoal: '2200',
  waterGoal: '3.0',
});

// Individual getters/setters for convenience
export const saveWeightGoal = async (goal) => {
  try {
    await AsyncStorage.setItem(KEYS.WEIGHT_GOAL, goal.toString());
    await saveGoals({ weightGoal: goal.toString() });
    return true;
  } catch (error) {
    console.error('Error saving weight goal:', error);
    return false;
  }
};

export const getWeightGoal = async () => {
  try {
    const goal = await AsyncStorage.getItem(KEYS.WEIGHT_GOAL);
    return goal || '70';
  } catch (error) {
    console.error('Error loading weight goal:', error);
    return '70';
  }
};

export const saveCurrentWeight = async (weight) => {
  try {
    await AsyncStorage.setItem(KEYS.CURRENT_WEIGHT, weight.toString());
    await saveHealthData({ weight: weight.toString() });
    return true;
  } catch (error) {
    console.error('Error saving current weight:', error);
    return false;
  }
};

export const getCurrentWeight = async () => {
  try {
    const weight = await AsyncStorage.getItem(KEYS.CURRENT_WEIGHT);
    return weight || '75';
  } catch (error) {
    console.error('Error loading current weight:', error);
    return '75';
  }
};

export const saveStepsGoal = async (goal) => {
  try {
    await AsyncStorage.setItem(KEYS.STEPS_GOAL, goal.toString());
    await saveGoals({ stepsGoal: goal.toString() });
    return true;
  } catch (error) {
    console.error('Error saving steps goal:', error);
    return false;
  }
};

export const getStepsGoal = async () => {
  try {
    const goal = await AsyncStorage.getItem(KEYS.STEPS_GOAL);
    return goal || '10000';
  } catch (error) {
    console.error('Error loading steps goal:', error);
    return '10000';
  }
};

// Today's Data Storage (for syncing between screens)
export const saveTodayData = async (data) => {
  try {
    const existingData = await getTodayData();
    const updatedData = { ...existingData, ...data };
    await AsyncStorage.setItem(KEYS.TODAY_DATA, JSON.stringify(updatedData));
    return true;
  } catch (error) {
    console.error('Error saving today data:', error);
    return false;
  }
};

export const getTodayData = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.TODAY_DATA);
    return data ? JSON.parse(data) : getDefaultTodayData();
  } catch (error) {
    console.error('Error loading today data:', error);
    return getDefaultTodayData();
  }
};

const getDefaultTodayData = () => ({
  steps: 0,
  water: 0,
  sleep: 0,
  weight: 0,
  calories: 0,
  caloriesBurned: 0,
  distance: 0,
  duration: 0,
  heartRate: 0,
  lastUpdated: new Date().toISOString(),
});

// Individual setters for today's data
export const saveTodaySteps = async (steps) => {
  try {
    await saveTodayData({ steps: Number(steps), lastUpdated: new Date().toISOString() });
    return true;
  } catch (error) {
    console.error('Error saving today steps:', error);
    return false;
  }
};

export const saveTodayWater = async (water) => {
  try {
    await saveTodayData({ water: Number(water), lastUpdated: new Date().toISOString() });
    return true;
  } catch (error) {
    console.error('Error saving today water:', error);
    return false;
  }
};

export const saveTodaySleep = async (sleep) => {
  try {
    await saveTodayData({ sleep: Number(sleep), lastUpdated: new Date().toISOString() });
    return true;
  } catch (error) {
    console.error('Error saving today sleep:', error);
    return false;
  }
};

export const saveTodayWeight = async (weight) => {
  try {
    await saveTodayData({ weight: Number(weight), lastUpdated: new Date().toISOString() });
    await saveHealthData({ weight: weight.toString() });
    return true;
  } catch (error) {
    console.error('Error saving today weight:', error);
    return false;
  }
};

// Clear all data (for testing/logout)
export const clearAllData = async () => {
  try {
    await AsyncStorage.multiRemove([
      KEYS.WEIGHT_GOAL,
      KEYS.CURRENT_WEIGHT,
      KEYS.STEPS_GOAL,
      KEYS.SLEEP_GOAL,
      KEYS.BEDTIME,
      KEYS.SCREEN_TIME_TARGET,
      KEYS.HEALTH_DATA,
      KEYS.USER_GOALS,
      KEYS.TODAY_DATA,
    ]);
    return true;
  } catch (error) {
    console.error('Error clearing data:', error);
    return false;
  }
};


// AI Plan Storage Functions

// Diet Plan
export const saveDietPlan = async (plan) => {
  try {
    await AsyncStorage.setItem(KEYS.DIET_PLAN, JSON.stringify(plan));
    return true;
  } catch (error) {
    console.error('Error saving diet plan:', error);
    return false;
  }
};

export const getDietPlan = async () => {
  try {
    const plan = await AsyncStorage.getItem(KEYS.DIET_PLAN);
    return plan ? JSON.parse(plan) : null;
  } catch (error) {
    console.error('Error loading diet plan:', error);
    return null;
  }
};

// Workout Plan
export const saveWorkoutPlan = async (plan) => {
  try {
    await AsyncStorage.setItem(KEYS.WORKOUT_PLAN, JSON.stringify(plan));
    return true;
  } catch (error) {
    console.error('Error saving workout plan:', error);
    return false;
  }
};

export const getWorkoutPlan = async () => {
  try {
    const plan = await AsyncStorage.getItem(KEYS.WORKOUT_PLAN);
    return plan ? JSON.parse(plan) : null;
  } catch (error) {
    console.error('Error loading workout plan:', error);
    return null;
  }
};

// Marathon Plan
export const saveMarathonPlan = async (plan) => {
  try {
    await AsyncStorage.setItem(KEYS.MARATHON_PLAN, JSON.stringify(plan));
    return true;
  } catch (error) {
    console.error('Error saving marathon plan:', error);
    return false;
  }
};

export const getMarathonPlan = async () => {
  try {
    const plan = await AsyncStorage.getItem(KEYS.MARATHON_PLAN);
    return plan ? JSON.parse(plan) : null;
  } catch (error) {
    console.error('Error loading marathon plan:', error);
    return null;
  }
};

// Meal Logging
export const saveMealLog = async (date, mealType, completed, foods = []) => {
  try {
    const logs = await getMealLogs();
    const dateKey = date || new Date().toISOString().split('T')[0];
    
    if (!logs[dateKey]) {
      logs[dateKey] = {};
    }
    
    logs[dateKey][mealType] = {
      completed,
      foods,
      timestamp: new Date().toISOString()
    };
    
    await AsyncStorage.setItem(KEYS.MEAL_LOG, JSON.stringify(logs));
    return true;
  } catch (error) {
    console.error('Error saving meal log:', error);
    return false;
  }
};

export const getMealLogs = async () => {
  try {
    const logs = await AsyncStorage.getItem(KEYS.MEAL_LOG);
    return logs ? JSON.parse(logs) : {};
  } catch (error) {
    console.error('Error loading meal logs:', error);
    return {};
  }
};

export const getTodayMealLog = async () => {
  try {
    const logs = await getMealLogs();
    const today = new Date().toISOString().split('T')[0];
    return logs[today] || {};
  } catch (error) {
    console.error('Error loading today meal log:', error);
    return {};
  }
};

// Workout Logging
export const saveWorkoutLog = async (date, workoutName, completed, notes = '') => {
  try {
    const logs = await getWorkoutLogs();
    const dateKey = date || new Date().toISOString().split('T')[0];
    
    if (!logs[dateKey]) {
      logs[dateKey] = [];
    }
    
    logs[dateKey].push({
      workoutName,
      completed,
      notes,
      timestamp: new Date().toISOString()
    });
    
    await AsyncStorage.setItem(KEYS.WORKOUT_LOG, JSON.stringify(logs));
    return true;
  } catch (error) {
    console.error('Error saving workout log:', error);
    return false;
  }
};

export const getWorkoutLogs = async () => {
  try {
    const logs = await AsyncStorage.getItem(KEYS.WORKOUT_LOG);
    return logs ? JSON.parse(logs) : {};
  } catch (error) {
    console.error('Error loading workout logs:', error);
    return {};
  }
};

export const getTodayWorkoutLog = async () => {
  try {
    const logs = await getWorkoutLogs();
    const today = new Date().toISOString().split('T')[0];
    return logs[today] || [];
  } catch (error) {
    console.error('Error loading today workout log:', error);
    return [];
  }
};
