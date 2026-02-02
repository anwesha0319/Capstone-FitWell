import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Dimensions, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LineChart } from 'react-native-chart-kit';
import { useTheme } from '../../../context/ThemeContext';
import { saveHealthData, saveWeightGoal, getWeightGoal, saveTodayWeight, getTodayData } from '../../../utils/storage';
import { getHealthData as apiGetHealthData } from '../../../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const BodyMetricsTab = () => {
  const { colors, isDark } = useTheme();
  const [isEditingWeight, setIsEditingWeight] = useState(false);
  const [isEditingHeight, setIsEditingHeight] = useState(false);
  const [currentWeight, setCurrentWeight] = useState('75');
  const [goalWeight, setGoalWeight] = useState('70');
  const [height, setHeight] = useState('175');
  const [timeFilter, setTimeFilter] = useState('6M');
  const [user, setUser] = useState(null);
  const [weightHistory, setWeightHistory] = useState([]);
  const [historyError, setHistoryError] = useState(null);
  
  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    // Load from user profile first
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setCurrentWeight(parsedUser.weight?.toString() || '75');
        setHeight(parsedUser.height?.toString() || '175');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
    
    // Then load goals
    const goal = await getWeightGoal();
    setGoalWeight(goal);

    // Try fetch remote weight history (best-effort)
    try {
      const result = await apiGetHealthData(180); // try last 6 months-ish
      if (result && Array.isArray(result) && result.length > 0) {
        const mapped = result
          .filter(r => r.weight !== undefined)
          .map(r => ({ month: r.date ? new Date(r.date).toLocaleDateString('en-US',{month:'short'}) : '', weight: r.weight }));
        if (mapped.length > 0) setWeightHistory(mapped);
      }
    } catch (err) {
      console.warn('Failed to fetch remote weight history', err?.message || err);
      setHistoryError(err);
    }
  };

  // Generate weight data based on time filter
  const getWeightData = () => {
    switch (timeFilter) {
      case '1M':
        return [
          { month: 'Week 1', weight: 76.2 },
          { month: 'Week 2', weight: 75.8 },
          { month: 'Week 3', weight: 75.4 },
          { month: 'Week 4', weight: 75.0 }
        ];
      case '3M':
        return [
          { month: 'Month 1', weight: 77.0 },
          { month: 'Month 2', weight: 76.0 },
          { month: 'Month 3', weight: 75.0 }
        ];
      case '6M':
        return [
          { month: 'Jan', weight: 78.5 },
          { month: 'Feb', weight: 77.8 },
          { month: 'Mar', weight: 76.9 },
          { month: 'Apr', weight: 76.2 },
          { month: 'May', weight: 75.6 },
          { month: 'Jun', weight: 75.0 }
        ];
      case '1Y':
        return [
          { month: 'Jan', weight: 82.0 },
          { month: 'Mar', weight: 80.5 },
          { month: 'May', weight: 78.5 },
          { month: 'Jul', weight: 77.0 },
          { month: 'Sep', weight: 76.0 },
          { month: 'Nov', weight: 75.0 }
        ];
      case 'All':
        return [
          { month: '2023', weight: 85.0 },
          { month: '2024', weight: 80.0 },
          { month: '2025', weight: 77.0 },
          { month: '2026', weight: 75.0 }
        ];
      default:
        return [
          { month: 'Jan', weight: 78.5 },
          { month: 'Feb', weight: 77.8 },
          { month: 'Mar', weight: 76.9 },
          { month: 'Apr', weight: 76.2 },
          { month: 'May', weight: 75.6 },
          { month: 'Jun', weight: 75.0 }
        ];
    }
  };

  const weightData = weightHistory && weightHistory.length > 0 ? weightHistory : [];

  const handleSaveWeight = async () => {
    await saveHealthData({ weight: currentWeight });
    await saveWeightGoal(goalWeight);
    await saveTodayWeight(parseFloat(currentWeight));
    
    // Update user profile in AsyncStorage
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        parsedUser.weight = parseFloat(currentWeight);
        await AsyncStorage.setItem('user', JSON.stringify(parsedUser));
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
    }
    
    setIsEditingWeight(false);
    Alert.alert('Success', 'Weight goals saved!');
  };

  const handleSaveHeight = async () => {
    await saveHealthData({ height });
    
    // Update user profile in AsyncStorage
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        parsedUser.height = parseFloat(height);
        await AsyncStorage.setItem('user', JSON.stringify(parsedUser));
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
    }
    
    setIsEditingHeight(false);
    Alert.alert('Success', 'Height saved!');
  };

  const calculateBMI = () => {
    const h = parseFloat(height) / 100;
    const w = parseFloat(currentWeight);
    return h && w ? (w / (h * h)).toFixed(1) : '0';
  };

  const getBMICategory = (bmi) => {
    if (bmi < 18.5) return { text: 'Underweight', color: '#9B59B6' };
    if (bmi < 25) return { text: 'Normal', color: '#66BB6A' };
    if (bmi < 30) return { text: 'Overweight', color: '#FFA726' };
    return { text: 'Obese', color: '#EF5350' };
  };

  const bmi = calculateBMI();
  const bmiCategory = getBMICategory(parseFloat(bmi));
  const weightChange = weightData.length >= 2 ? (weightData[0].weight - weightData[weightData.length - 1].weight).toFixed(1) : 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Body Metrics</Text>
      {historyError && (
        <View style={{ paddingHorizontal: 6, marginBottom: 12 }}>
          <Text style={{ color: colors.error, fontSize: 13 }}>* Unable to load weight history (Network Error). Using local data or placeholders.</Text>
        </View>
      )}

      {/* Weight Section */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Weight</Text>
          <TouchableOpacity onPress={() => (isEditingWeight ? handleSaveWeight() : setIsEditingWeight(true))} style={[styles.editBtn, { backgroundColor: isEditingWeight ? colors.success : colors.accent }]}>
            <Icon name={isEditingWeight ? 'content-save' : 'pencil'} size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.weightRow}>
          <View style={styles.weightItem}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Current Weight</Text>
            {isEditingWeight ? (
              <TextInput style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]} value={currentWeight} onChangeText={setCurrentWeight} keyboardType="numeric" />
            ) : (
              <Text style={[styles.value, { color: colors.textPrimary }]}>{currentWeight} kg</Text>
            )}
          </View>
          <View style={styles.weightItem}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Goal Weight</Text>
            {isEditingWeight ? (
              <TextInput style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]} value={goalWeight} onChangeText={setGoalWeight} keyboardType="numeric" />
            ) : (
              <Text style={[styles.value, { color: colors.textPrimary }]}>{goalWeight} kg</Text>
            )}
          </View>
        </View>
      </View>

      {/* Weight Chart */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Weight Progress</Text>
        <View style={styles.filterRow}>
          {['1M', '3M', '6M', '1Y', 'All'].map(f => (
            <TouchableOpacity key={f} onPress={() => setTimeFilter(f)} style={[styles.filterBtn, { backgroundColor: timeFilter === f ? colors.accent : colors.cardGlass }]}>
              <Text style={[styles.filterText, { color: timeFilter === f ? '#FFF' : colors.textSecondary }]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Y-axis label */}
        <Text style={[styles.yAxisLabel, { color: colors.textSecondary }]}>Weight (kg)</Text>
        
        {weightData && weightData.length > 0 ? (
        <LineChart
          data={{
            labels: weightData.map(d => d.month),
            datasets: [{ data: weightData.map(d => d.weight) }]
          }}
          width={width - 80}
          height={220}
          chartConfig={{
            backgroundColor: 'transparent',
            backgroundGradientFrom: colors.card,
            backgroundGradientTo: colors.card,
            decimalPlaces: 1,
            color: (opacity = 1) => isDark ? `rgba(61, 214, 198, ${opacity})` : `rgba(47, 79, 74, ${opacity})`,
            labelColor: () => isDark ? '#E6F1EF' : '#1E2A28',
            style: { borderRadius: 16 },
            propsForDots: { r: '6', strokeWidth: '2', stroke: colors.accent },
            propsForBackgroundLines: {
              strokeDasharray: '',
              stroke: isDark ? 'rgba(230, 241, 239, 0.1)' : 'rgba(30, 42, 40, 0.1)',
            }
          }}
          bezier
          style={{ marginVertical: 8, borderRadius: 16 }}
        />
        ) : (
          <View style={{ paddingVertical: 24 }}>
            <Text style={{ color: colors.textTertiary }}>No weight history available. Enter your weight or connect Health Connect to populate history.</Text>
          </View>
        )}
        <View style={[styles.insightBox, { backgroundColor: colors.cardGlass }]}>
          {weightData && weightData.length > 1 ? (
            <>
              <Icon name={weightChange > 0 ? 'trending-down' : 'trending-up'} size={20} color={weightChange > 0 ? colors.success : colors.error} />
              <Text style={[styles.insightText, { color: colors.textPrimary }]}>
                {weightChange > 0 ? `You lost ${weightChange} kg` : `Weight changed by ${Math.abs(weightChange)} kg`} in the selected period
              </Text>
            </>
          ) : (
            <Text style={[styles.insightText, { color: colors.textTertiary }]}>No sufficient history to show insights. Log your weight or connect Health Connect.</Text>
          )}
        </View>
      </View>

      {/* Height & BMI Section */}
      <View style={styles.row}>
        <View style={[styles.halfCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Height</Text>
            <TouchableOpacity onPress={() => (isEditingHeight ? handleSaveHeight() : setIsEditingHeight(true))} style={[styles.editBtnSmall, { backgroundColor: isEditingHeight ? colors.success : colors.accent }]}>
              <Icon name={isEditingHeight ? 'content-save' : 'pencil'} size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.heightViz}>
            <Icon name="human-male-height" size={80} color={colors.accent} />
            {isEditingHeight ? (
              <TextInput style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, marginTop: 10 }]} value={height} onChangeText={setHeight} keyboardType="numeric" placeholder="cm" />
            ) : (
              <Text style={[styles.heightText, { color: colors.textPrimary }]}>{height} cm</Text>
            )}
          </View>
        </View>

        <View style={[styles.halfCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>BMI</Text>
          <View style={styles.bmiGauge}>
            <View style={styles.gaugeContainer}>
              <View style={[styles.gaugeSegment, { backgroundColor: '#9B59B6', width: '25%' }]} />
              <View style={[styles.gaugeSegment, { backgroundColor: '#66BB6A', width: '25%' }]} />
              <View style={[styles.gaugeSegment, { backgroundColor: '#FFA726', width: '25%' }]} />
              <View style={[styles.gaugeSegment, { backgroundColor: '#EF5350', width: '25%' }]} />
            </View>
            <Text style={[styles.bmiValue, { color: colors.textPrimary }]}>{bmi}</Text>
            <Text style={[styles.bmiCategory, { color: bmiCategory.color }]}>{bmiCategory.text}</Text>
          </View>
        </View>
      </View>

      {/* Statistics */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Statistics</Text>
        {weightData && weightData.length > 0 ? (
          <>
            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Initial weight:</Text>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{weightData[0].weight} kg</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Current weight:</Text>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{currentWeight} kg</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Goal weight:</Text>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{goalWeight} kg</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Weight lost:</Text>
              <Text style={[styles.statValue, { color: colors.success }]}>{weightChange} kg</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Remaining:</Text>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{(parseFloat(currentWeight) - parseFloat(goalWeight)).toFixed(1)} kg</Text>
            </View>
          </>
        ) : (
          <View style={{ paddingVertical: 16 }}>
            <Text style={[styles.statLabel, { color: colors.textTertiary, textAlign: 'center' }]}>
              No weight history available yet. Enter your weight above to start tracking.
            </Text>
          </View>
        )}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 100 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  editBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  editBtnSmall: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  card: { 
    padding: 24, 
    borderRadius: 20, 
    marginBottom: 20, 
    borderWidth: 1,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: 'bold' },
  weightRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  weightItem: { flex: 1 },
  label: { fontSize: 13, marginBottom: 8, fontWeight: '600' },
  value: { fontSize: 28, fontWeight: 'bold' },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, fontSize: 18, fontWeight: 'bold' },
  setGoalBtn: { paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  filterText: { fontSize: 13, fontWeight: '600' },
  yAxisLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  insightBox: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, gap: 8, marginTop: 8 },
  insightText: { fontSize: 14, flex: 1 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  halfCard: { 
    flex: 1, 
    padding: 24, 
    borderRadius: 20, 
    borderWidth: 1,
  },
  heightViz: { alignItems: 'center', marginTop: 16 },
  heightText: { fontSize: 24, fontWeight: 'bold', marginTop: 12 },
  bmiGauge: { alignItems: 'center', marginTop: 16 },
  gaugeContainer: { flexDirection: 'row', width: '100%', height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 16 },
  gaugeSegment: { height: '100%' },
  bmiValue: { fontSize: 48, fontWeight: 'bold', marginBottom: 8 },
  bmiCategory: { fontSize: 16, fontWeight: '600' },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  statLabel: { fontSize: 14 },
  statValue: { fontSize: 14, fontWeight: '600' },
});

export default BodyMetricsTab;
