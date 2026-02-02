import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Modal, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LineChart } from 'react-native-chart-kit';
import { useTheme } from '../../../context/ThemeContext';
import { getTodayData, getGoals } from '../../../utils/storage';
import { getHealthData } from '../../../api/client';

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
    } catch (error) {
      console.error('ActivityTab - getHealthData error', error?.message || error);
      setDataError(error);
      setWeeklyData([]);
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
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{distance} km</Text>
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

      {/* AI Training Plans */}
      {navigation && (
        <View>
          <Text style={[styles.cardTitle, { color: colors.textPrimary, marginBottom: 16 }]}>AI Training Plans</Text>
          
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
});

export default ActivityTab;
