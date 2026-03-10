import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Modal, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LineChart } from 'react-native-chart-kit';
import { useTheme } from '../../../context/ThemeContext';
import { getTodayData, getGoals } from '../../../utils/storage';
import { getHealthData, getActiveWorkoutPlan, trackWorkoutExercise, completeWorkoutPlan, getActiveMarathonPlan, trackMarathonDay, completeMarathonWeek } from '../../../api/client';

const { width } = Dimensions.get('window');

const ActivityTab = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const [timeFilter, setTimeFilter] = useState('Weekly');
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [todaySteps, setTodaySteps] = useState(0);
  const [stepsGoal, setStepsGoal] = useState(10000);
  const [healthRealtime, setHealthRealtime] = useState(null);
  const [weeklyData, setWeeklyData] = useState([]);
  const [dataError, setDataError] = useState(null);
  
  // Active plans state
  const [activeWorkoutPlan, setActiveWorkoutPlan] = useState(null);
  const [activeMarathonPlan, setActiveMarathonPlan] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackType, setFeedbackType] = useState(null); // 'workout' or 'marathon'
  const [feedbackDifficulty, setFeedbackDifficulty] = useState('just_right');
  const [feedbackPreference, setFeedbackPreference] = useState('same');

  // Icon colors - darker for light mode
  const getIconColor = (lightColor, darkColor) => isDark ? darkColor : lightColor;
  
  const iconColors = {
    fire: getIconColor('#E64A19', '#FF7043'),
    distance: getIconColor('#01579B', '#42A5F5'),
    clock: getIconColor('#2E7D32', '#66BB6A'),
    workout: getIconColor('#01579B', '#42A5F5'),
    marathon: getIconColor('#6A1B9A', '#AB47BC'),
  };

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const todayData = await getTodayData();
      const goals = await getGoals();
      setTodaySteps(todayData.steps || 0);
      setStepsGoal(parseInt(goals.stepsGoal) || 10000);

      // Try fetch real health data (last 7 days)
      const result = await getHealthData(7);
      if (result && Array.isArray(result) && result.length > 0) {
        // map to weekly steps summary (days may be returned as objects)
        const mapped = result.map(r => ({ day: (r.day || '').toString().substring(0,3) || new Date(r.date).toLocaleDateString('en-US',{weekday:'short'}), steps: r.steps || 0 }));
        setWeeklyData(mapped);
        // set today's realtime from first element if exists
        const today = result[0];
        setHealthRealtime({ steps: today.steps || 0, calories: today.calories_burned || 0, distance: today.distance || 0 });
        setTodaySteps(today.steps || todayData.steps || 0);
      } else {
        setWeeklyData([]);
      }
      
      // Load active plans
      await loadActivePlans();
    } catch (error) {
      console.error('ActivityTab - getHealthData error', error?.message || error);
      setDataError(error);
      setWeeklyData([]);
    }
  };
  
  const loadActivePlans = async () => {
    try {
      // Load active workout plan
      const workoutResponse = await getActiveWorkoutPlan();
      if (workoutResponse.has_active_plan && !workoutResponse.all_completed) {
        setActiveWorkoutPlan(workoutResponse);
      } else {
        setActiveWorkoutPlan(null);
      }
      
      // Load active marathon plan
      const marathonResponse = await getActiveMarathonPlan();
      if (marathonResponse.has_active_plan && !marathonResponse.all_completed) {
        setActiveMarathonPlan(marathonResponse);
      } else {
        setActiveMarathonPlan(null);
      }
    } catch (error) {
      console.error('Error loading active plans:', error);
    }
  };
  
  const handleWorkoutExerciseToggle = async (exerciseIndex, currentStatus) => {
    try {
      const response = await trackWorkoutExercise(activeWorkoutPlan.workout_id, exerciseIndex, !currentStatus);
      
      // Update local state for multi-day or single-day format
      if (activeWorkoutPlan.is_multi_day) {
        const updatedDays = activeWorkoutPlan.days.map(day => ({
          ...day,
          exercises: day.exercises.map(ex => 
            ex.index === exerciseIndex ? { ...ex, completed: !currentStatus } : ex
          )
        }));
        
        setActiveWorkoutPlan({
          ...activeWorkoutPlan,
          days: updatedDays,
          all_completed: response.all_completed,
          progress: {
            ...activeWorkoutPlan.progress,
            completed: activeWorkoutPlan.progress.completed + (currentStatus ? -1 : 1)
          }
        });
      } else {
        const updatedExercises = activeWorkoutPlan.exercises.map((ex, idx) => 
          idx === exerciseIndex ? { ...ex, completed: !currentStatus } : ex
        );
        
        setActiveWorkoutPlan({
          ...activeWorkoutPlan,
          exercises: updatedExercises,
          all_completed: response.all_completed
        });
      }
      
      // If all completed, show feedback modal
      if (response.all_completed) {
        setFeedbackType('workout');
        setShowFeedbackModal(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update exercise status');
    }
  };
  
  const getWorkoutIcon = (workoutType) => {
    const iconMap = {
      'cardio': 'run',
      'strength': 'dumbbell',
      'flexibility': 'yoga',
      'hiit': 'lightning-bolt',
      'yoga': 'meditation',
      'core': 'ab-testing',
      'general': 'weight-lifter'
    };
    return iconMap[workoutType?.toLowerCase()] || 'weight-lifter';
  };
  
  const getWorkoutColor = (workoutType) => {
    const colorMap = {
      'cardio': '#FF7043',
      'strength': '#42A5F5',
      'flexibility': '#66BB6A',
      'hiit': '#FFA726',
      'yoga': '#AB47BC',
      'core': '#26C6DA',
      'general': '#78909C'
    };
    return colorMap[workoutType?.toLowerCase()] || '#78909C';
  };
  
  const handleMarathonDayToggle = async (dayIndex, currentStatus) => {
    try {
      const response = await trackMarathonDay(activeMarathonPlan.marathon_id, dayIndex, !currentStatus);
      
      // Update local state
      const updatedSchedule = activeMarathonPlan.schedule.map((day, idx) => 
        idx === dayIndex ? { ...day, completed: !currentStatus } : day
      );
      
      setActiveMarathonPlan({
        ...activeMarathonPlan,
        schedule: updatedSchedule,
        all_completed: response.all_completed
      });
      
      // If all completed, show feedback modal
      if (response.all_completed) {
        setFeedbackType('marathon');
        setShowFeedbackModal(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update day status');
    }
  };
  
  const handleSubmitFeedback = async () => {
    try {
      if (feedbackType === 'workout') {
        await completeWorkoutPlan(activeWorkoutPlan.workout_id, feedbackDifficulty, feedbackPreference);
        Alert.alert('Success', 'Workout completed! Generate a new plan when ready.');
        setActiveWorkoutPlan(null);
      } else if (feedbackType === 'marathon') {
        await completeMarathonWeek(activeMarathonPlan.marathon_id, feedbackDifficulty, feedbackPreference);
        Alert.alert('Success', 'Week completed! Generate a new plan when ready.');
        setActiveMarathonPlan(null);
      }
      
      setShowFeedbackModal(false);
      setFeedbackDifficulty('just_right');
      setFeedbackPreference('same');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit feedback');
    }
  };

  // Today's data (from realtime health data when available)
  const caloriesBurned = healthRealtime?.calories || 0;
  const caloriesTarget = 650;
  const distance = healthRealtime?.distance || 0;
  const duration = '0m';

  // Activity categories - only show if there's actual data
  const activityCategories = [];

  const computedWeekly = weeklyData;

  const stepsProgress = todaySteps / stepsGoal;
  const caloriesProgress = caloriesBurned / caloriesTarget;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>My Activity</Text>
      {dataError && (
        <View style={{ paddingHorizontal: 6, marginBottom: 12 }}>
          <Text style={{ color: colors.error, fontSize: 13 }}>* Unable to load activity data (Network Error). Showing cached or zero values.</Text>
        </View>
      )}

      {/* Steps Circle Progress */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Today's Steps</Text>
        <View style={styles.circleContainer}>
          <View style={[styles.progressCircle, { borderColor: '#4CAF50' }]}>
            <Text style={[styles.stepsValue, { color: colors.textPrimary }]}>{todaySteps}</Text>
            <Text style={[styles.stepsGoal, { color: colors.textSecondary }]}>of {stepsGoal}</Text>
          </View>
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <View style={[styles.iconCircle, { backgroundColor: iconColors.fire + '20' }]}>
              <Icon name="fire" size={28} color={iconColors.fire} />
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Calories</Text>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{caloriesBurned}</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.iconCircle, { backgroundColor: iconColors.distance + '20' }]}>
              <Icon name="map-marker-distance" size={28} color={iconColors.distance} />
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Distance</Text>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{distance.toFixed(2)} km</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.iconCircle, { backgroundColor: iconColors.clock + '20' }]}>
              <Icon name="clock-outline" size={28} color={iconColors.clock} />
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Duration</Text>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{duration}</Text>
          </View>
        </View>
      </View>

      {/* Weekly Steps Chart */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.chartHeaderRow}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Progress</Text>
          <Text style={[styles.timePeriodLabel, { color: colors.textSecondary }]}>
            {timeFilter === 'Weekly' ? 'This Week' : timeFilter === 'Monthly' ? 'This Month' : 'This Year'}
          </Text>
        </View>
        
        {/* Time Filter - Moved above chart */}
        <View style={styles.filterContainerInCard}>
          {['Weekly', 'Monthly', 'Yearly'].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButtonSmall,
                {
                  backgroundColor: timeFilter === filter ? '#7C4DFF' : colors.cardGlass,
                  borderColor: timeFilter === filter ? '#7C4DFF' : colors.border,
                },
              ]}
              onPress={() => setTimeFilter(filter)}
            >
              <Text style={[styles.filterTextSmall, { color: timeFilter === filter ? '#FFF' : colors.textSecondary }]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {computedWeekly && computedWeekly.length > 0 ? (
          <>
            {/* Y-axis label */}
            <Text style={[styles.yAxisLabel, { color: colors.textSecondary }]}>Steps (count)</Text>

            <LineChart
              data={{
                labels: computedWeekly.map(d => d.day),
                datasets: [{ data: computedWeekly.map(d => d.steps), color: () => '#7C4DFF' }]
              }}
              width={width - 80}
              height={200}
              yAxisSuffix=""
              yAxisLabel=""
              chartConfig={{
                backgroundColor: isDark ? '#0F2027' : '#FFFFFF',
                backgroundGradientFrom: isDark ? '#0F2027' : '#FFFFFF',
                backgroundGradientTo: isDark ? '#0F2027' : '#FFFFFF',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(124, 77, 255, ${opacity})`,
                labelColor: () => isDark ? '#E6F1EF' : '#1E2A28',
                style: { borderRadius: 16 },
                propsForDots: {
                  r: '6',
                  strokeWidth: '3',
                  stroke: '#7C4DFF',
                  fill: isDark ? '#0F2027' : '#FFFFFF'
                },
                propsForBackgroundLines: {
                  strokeDasharray: '',
                  stroke: isDark ? 'rgba(230, 241, 239, 0.1)' : 'rgba(30, 42, 40, 0.1)',
                }
              }}
              bezier
              style={{ marginVertical: 8, borderRadius: 16 }}
            />
            {/* X-axis label */}
            <Text style={[styles.xAxisLabel, { color: colors.textSecondary }]}>
              {timeFilter === 'Weekly' ? 'Days of Week' : timeFilter === 'Monthly' ? 'Weeks of Month' : 'Months of Year'}
            </Text>
          </>
        ) : (
          <View style={[styles.noDataBox, { backgroundColor: colors.info + '10', borderColor: colors.info }]}>
            <Icon name="chart-line" size={48} color={colors.textTertiary} />
            <Text style={[styles.noDataText, { color: colors.textSecondary }]}>No activity data available yet</Text>
            <Text style={[styles.noDataSubtext, { color: colors.textTertiary }]}>Connect Health Connect to track your steps automatically</Text>
          </View>
        )}
      </View>

      {/* Activity Categories */}
      {activityCategories.length > 0 && (
        <>
          <View style={styles.categoriesHeader}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Activity Categories</Text>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: '#7C4DFF' }]}
              onPress={() => setShowAddActivity(true)}
            >
              <Icon name="plus" size={20} color="#FFF" />
              <Text style={styles.addButtonText}>Add Activity</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.categoriesGrid}>
            {activityCategories.map((activity, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.categoryCard, { backgroundColor: isDark ? activity.color + '15' : activity.color + '20', borderColor: activity.color }]}
              >
                <Icon name={activity.icon} size={40} color={activity.color} style={{ marginBottom: 12 }} />
                <Text style={[styles.categoryName, { color: colors.textPrimary }]}>{activity.name}</Text>
                <Text style={[styles.categoryCalories, { color: isDark ? activity.color : colors.textPrimary }]}>{activity.calories} cal</Text>
                <Text style={[styles.categoryDuration, { color: colors.textSecondary }]}>{activity.duration}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* Progress Bars */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Daily Progress</Text>
        
        <View style={styles.progressItem}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>Calories Burned</Text>
            <Text style={[styles.progressValue, { color: colors.textPrimary }]}>
              {caloriesBurned} / {caloriesTarget} kcal
            </Text>
          </View>
          <View style={[styles.progressBarBg, { backgroundColor: colors.cardGlass }]}>
            <View style={[styles.progressBarFill, { width: `${caloriesProgress * 100}%`, backgroundColor: '#FF7043' }]} />
          </View>
          <Text style={[styles.progressRemaining, { color: colors.textTertiary }]}>
            {caloriesTarget - caloriesBurned} kcal remaining
          </Text>
        </View>

        <View style={styles.progressItem}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>Steps</Text>
            <Text style={[styles.progressValue, { color: colors.textPrimary }]}>
              {todaySteps} / {stepsGoal} steps
            </Text>
          </View>
          <View style={[styles.progressBarBg, { backgroundColor: colors.cardGlass }]}>
            <View style={[styles.progressBarFill, { width: `${stepsProgress * 100}%`, backgroundColor: '#4CAF50' }]} />
          </View>
          <Text style={[styles.progressRemaining, { color: colors.textTertiary }]}>
            {stepsGoal - todaySteps} steps remaining
          </Text>
        </View>
      </View>

      {/* Training Plans */}
      {navigation && (
        <View>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 8, marginBottom: 16 }]}>
            {(activeWorkoutPlan || activeMarathonPlan) ? 'Active Plans' : 'Personalized Plans'}
          </Text>
          
          {/* Active Workout Plan */}
          {activeWorkoutPlan && (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 20 }]}>
              <View style={styles.planHeader}>
                <View style={[styles.iconCircle, { backgroundColor: iconColors.workout + '25' }]}>
                  <Icon name="dumbbell" size={28} color={iconColors.workout} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.planHeaderTitle, { color: colors.textPrimary }]}>Workout Plan</Text>
                  <Text style={[styles.planHeaderSubtitle, { color: colors.textSecondary }]}>
                    {activeWorkoutPlan.is_multi_day 
                      ? `${activeWorkoutPlan.progress.completed} / ${activeWorkoutPlan.progress.total} exercises completed`
                      : `${activeWorkoutPlan.exercises.filter(e => e.completed).length} / ${activeWorkoutPlan.exercises.length} completed`
                    }
                  </Text>
                </View>
              </View>
              
              {activeWorkoutPlan.is_multi_day ? (
                // Multi-day format
                activeWorkoutPlan.days.map((day, dayIndex) => (
                  <View key={dayIndex}>
                    <Text style={[styles.dayHeaderText, { color: colors.textPrimary }]}>{day.day_name}</Text>
                    {day.is_rest_day ? (
                      <View style={[styles.restDayBadge, { backgroundColor: colors.cardGlass }]}>
                        <Icon name="sleep" size={20} color={colors.textTertiary} />
                        <Text style={[styles.restDayText, { color: colors.textSecondary }]}>Rest Day</Text>
                      </View>
                    ) : (
                      day.exercises.map((exercise, exIndex) => {
                        const workoutColor = getWorkoutColor(exercise.workout_type);
                        return (
                          <TouchableOpacity
                            key={exIndex}
                            style={[styles.checklistItem, { borderColor: colors.border }]}
                            onPress={() => handleWorkoutExerciseToggle(exercise.index, exercise.completed)}
                          >
                            <View style={[styles.checkbox, { borderColor: exercise.completed ? iconColors.workout : colors.border, backgroundColor: exercise.completed ? iconColors.workout : 'transparent' }]}>
                              {exercise.completed && <Icon name="check" size={16} color="#FFF" />}
                            </View>
                            <View style={[styles.workoutTypeIcon, { backgroundColor: workoutColor + '20' }]}>
                              <Icon name={getWorkoutIcon(exercise.workout_type)} size={20} color={workoutColor} />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.checklistItemText, { color: colors.textPrimary, textDecorationLine: exercise.completed ? 'line-through' : 'none' }]}>
                                {exercise.name}
                              </Text>
                              <Text style={[styles.checklistItemSubtext, { color: colors.textSecondary }]}>
                                {exercise.reps_or_duration}
                              </Text>
                            </View>
                            <Text style={[styles.checklistCalories, { color: iconColors.fire }]}>
                              {exercise.calories} cal
                            </Text>
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </View>
                ))
              ) : (
                // Single day format (backward compatibility)
                activeWorkoutPlan.exercises.map((exercise, index) => {
                  const workoutColor = getWorkoutColor(exercise.workout_type);
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[styles.checklistItem, { borderColor: colors.border }]}
                      onPress={() => handleWorkoutExerciseToggle(index, exercise.completed)}
                    >
                      <View style={[styles.checkbox, { borderColor: exercise.completed ? iconColors.workout : colors.border, backgroundColor: exercise.completed ? iconColors.workout : 'transparent' }]}>
                        {exercise.completed && <Icon name="check" size={16} color="#FFF" />}
                      </View>
                      <View style={[styles.workoutTypeIcon, { backgroundColor: workoutColor + '20' }]}>
                        <Icon name={getWorkoutIcon(exercise.workout_type)} size={20} color={workoutColor} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.checklistItemText, { color: colors.textPrimary, textDecorationLine: exercise.completed ? 'line-through' : 'none' }]}>
                          {exercise.name}
                        </Text>
                        <Text style={[styles.checklistItemSubtext, { color: colors.textSecondary }]}>
                          {exercise.reps_or_duration}
                        </Text>
                      </View>
                      <Text style={[styles.checklistCalories, { color: iconColors.fire }]}>
                        {exercise.calories} cal
                      </Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          )}
          
          {/* Active Marathon Plan */}
          {activeMarathonPlan && (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 20 }]}>
              <View style={styles.planHeader}>
                <View style={[styles.iconCircle, { backgroundColor: iconColors.marathon + '25' }]}>
                  <Icon name="run-fast" size={28} color={iconColors.marathon} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.planHeaderTitle, { color: colors.textPrimary }]}>Marathon Training</Text>
                  <Text style={[styles.planHeaderSubtitle, { color: colors.textSecondary }]}>
                    {activeMarathonPlan.schedule.filter(d => d.completed).length} / {activeMarathonPlan.schedule.length} days completed
                  </Text>
                </View>
              </View>
              
              {activeMarathonPlan.schedule.map((day, index) => {
                const isRestDay = day.run_type.toLowerCase().includes('rest');
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.checklistItem, { borderColor: colors.border }]}
                    onPress={() => handleMarathonDayToggle(index, day.completed)}
                  >
                    <View style={[styles.checkbox, { borderColor: day.completed ? iconColors.marathon : colors.border, backgroundColor: day.completed ? iconColors.marathon : 'transparent' }]}>
                      {day.completed && <Icon name="check" size={16} color="#FFF" />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.checklistItemText, { color: colors.textPrimary, textDecorationLine: day.completed ? 'line-through' : 'none' }]}>
                        {day.day} - {day.run_type}
                      </Text>
                      {!isRestDay && (
                        <Text style={[styles.checklistItemSubtext, { color: colors.textSecondary }]}>
                          {day.distance_km} km
                        </Text>
                      )}
                    </View>
                    {!isRestDay && (
                      <Text style={[styles.checklistCalories, { color: iconColors.distance }]}>
                        {day.distance_km} km
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
          
          {/* Generate New Plans Buttons */}
          {!activeWorkoutPlan && (
            <TouchableOpacity
              style={[styles.aiPlanButton, { 
                backgroundColor: isDark ? iconColors.workout + '20' : iconColors.workout + '15', 
                borderColor: iconColors.workout 
              }]}
              onPress={() => navigation.navigate('WorkoutPlan')}
            >
              <View style={[styles.iconCircle, { backgroundColor: iconColors.workout + '25' }]}>
                <Icon name="dumbbell" size={32} color={iconColors.workout} />
              </View>
              <View style={styles.aiPlanContent}>
                <Text style={[styles.aiPlanTitle, { color: colors.textPrimary }]}>Get Workout Plan</Text>
                <Text style={[styles.aiPlanSubtitle, { color: colors.textSecondary }]}>Personalized exercise routine</Text>
              </View>
              <Icon name="arrow-right" size={24} color={iconColors.workout} />
            </TouchableOpacity>
          )}

          {!activeMarathonPlan && (
            <TouchableOpacity
              style={[styles.aiPlanButton, { 
                backgroundColor: isDark ? iconColors.marathon + '20' : iconColors.marathon + '15', 
                borderColor: iconColors.marathon 
              }]}
              onPress={() => navigation.navigate('MarathonPlan')}
            >
              <View style={[styles.iconCircle, { backgroundColor: iconColors.marathon + '25' }]}>
                <Icon name="run-fast" size={32} color={iconColors.marathon} />
              </View>
              <View style={styles.aiPlanContent}>
                <Text style={[styles.aiPlanTitle, { color: colors.textPrimary }]}>Get Marathon Plan</Text>
                <Text style={[styles.aiPlanSubtitle, { color: colors.textSecondary }]}>Race preparation training</Text>
              </View>
              <Icon name="arrow-right" size={24} color={iconColors.marathon} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Add Activity Modal */}
      <Modal visible={showAddActivity} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#182E3D' : '#A3B8C8' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Log Activity</Text>
              <TouchableOpacity onPress={() => setShowAddActivity(false)}>
                <Icon name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalText, { color: colors.textSecondary }]}>
              Select an activity type and enter details to log your workout manually.
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.accent }]}
              onPress={() => {
                setShowAddActivity(false);
                Alert.alert('Success', 'Activity logged successfully!');
              }}
            >
              <Text style={styles.modalButtonText}>Log Activity</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Feedback Modal */}
      <Modal visible={showFeedbackModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#182E3D' : '#E8F0EE' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {feedbackType === 'workout' ? 'Workout Complete!' : 'Week Complete!'}
              </Text>
              <TouchableOpacity onPress={() => setShowFeedbackModal(false)}>
                <Icon name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.modalText, { color: colors.textSecondary, marginBottom: 20 }]}>
              How was it? Your feedback helps us create better plans for you.
            </Text>
            
            <Text style={[styles.feedbackLabel, { color: colors.textPrimary }]}>How difficult was it?</Text>
            <View style={styles.feedbackOptions}>
              {[
                { value: 'easy', label: 'Easy', icon: 'emoticon-happy' },
                { value: 'just_right', label: 'Just Right', icon: 'emoticon' },
                { value: 'difficult', label: 'Difficult', icon: 'emoticon-sad' }
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.feedbackOption,
                    {
                      backgroundColor: feedbackDifficulty === option.value ? colors.accent : colors.cardGlass,
                      borderColor: feedbackDifficulty === option.value ? colors.accent : colors.border
                    }
                  ]}
                  onPress={() => setFeedbackDifficulty(option.value)}
                >
                  <Icon name={option.icon} size={32} color={feedbackDifficulty === option.value ? '#FFF' : colors.textSecondary} />
                  <Text style={[styles.feedbackOptionText, { color: feedbackDifficulty === option.value ? '#FFF' : colors.textPrimary }]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={[styles.feedbackLabel, { color: colors.textPrimary, marginTop: 20 }]}>What would you like next time?</Text>
            <View style={styles.feedbackOptions}>
              {[
                { value: 'easier', label: 'Easier' },
                { value: 'same', label: 'Same Level' },
                { value: 'harder', label: 'Harder' }
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.feedbackOption,
                    {
                      backgroundColor: feedbackPreference === option.value ? colors.accent : colors.cardGlass,
                      borderColor: feedbackPreference === option.value ? colors.accent : colors.border
                    }
                  ]}
                  onPress={() => setFeedbackPreference(option.value)}
                >
                  <Text style={[styles.feedbackOptionText, { color: feedbackPreference === option.value ? '#FFF' : colors.textPrimary }]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.accent, marginTop: 24 }]}
              onPress={handleSubmitFeedback}
            >
              <Text style={styles.modalButtonText}>Submit Feedback</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 100 },
  sectionTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  filterContainerInCard: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  filterButtonSmall: { flex: 1, paddingVertical: 8, borderRadius: 16, alignItems: 'center', borderWidth: 2 },
  filterTextSmall: { fontSize: 13, fontWeight: '600' },
  circleCard: { 
    padding: 24, 
    borderRadius: 20, 
    marginBottom: 20, 
    borderWidth: 1, 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  cardSubtitle: { fontSize: 14, marginBottom: 16 },
  circleContainer: { marginBottom: 20 },
  progressCircle: { width: 180, height: 180, borderRadius: 90, borderWidth: 12, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  stepsValue: { fontSize: 48, fontWeight: 'bold' },
  stepsGoal: { fontSize: 14, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 24 },
  statItem: { alignItems: 'center', gap: 6 },
  iconCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue: { fontSize: 14, fontWeight: '600' },
  card: { 
    padding: 24, 
    borderRadius: 20, 
    marginBottom: 20, 
    borderWidth: 1,
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  chartHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  timePeriodLabel: { fontSize: 13, fontWeight: '600' },
  yAxisLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  xAxisLabel: { fontSize: 12, fontWeight: '600', marginTop: 8, textAlign: 'center' },
  categoriesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  addButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, gap: 6 },
  addButtonText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  categoryCard: { 
    width: (width - 56) / 2, 
    padding: 16, 
    borderRadius: 16, 
    borderWidth: 2, 
    alignItems: 'center', 
    minHeight: 160,
  },
  categoryIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  categoryName: { fontSize: 15, fontWeight: 'bold', marginBottom: 6 },
  categoryCalories: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  categoryDuration: { fontSize: 12 },
  progressItem: { marginBottom: 20 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 14, fontWeight: '600' },
  progressValue: { fontSize: 14, fontWeight: 'bold' },
  progressBarBg: { height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 6 },
  progressBarFill: { height: '100%', borderRadius: 6 },
  progressRemaining: { fontSize: 12 },
  aiPlanButton: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 20, borderWidth: 2, gap: 16, marginBottom: 16 },
  aiPlanIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  aiPlanContent: { flex: 1 },
  aiPlanTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  aiPlanSubtitle: { fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24 },
  noDataBox: { 
    padding: 24, 
    borderRadius: 16, 
    borderWidth: 1, 
    alignItems: 'center', 
    gap: 12,
    marginTop: 16,
  },
  noDataText: { 
    fontSize: 16, 
    fontWeight: '600', 
    textAlign: 'center' 
  },
  noDataSubtext: { 
    fontSize: 13, 
    textAlign: 'center' 
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  modalText: { fontSize: 14, marginBottom: 20, lineHeight: 20 },
  modalButton: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  modalButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  circleContainer: { alignItems: 'center', marginBottom: 24 },
  progressCircle: { width: 180, height: 180, borderRadius: 90, borderWidth: 12, justifyContent: 'center', alignItems: 'center' },
  stepsValue: { fontSize: 48, fontWeight: 'bold' },
  stepsGoal: { fontSize: 14, marginTop: 4 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  statItem: { alignItems: 'center', gap: 8 },
  statLabel: { fontSize: 12, fontWeight: '600' },
  statValue: { fontSize: 16, fontWeight: 'bold' },
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  planHeaderTitle: { fontSize: 18, fontWeight: 'bold' },
  planHeaderSubtitle: { fontSize: 13, marginTop: 4 },
  checklistItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  workoutTypeIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  checklistItemText: { fontSize: 15, fontWeight: '600' },
  checklistItemSubtext: { fontSize: 13, marginTop: 2 },
  checklistCalories: { fontSize: 13, fontWeight: '600' },
  dayHeaderText: { fontSize: 16, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  restDayBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, marginBottom: 8 },
  restDayText: { fontSize: 14, fontWeight: '600' },
  feedbackLabel: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  feedbackOptions: { flexDirection: 'row', gap: 12 },
  feedbackOption: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 2, alignItems: 'center', gap: 8 },
  feedbackOptionText: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
});

export default ActivityTab;
