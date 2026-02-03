import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Alert, Modal, TextInput, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BarChart } from 'react-native-chart-kit';
import { useTheme } from '../../../context/ThemeContext';
import { getGoals } from '../../../utils/storage';
import { getMealPlan, trackMealItem, saveWaterIntake, getWaterIntake, getHealthData, recalculateMealPlan } from '../../../api/client';
import { getFoodImage } from '../../../services/unsplashService';

const { width } = Dimensions.get('window');

const NutritionTab = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const [waterGoal, setWaterGoal] = useState('3.0');
  const [todayWater, setTodayWater] = useState(0);
  const [isEditingWater, setIsEditingWater] = useState(false);
  const [waterInput, setWaterInput] = useState('0');
  const [mealPlan, setMealPlan] = useState(null);
  const [showMealPlan, setShowMealPlan] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weeklyWater, setWeeklyWater] = useState([]);
  const [healthData, setHealthData] = useState({ steps: 0, calories_burned: 0, distance: 0 });
  const [mealImages, setMealImages] = useState({});

  // Helper function to get meal icon based on food name
  const getMealIcon = (mealName) => {
    const name = mealName.toLowerCase();
    
    // Breakfast items
    if (name.includes('egg') || name.includes('omelette') || name.includes('scrambled')) return { icon: 'egg', color: '#FFA726' };
    if (name.includes('pancake') || name.includes('waffle')) return { icon: 'pancake', color: '#FFB74D' };
    if (name.includes('toast') || name.includes('bread')) return { icon: 'bread-slice', color: '#D4A574' };
    if (name.includes('oatmeal') || name.includes('cereal') || name.includes('granola')) return { icon: 'bowl-mix', color: '#8D6E63' };
    if (name.includes('yogurt')) return { icon: 'cup', color: '#E1BEE7' };
    if (name.includes('coffee') || name.includes('latte')) return { icon: 'coffee', color: '#6D4C41' };
    
    // Proteins
    if (name.includes('chicken') || name.includes('turkey')) return { icon: 'food-drumstick', color: '#FF8A65' };
    if (name.includes('beef') || name.includes('steak') || name.includes('meat')) return { icon: 'food-steak', color: '#D32F2F' };
    if (name.includes('fish') || name.includes('salmon') || name.includes('tuna')) return { icon: 'fish', color: '#42A5F5' };
    if (name.includes('shrimp') || name.includes('seafood')) return { icon: 'fish', color: '#26C6DA' };
    if (name.includes('tofu') || name.includes('tempeh')) return { icon: 'cube-outline', color: '#FFF9C4' };
    
    // Vegetables & Salads
    if (name.includes('salad') || name.includes('lettuce')) return { icon: 'food-apple', color: '#66BB6A' };
    if (name.includes('broccoli') || name.includes('spinach') || name.includes('kale')) return { icon: 'leaf', color: '#4CAF50' };
    if (name.includes('carrot') || name.includes('vegetable')) return { icon: 'carrot', color: '#FF9800' };
    if (name.includes('tomato')) return { icon: 'food-apple', color: '#F44336' };
    if (name.includes('avocado')) return { icon: 'food-apple', color: '#7CB342' };
    
    // Carbs
    if (name.includes('rice')) return { icon: 'rice', color: '#F5F5DC' };
    if (name.includes('pasta') || name.includes('spaghetti') || name.includes('noodle')) return { icon: 'noodles', color: '#FFE082' };
    if (name.includes('potato') || name.includes('fries')) return { icon: 'food-variant', color: '#FFCC80' };
    if (name.includes('quinoa')) return { icon: 'grain', color: '#D7CCC8' };
    
    // Fruits
    if (name.includes('banana')) return { icon: 'food-apple', color: '#FDD835' };
    if (name.includes('apple')) return { icon: 'food-apple', color: '#EF5350' };
    if (name.includes('orange') || name.includes('citrus')) return { icon: 'fruit-citrus', color: '#FF9800' };
    if (name.includes('berry') || name.includes('strawberry') || name.includes('blueberry')) return { icon: 'fruit-cherries', color: '#E91E63' };
    if (name.includes('grape')) return { icon: 'fruit-grapes', color: '#9C27B0' };
    
    // Snacks & Others
    if (name.includes('nut') || name.includes('almond') || name.includes('peanut')) return { icon: 'peanut', color: '#8D6E63' };
    if (name.includes('cheese')) return { icon: 'cheese', color: '#FFD54F' };
    if (name.includes('milk') || name.includes('dairy')) return { icon: 'cup', color: '#E3F2FD' };
    if (name.includes('smoothie') || name.includes('shake')) return { icon: 'cup-water', color: '#AB47BC' };
    if (name.includes('soup') || name.includes('stew')) return { icon: 'bowl-mix', color: '#FF7043' };
    if (name.includes('burger') || name.includes('sandwich')) return { icon: 'hamburger', color: '#FF6F00' };
    if (name.includes('pizza')) return { icon: 'pizza', color: '#FFA726' };
    
    // Default
    return { icon: 'food', color: '#9E9E9E' };
  };

  useEffect(() => { 
    loadData();
    loadMealPlan();
    loadWeeklyWater();
    loadHealthData();
  }, [selectedDate]);

  const loadData = async () => {
    const goals = await getGoals();
    setWaterGoal(goals.waterGoal || '3.0');
    
    // Fetch today's water from database
    try {
      const today = new Date().toISOString().split('T')[0];
      const result = await getWaterIntake(today);
      if (result.success) {
        setTodayWater(result.amount || 0);
      } else {
        setTodayWater(0);
      }
    } catch (error) {
      console.log('No water data for today');
      setTodayWater(0);
    }
  };

  const loadWeeklyWater = async () => {
    try {
      const result = await getWaterIntake(null, 7);
      if (result.success && result.data) {
        setWeeklyWater(result.data.map(d => ({
          day: d.day,
          water: d.amount
        })));
      }
    } catch (error) {
      console.log('No weekly water data');
      setWeeklyWater([
        { day: 'Mon', water: 0 },
        { day: 'Tue', water: 0 },
        { day: 'Wed', water: 0 },
        { day: 'Thu', water: 0 },
        { day: 'Fri', water: 0 },
        { day: 'Sat', water: 0 },
        { day: 'Sun', water: 0 },
      ]);
    }
  };

  const loadHealthData = async () => {
    try {
      const result = await getHealthData(1); // Get today's data
      if (result && result.length > 0) {
        const today = result[0];
        setHealthData({
          steps: today.steps || 0,
          calories_burned: today.calories_burned || 0,
          distance: today.distance || 0
        });
      } else {
        setHealthData({ steps: 0, calories_burned: 0, distance: 0 });
      }
    } catch (error) {
      console.log('No health data for today');
      setHealthData({ steps: 0, calories_burned: 0, distance: 0 });
    }
  };

  const loadMealPlan = async () => {
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const result = await getMealPlan(dateStr);
      if (result.success && result.meals) {
        setMealPlan(result.meals);
        setShowMealPlan(true);
        
        // Load images for all meal items
        loadMealImages(result.meals);
      }
    } catch (error) {
      console.log('No meal plan for this date');
      setShowMealPlan(false);
      setMealPlan(null);
    }
  };

  const loadMealImages = async (meals) => {
    const images = {};
    const allItems = [
      ...(meals.breakfast?.items || []),
      ...(meals.lunch?.items || []),
      ...(meals.dinner?.items || []),
    ];

    // Load images in parallel
    await Promise.all(
      allItems.map(async (item) => {
        const imageUrl = await getFoodImage(item.name);
        if (imageUrl) {
          images[item.name] = imageUrl;
        }
      })
    );

    setMealImages(images);
  };

  const handleTrackMeal = async (mealItemId, status) => {
    try {
      await trackMealItem(mealItemId, status);
      loadMealPlan(); // Refresh silently
    } catch (error) {
      console.error('Failed to track meal:', error);
    }
  };

  const handleRecalculatePlan = async () => {
    Alert.alert(
      'Recalculate Meal Plan',
      'This will analyze your recent eating patterns and adjust your remaining meal plan accordingly. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Recalculate',
          onPress: async () => {
            try {
              const result = await recalculateMealPlan();
              Alert.alert(
                'Plan Recalculated!',
                `${result.adjustment_note}\n\nAdjusted calories: ${result.adjusted_calories} (was ${result.original_target})\n\nAnalyzed ${result.days_analyzed} days of data.`,
                [{ text: 'OK', onPress: () => loadMealPlan() }]
              );
            } catch (error) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to recalculate meal plan');
            }
          }
        }
      ]
    );
  };

  const handleSaveWater = async () => {
    const value = parseFloat(waterInput);
    if (!isNaN(value) && value >= 0 && value <= 10) {
      try {
        await saveWaterIntake(value, parseFloat(waterGoal));
        setTodayWater(value);
        setIsEditingWater(false);
        Alert.alert('Success', `Water intake updated to ${value}L`);
        loadWeeklyWater(); // Refresh weekly chart
      } catch (error) {
        Alert.alert('Error', 'Failed to save water intake');
      }
    } else {
      Alert.alert('Invalid Input', 'Please enter a valid water amount (0-10L)');
    }
  };

  // Calculate real nutrition data from meal plan
  const calculateNutritionFromMealPlan = () => {
    if (!mealPlan) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    
    let totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    
    ['breakfast', 'lunch', 'dinner'].forEach(mealType => {
      if (mealPlan[mealType]) {
        mealPlan[mealType].items.forEach(item => {
          if (item.tracked && item.status === 'eaten') {
            const ratio = item.quantity_ratio || 1.0;
            totals.calories += item.calories * ratio;
            totals.protein += item.protein * ratio;
            totals.carbs += item.carbs * ratio;
            totals.fat += item.fat * ratio;
          }
        });
      }
    });
    
    return totals;
  };

  const nutritionData = calculateNutritionFromMealPlan();
  const todayCalories = Math.round(nutritionData.calories);
  const caloriesTarget = 2074; // Can be fetched from user goals
  const caloriesLeft = Math.max(0, caloriesTarget - todayCalories);
  
  const waterPercentage = Math.min((todayWater / parseFloat(waterGoal)) * 100, 100);

  // Macros with real data
  const macros = [
    { name: 'Carbs', value: Math.round(nutritionData.carbs), goal: 260, unit: 'g', color: '#26C6DA', icon: 'bread-slice' },
    { name: 'Fat', value: Math.round(nutritionData.fat), goal: 70, unit: 'g', color: '#AB47BC', icon: 'oil' },
    { name: 'Protein', value: Math.round(nutritionData.protein), goal: 104, unit: 'g', color: '#FFA726', icon: 'food-steak' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Nutrition</Text>

      {/* Hydration - Water Drop */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.hydrationHeader}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Hydration</Text>
          <TouchableOpacity 
            onPress={() => {
              setWaterInput(String(todayWater));
              setIsEditingWater(true);
            }} 
            style={[styles.editBtnSmall, { backgroundColor: colors.accent }]}
          >
            <Icon name="pencil" size={16} color="#FFF" />
          </TouchableOpacity>
        </View>
        
        {todayWater === 0 ? (
          <View style={styles.noWaterContainer}>
            <Icon name="water-alert" size={64} color={colors.textTertiary} style={{ marginBottom: 16 }} />
            <Text style={[styles.noWaterText, { color: colors.textSecondary }]}>
              Stay hydrated! 💧
            </Text>
            <Text style={[styles.noWaterSubtext, { color: colors.textTertiary }]}>
              Please log your water intake to track your hydration goals
            </Text>
            <TouchableOpacity
              style={[styles.addWaterButton, { backgroundColor: colors.accent }]}
              onPress={() => {
                setWaterInput('0');
                setIsEditingWater(true);
              }}
            >
              <Icon name="plus" size={20} color="#FFF" />
              <Text style={styles.addWaterButtonText}>Add Water Intake</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.waterDropContainer}>
              <View style={styles.waterDrop}>
                {/* Water fill - clipped to stay within borders */}
                <View style={styles.waterFillContainer}>
                  <View style={[styles.waterFill, { height: `${waterPercentage}%`, backgroundColor: '#42A5F5' }]} />
                </View>
                {/* Water drop outline */}
                <View style={[styles.waterDropOutline, { borderColor: '#42A5F5' }]} />
                {/* Text inside */}
                <View style={styles.waterTextContainer}>
                  <Icon name="water" size={32} color="#FFFFFF" />
                  <Text style={styles.waterValue}>{todayWater.toFixed(1)}L</Text>
                  <Text style={styles.waterGoalText}>of {waterGoal}L</Text>
                  <Text style={styles.waterPercentage}>{Math.round(waterPercentage)}%</Text>
                </View>
              </View>
            </View>
            <Text style={[styles.waterRemaining, { color: colors.textSecondary }]}>
              {Math.max(0, parseFloat(waterGoal) - todayWater).toFixed(1)}L remaining
            </Text>
          </>
        )}
      </View>

      {/* Water Edit Modal */}
      <Modal visible={isEditingWater} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#182E3D' : '#E8F0EE' }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Update Water Intake</Text>
            <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Enter amount of water consumed (L)</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.cardGlass, color: colors.textPrimary, borderColor: colors.border }]}
              value={waterInput}
              onChangeText={setWaterInput}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={colors.textTertiary}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.cardGlass }]}
                onPress={() => setIsEditingWater(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.accent }]}
                onPress={handleSaveWater}
              >
                <Text style={[styles.modalButtonText, { color: '#FFF' }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Weekly Water Intake Chart */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Weekly Water Intake</Text>
        <Text style={[styles.weekInfo, { color: colors.textSecondary }]}>
          Week of {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </Text>
        
        {/* Y-axis label */}
        <Text style={[styles.yAxisLabel, { color: colors.textSecondary }]}>Water (Liters)</Text>
        
        <BarChart
          data={{
            labels: weeklyWater.map(d => d.day.substring(0, 3)),
            datasets: [{ data: weeklyWater.map(d => d.water) }]
          }}
          width={width - 80}
          height={200}
          yAxisSuffix="L"
          yAxisLabel=""
          chartConfig={{
            backgroundColor: isDark ? '#0F2027' : '#FFFFFF',
            backgroundGradientFrom: isDark ? '#0F2027' : '#FFFFFF',
            backgroundGradientTo: isDark ? '#0F2027' : '#FFFFFF',
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(66, 165, 245, ${opacity})`,
            labelColor: () => isDark ? '#E6F1EF' : '#1E2A28',
            barPercentage: 0.6,
            propsForBackgroundLines: {
              strokeDasharray: '',
              stroke: isDark ? 'rgba(230, 241, 239, 0.1)' : 'rgba(30, 42, 40, 0.1)',
            },
            propsForLabels: {
              fontSize: 11,
            }
          }}
          style={{ marginVertical: 8, borderRadius: 16 }}
          fromZero
        />
      </View>

      {/* Today's Meal Plan */}
      {showMealPlan && mealPlan && (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.mealPlanHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[styles.iconCircle, { backgroundColor: colors.accent + '20' }]}>
                <Icon name="food" size={20} color={colors.accent} />
              </View>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                Today's Meal Plan
              </Text>
            </View>
            <TouchableOpacity onPress={loadMealPlan}>
              <Icon name="refresh" size={20} color={colors.accent} />
            </TouchableOpacity>
          </View>

          {/* Breakfast */}
          {mealPlan.breakfast && (
            <View style={styles.mealSection}>
              <View style={styles.mealHeader}>
                <Icon name="coffee" size={24} color="#FFA726" />
                <Text style={[styles.mealTitle, { color: colors.textPrimary }]}>
                  Breakfast
                </Text>
                <Text style={[styles.mealCalories, { color: colors.textSecondary }]}>
                  {mealPlan.breakfast.total_calories} kcal
                </Text>
              </View>
              
              {mealPlan.breakfast.items.map((item, index) => {
                const mealIconData = getMealIcon(item.name);
                const imageUrl = mealImages[item.name];
                
                return (
                  <View key={index} style={[styles.foodItem, { borderColor: colors.border, borderWidth: 1 }]}>
                    {/* Meal Image or Icon */}
                    {imageUrl ? (
                      <Image 
                        source={{ uri: imageUrl }} 
                        style={styles.foodImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Icon name={mealIconData.icon} size={32} color={mealIconData.color} style={{ marginRight: 12 }} />
                    )}
                    
                    <View style={styles.foodInfo}>
                      <Text style={[styles.foodName, { color: colors.textPrimary }]}>
                        {item.name}
                      </Text>
                      <Text style={[styles.foodNutrition, { color: colors.textSecondary }]}>
                        {item.calories} cal | P: {item.protein}g | C: {item.carbs}g | F: {item.fat}g
                      </Text>
                    </View>
                    
                    <View style={styles.trackingButtons}>
                      <TouchableOpacity
                        style={styles.trackButton}
                        onPress={() => handleTrackMeal(item.id, 'eaten')}
                      >
                        <Icon 
                          name="check-circle" 
                          size={28} 
                          color="#4CAF50" 
                        />
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={styles.trackButton}
                        onPress={() => handleTrackMeal(item.id, 'skipped')}
                      >
                        <Icon 
                          name="close-circle" 
                          size={28} 
                          color="#F44336" 
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Lunch */}
          {mealPlan.lunch && (
            <View style={styles.mealSection}>
              <View style={styles.mealHeader}>
                <Icon name="food" size={24} color="#66BB6A" />
                <Text style={[styles.mealTitle, { color: colors.textPrimary }]}>
                  Lunch
                </Text>
                <Text style={[styles.mealCalories, { color: colors.textSecondary }]}>
                  {mealPlan.lunch.total_calories} kcal
                </Text>
              </View>
              
              {mealPlan.lunch.items.map((item, index) => {
                const mealIconData = getMealIcon(item.name);
                const imageUrl = mealImages[item.name];
                
                return (
                  <View key={index} style={[styles.foodItem, { borderColor: colors.border, borderWidth: 1 }]}>
                    {/* Meal Image or Icon */}
                    {imageUrl ? (
                      <Image 
                        source={{ uri: imageUrl }} 
                        style={styles.foodImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Icon name={mealIconData.icon} size={32} color={mealIconData.color} style={{ marginRight: 12 }} />
                    )}
                    
                    <View style={styles.foodInfo}>
                      <Text style={[styles.foodName, { color: colors.textPrimary }]}>
                        {item.name}
                      </Text>
                      <Text style={[styles.foodNutrition, { color: colors.textSecondary }]}>
                        {item.calories} cal | P: {item.protein}g | C: {item.carbs}g | F: {item.fat}g
                      </Text>
                    </View>
                    
                    <View style={styles.trackingButtons}>
                      <TouchableOpacity
                        style={styles.trackButton}
                        onPress={() => handleTrackMeal(item.id, 'eaten')}
                      >
                        <Icon 
                          name="check-circle" 
                          size={28} 
                          color="#4CAF50" 
                        />
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={styles.trackButton}
                        onPress={() => handleTrackMeal(item.id, 'skipped')}
                      >
                        <Icon 
                          name="close-circle" 
                          size={28} 
                          color="#F44336" 
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Dinner */}
          {mealPlan.dinner && (
            <View style={styles.mealSection}>
              <View style={styles.mealHeader}>
                <Icon name="food-variant" size={24} color="#AB47BC" />
                <Text style={[styles.mealTitle, { color: colors.textPrimary }]}>
                  Dinner
                </Text>
                <Text style={[styles.mealCalories, { color: colors.textSecondary }]}>
                  {mealPlan.dinner.total_calories} kcal
                </Text>
              </View>
              
              {mealPlan.dinner.items.map((item, index) => {
                const mealIconData = getMealIcon(item.name);
                const imageUrl = mealImages[item.name];
                
                return (
                  <View key={index} style={[styles.foodItem, { borderColor: colors.border, borderWidth: 1 }]}>
                    {/* Meal Image or Icon */}
                    {imageUrl ? (
                      <Image 
                        source={{ uri: imageUrl }} 
                        style={styles.foodImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Icon name={mealIconData.icon} size={32} color={mealIconData.color} style={{ marginRight: 12 }} />
                    )}
                    
                    <View style={styles.foodInfo}>
                      <Text style={[styles.foodName, { color: colors.textPrimary }]}>
                        {item.name}
                      </Text>
                      <Text style={[styles.foodNutrition, { color: colors.textSecondary }]}>
                        {item.calories} cal | P: {item.protein}g | C: {item.carbs}g | F: {item.fat}g
                      </Text>
                    </View>
                    
                    <View style={styles.trackingButtons}>
                      <TouchableOpacity
                        style={styles.trackButton}
                        onPress={() => handleTrackMeal(item.id, 'eaten')}
                      >
                        <Icon 
                          name="check-circle" 
                          size={28} 
                          color="#4CAF50" 
                        />
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={styles.trackButton}
                        onPress={() => handleTrackMeal(item.id, 'skipped')}
                      >
                        <Icon 
                          name="close-circle" 
                          size={28} 
                          color="#F44336" 
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Calories Card - Under Meal Plan */}
          {todayCalories > 0 && (
            <View style={[styles.card, { backgroundColor: colors.cardGlass, borderColor: colors.border, marginTop: 16 }]}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Calories</Text>
              <View style={styles.caloriesRow}>
                <Text style={[styles.caloriesValue, { color: colors.textPrimary }]}>{todayCalories} cal</Text>
                <Text style={[styles.caloriesTarget, { color: colors.textSecondary }]}>/ {caloriesTarget}</Text>
              </View>
              <View style={[styles.progressBar, { backgroundColor: colors.cardGlass }]}>
                <View style={[styles.progressFill, { width: `${(todayCalories / caloriesTarget) * 100}%`, backgroundColor: '#42A5F5' }]} />
              </View>
              <Text style={[styles.caloriesLeft, { color: colors.textSecondary }]}>{caloriesLeft} left</Text>
            </View>
          )}

          {/* Macros - Under Calories */}
          {todayCalories > 0 && (
            <View style={[styles.card, { backgroundColor: colors.cardGlass, borderColor: colors.border }]}>
              <View style={styles.macrosHeader}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Macros</Text>
              </View>
              <View style={styles.macrosGrid}>
                {macros.map((macro, index) => (
                  <View key={index} style={styles.macroBlock}>
                    <Icon name={macro.icon} size={32} color={macro.color} style={{ marginBottom: 8 }} />
                    <Text style={[styles.macroName, { color: colors.textSecondary }]}>{macro.name}</Text>
                    <Text style={[styles.macroValue, { color: colors.textPrimary }]}>
                      {macro.value} <Text style={styles.macroUnit}>/ {macro.goal}</Text>
                    </Text>
                    <View style={[styles.macroBar, { backgroundColor: colors.cardGlass }]}>
                      <View style={[styles.macroBarFill, { width: `${Math.min((macro.value / macro.goal) * 100, 100)}%`, backgroundColor: macro.color }]} />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Daily Nutrition Summary */}
          <View style={[styles.nutritionSummary, { backgroundColor: colors.cardGlass, borderColor: colors.border }]}>
            <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>Today's Nutrition</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Icon name="fire" size={24} color="#FF6B6B" />
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Calories</Text>
                <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{todayCalories}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Icon name="food-steak" size={24} color="#FFA726" />
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Protein</Text>
                <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{Math.round(nutritionData.protein)}g</Text>
              </View>
              <View style={styles.summaryItem}>
                <Icon name="bread-slice" size={24} color="#26C6DA" />
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Carbs</Text>
                <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{Math.round(nutritionData.carbs)}g</Text>
              </View>
              <View style={styles.summaryItem}>
                <Icon name="oil" size={24} color="#AB47BC" />
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Fat</Text>
                <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{Math.round(nutritionData.fat)}g</Text>
              </View>
            </View>
            {todayCalories > 0 && (
              <Text style={[styles.summaryComment, { color: colors.success }]}>
                Great job tracking your meals! Keep it up! 💪
              </Text>
            )}
          </View>

          {/* Action Buttons */}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.accent, flex: 1 }]}
              onPress={handleRecalculatePlan}
            >
              <Icon name="calculator" size={20} color="#FFF" />
              <Text style={styles.actionButtonText}>Recalculate</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.cardGlass, borderWidth: 1, borderColor: colors.accent, flex: 1 }]}
              onPress={() => navigation.navigate('DietPlan')}
            >
              <Icon name="sparkles" size={20} color={colors.accent} />
              <Text style={[styles.actionButtonText, { color: colors.accent }]}>New Plan</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* No Plan Message - Updated Design */}
      {!showMealPlan && navigation && (
        <>
          {/* No Meal Plan Card - Navigate to Diet Plan */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Icon name="food-off" size={64} color={colors.textTertiary} style={{ alignSelf: 'center', marginBottom: 16 }} />
            <Text style={[styles.noPlanText, { color: colors.textSecondary }]}>No meal plan available for today.</Text>
            <Text style={[styles.noPlanSubtext, { color: colors.textTertiary, textAlign: 'center', marginVertical: 8 }]}>
              Get a personalized AI meal plan based on your profile and fitness goals.
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12 }}>
              <TouchableOpacity
                style={[styles.generateButton, { backgroundColor: colors.accent }]}
                onPress={() => navigation.navigate('DietPlan')}
              >
                <Icon name="sparkles" size={20} color="#FFF" />
                <Text style={styles.generateButtonText}>Get AI Meal Plan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 100 },
  sectionTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  card: { 
    padding: 24, 
    borderRadius: 20, 
    marginBottom: 20, 
    borderWidth: 1,
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  weekInfo: { fontSize: 13, fontWeight: '600', marginBottom: 12 },
  yAxisLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  caloriesRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 12 },
  caloriesValue: { fontSize: 36, fontWeight: 'bold' },
  caloriesTarget: { fontSize: 18, marginLeft: 4 },
  progressBar: { height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', borderRadius: 6 },
  caloriesLeft: { fontSize: 14 },
  macrosHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  macrosGrid: { flexDirection: 'row', gap: 12 },
  macroBlock: { flex: 1, alignItems: 'center' },
  macroIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  macroName: { fontSize: 12, marginBottom: 4 },
  macroValue: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  macroUnit: { fontSize: 12, fontWeight: 'normal' },
  macroBar: { width: '100%', height: 6, borderRadius: 3, overflow: 'hidden' },
  macroBarFill: { height: '100%', borderRadius: 3 },
  nutrientsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  nutrientChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, gap: 6 },
  nutrientName: { fontSize: 13, fontWeight: '600' },
  nutrientValue: { fontSize: 13, fontWeight: 'bold' },
  waterDropContainer: { alignItems: 'center', marginVertical: 20 },
  waterDrop: { width: 160, height: 200, position: 'relative', justifyContent: 'flex-end', alignItems: 'center' },
  waterFillContainer: { position: 'absolute', bottom: 0, width: 160, height: 200, borderTopLeftRadius: 80, borderTopRightRadius: 80, borderBottomLeftRadius: 80, borderBottomRightRadius: 80, overflow: 'hidden' },
  waterFill: { position: 'absolute', bottom: 0, width: '100%', borderBottomLeftRadius: 80, borderBottomRightRadius: 80, opacity: 0.8 },
  waterDropOutline: { position: 'absolute', width: 160, height: 200, borderWidth: 4, borderTopLeftRadius: 80, borderTopRightRadius: 80, borderBottomLeftRadius: 80, borderBottomRightRadius: 80, borderTopWidth: 0 },
  waterTextContainer: { position: 'absolute', alignItems: 'center', zIndex: 10 },
  waterValue: { fontSize: 32, fontWeight: 'bold', color: '#FFFFFF', textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  waterGoalText: { fontSize: 14, color: '#FFFFFF', textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  waterPercentage: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginTop: 4, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  waterRemaining: { fontSize: 14, textAlign: 'center' },
  noWaterContainer: { alignItems: 'center', paddingVertical: 20 },
  noWaterText: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  noWaterSubtext: { fontSize: 14, marginBottom: 20, textAlign: 'center', paddingHorizontal: 20 },
  addWaterButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, gap: 8 },
  addWaterButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  hydrationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  editBtnSmall: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  aiPlanButton: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 20, borderWidth: 2, gap: 16, marginBottom: 16 },
  aiPlanContent: { flex: 1 },
  aiPlanTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  aiPlanSubtitle: { fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', maxWidth: 400, borderRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  modalLabel: { fontSize: 14, marginBottom: 16 },
  modalInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, marginBottom: 20 },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  modalButtonText: { fontSize: 16, fontWeight: 'bold' },
  mealPlanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  mealSection: {
    marginBottom: 24,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  mealTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  mealCalories: {
    fontSize: 14,
    fontWeight: '600',
  },
  foodItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  foodImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 12,
  },
  mealIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  foodNutrition: {
    fontSize: 12,
  },
  trackingButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  trackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 16,
  },
  generateButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  noPlanText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  noPlanSubtext: {
    fontSize: 14,
  },
  nutritionSummary: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 16,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 2,
  },
  summaryComment: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 8,
  },
});

export default NutritionTab;
