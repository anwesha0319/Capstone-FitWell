import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../context/ThemeContext';
import { saveGoals, getGoals, saveTodaySleep, getTodayData } from '../../../utils/storage';
import { getHealthData as apiGetHealthData } from '../../../api/client';

const SleepTab = () => {
  const { colors } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [sleepGoal, setSleepGoal] = useState('8');
  const [bedtime, setBedtime] = useState('22:00');
  const [timeFilter, setTimeFilter] = useState('Week');
  const [weeklyData, setWeeklyData] = useState([]);
  const [todaySleep, setTodaySleep] = useState(null);
  const [dataError, setDataError] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const goals = await getGoals();
    const todayData = await getTodayData();
    setSleepGoal(goals.sleepGoal || '8');
    setBedtime(goals.bedtime || '22:00');

    try {
      const result = await apiGetHealthData(7);
      if (result && Array.isArray(result) && result.length > 0) {
        const mapped = result.map(r => ({ day: r.date ? new Date(r.date).toLocaleDateString('en-US',{weekday:'short'}) : '', deep: r.sleep_deep || 0, light: r.sleep_light || 0, rem: r.sleep_rem || 0, awake: r.sleep_awake || 0 }));
        setWeeklyData(mapped);
        const today = result[0];
        setTodaySleep({ total: today.total_sleep || null, deep: today.sleep_deep || null, light: today.sleep_light || null, rem: today.sleep_rem || null, bedtime: today.bedtime || null, wake: today.wake_time || null });
      } else {
        setWeeklyData([]);
      }
    } catch (err) {
      console.warn('SleepTab - getHealthData error', err?.message || err);
      setDataError(err);
      setWeeklyData([]);
    }
  };

  const handleSave = async () => {
    await saveGoals({ sleepGoal, bedtime });
    // Also save today's sleep hours (convert from goal to actual)
    await saveTodaySleep(parseFloat(sleepGoal));
    setIsEditing(false);
  };

  // Generate sleep data based on time filter
  const getSleepData = () => {
    switch (timeFilter) {
      case 'Week':
        return [
          { day: 'S', deep: 1.2, light: 5.8, rem: 0.8, awake: 0.2 },
          { day: 'M', deep: 1.5, light: 6.2, rem: 1.0, awake: 0.3 },
          { day: 'T', deep: 1.0, light: 5.5, rem: 0.9, awake: 0.4 },
          { day: 'W', deep: 1.3, light: 6.0, rem: 0.7, awake: 0.2 },
          { day: 'T', deep: 1.4, light: 5.9, rem: 1.1, awake: 0.3 },
          { day: 'F', deep: 0.9, light: 5.3, rem: 0.8, awake: 0.5 },
          { day: 'S', deep: 1.2, light: 6.3, rem: 0.9, awake: 0.2 },
        ];
      case 'Month':
        return [
          { day: 'W1', deep: 1.3, light: 5.9, rem: 0.9, awake: 0.3 },
          { day: 'W2', deep: 1.2, light: 6.1, rem: 0.8, awake: 0.2 },
          { day: 'W3', deep: 1.4, light: 5.8, rem: 1.0, awake: 0.3 },
          { day: 'W4', deep: 1.1, light: 6.0, rem: 0.9, awake: 0.4 },
        ];
      case 'Year':
        return [
          { day: 'Jan', deep: 1.2, light: 5.8, rem: 0.9, awake: 0.3 },
          { day: 'Mar', deep: 1.3, light: 6.0, rem: 0.8, awake: 0.2 },
          { day: 'May', deep: 1.4, light: 6.2, rem: 1.0, awake: 0.3 },
          { day: 'Jul', deep: 1.1, light: 5.7, rem: 0.9, awake: 0.4 },
          { day: 'Sep', deep: 1.3, light: 6.1, rem: 0.8, awake: 0.2 },
          { day: 'Nov', deep: 1.2, light: 5.9, rem: 0.9, awake: 0.3 },
        ];
      default:
        return [
          { day: 'S', deep: 1.2, light: 5.8, rem: 0.8, awake: 0.2 },
          { day: 'M', deep: 1.5, light: 6.2, rem: 1.0, awake: 0.3 },
          { day: 'T', deep: 1.0, light: 5.5, rem: 0.9, awake: 0.4 },
          { day: 'W', deep: 1.3, light: 6.0, rem: 0.7, awake: 0.2 },
          { day: 'T', deep: 1.4, light: 5.9, rem: 1.1, awake: 0.3 },
          { day: 'F', deep: 0.9, light: 5.3, rem: 0.8, awake: 0.5 },
          { day: 'S', deep: 1.2, light: 6.3, rem: 0.9, awake: 0.2 },
        ];
    }
  };

  // prefer fetched weeklyData when available
  const computedWeekly = weeklyData && weeklyData.length > 0 ? weeklyData : getSleepData();

  // Today's sleep data (from fetched record if present)
  const totalSleep = todaySleep?.total ? `${todaySleep.total}` : '0h 0m';
  const deepSleep = todaySleep?.deep ? `${todaySleep.deep}h` : '0h';
  const lightSleep = todaySleep?.light ? `${todaySleep.light}h` : '0h';
  const sleepQuality = todaySleep ? 'Measured' : 'No data';
  const bedtimeToday = todaySleep?.bedtime || '--:--';
  const wakeTime = todaySleep?.wake || '--:--';

  const sleepStages = [
    { stage: 'Deep sleep', hours: deepSleep, color: '#9C27B0', icon: 'sleep' },
    { stage: 'Light sleep', hours: lightSleep, color: '#CE93D8', icon: 'weather-night' },
    { stage: 'REM phase', hours: '48min', color: '#7C4DFF', icon: 'eye' },
    { stage: 'Awake', hours: '12min', color: '#B0BEC5', icon: 'eye-outline' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Sleep Statistics</Text>
      {dataError && (
        <View style={{ paddingHorizontal: 6, marginBottom: 12 }}>
          <Text style={{ color: colors.error, fontSize: 13 }}>* Unable to load sleep data (Network Error). Showing defaults.</Text>
        </View>
      )}

      {/* Daily Sleep Goal Container */}
      <View style={[styles.goalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.goalHeader}>
          <View>
            <Text style={[styles.goalLabel, { color: colors.textSecondary }]}>Daily Sleep Goal</Text>
            <Text style={[styles.goalValue, { color: colors.textPrimary }]}>{sleepGoal} hours</Text>
          </View>
          <TouchableOpacity onPress={() => (isEditing ? handleSave() : setIsEditing(true))} style={[styles.editBtn, { backgroundColor: isEditing ? colors.success : colors.accent }]}>
            <Icon name={isEditing ? 'content-save' : 'pencil'} size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
        {isEditing && (
          <View style={styles.editSection}>
            <Text style={[styles.editLabel, { color: colors.textSecondary }]}>Adjust your sleep goal (hours)</Text>
            <View style={styles.goalAdjust}>
              <TouchableOpacity onPress={() => setSleepGoal(String(Math.max(4, parseInt(sleepGoal) - 1)))} style={[styles.adjustBtn, { backgroundColor: colors.cardGlass }]}>
                <Icon name="minus" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={[styles.adjustValue, { color: colors.textPrimary }]}>{sleepGoal}h</Text>
              <TouchableOpacity onPress={() => setSleepGoal(String(Math.min(12, parseInt(sleepGoal) + 1)))} style={[styles.adjustBtn, { backgroundColor: colors.cardGlass }]}>
                <Icon name="plus" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Sleep Quality Card */}
      <View style={[styles.qualityCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.qualityHeader}>
          <Icon name="star-four-points" size={24} color="#FFD700" />
          <Text style={[styles.qualityText, { color: colors.textPrimary }]}>{sleepQuality}</Text>
        </View>
        <Text style={[styles.qualitySubtext, { color: colors.textSecondary }]}>sleep quality</Text>

        <View style={styles.sleepStagesRow}>
          <View style={styles.stageBox}>
            <View style={[styles.stageIndicator, { backgroundColor: '#9C27B0' }]} />
            <Text style={[styles.stageLabel, { color: colors.textSecondary }]}>Deep sleep</Text>
            <Text style={[styles.stageValue, { color: colors.textPrimary }]}>{deepSleep}</Text>
          </View>
          <View style={styles.stageBox}>
            <View style={[styles.stageIndicator, { backgroundColor: '#CE93D8' }]} />
            <Text style={[styles.stageLabel, { color: colors.textSecondary }]}>Light sleep</Text>
            <Text style={[styles.stageValue, { color: colors.textPrimary }]}>{lightSleep}</Text>
          </View>
        </View>

        {/* Circular Progress */}
        <View style={styles.circleContainer}>
          <View style={[styles.sleepCircle, { borderColor: '#9C27B0' }]}>
            <View style={[styles.bedtimeIndicator, { backgroundColor: '#9C27B0' }]}>
              <Icon name="weather-night" size={16} color="#FFF" />
              <Text style={styles.bedtimeText}>{bedtimeToday}</Text>
            </View>
            <Text style={[styles.totalSleep, { color: colors.textPrimary }]}>{totalSleep}</Text>
            <Text style={[styles.sleepLabel, { color: colors.textSecondary }]}>of sleeping</Text>
            <View style={[styles.wakeIndicator, { backgroundColor: '#FFA726' }]}>
              <Icon name="white-balance-sunny" size={16} color="#FFF" />
              <Text style={styles.wakeText}>{wakeTime}</Text>
            </View>
          </View>
        </View>

        {/* Tip Card */}
        <View style={[styles.tipCard, { backgroundColor: '#9C27B0' + '20' }]}>
          <View style={styles.tipIcon}>
            <Icon name="lightbulb-on" size={32} color="#9C27B0" />
          </View>
          <View style={styles.tipContent}>
            <Text style={[styles.tipTitle, { color: colors.textPrimary }]}>Tip for Healthy Sleep</Text>
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>
              Try to go to bed and wake up at the same time, regardless of the day of the week.
            </Text>
          </View>
        </View>
      </View>

      {/* Personal Insights */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.insightHeader}>
          <View style={[styles.iconCircle, { backgroundColor: colors.accent + '20' }]}>
            <Icon name="head-lightbulb" size={24} color={colors.accent} />
          </View>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Personal insights</Text>
        </View>
        <Text style={[styles.insightText, { color: colors.textSecondary }]}>
          Go to bed and wake up at the same time, the ability to study and work effectively depends on it.
        </Text>
      </View>

      {/* Weekly Sleep Chart */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.chartHeaderRow}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Sleep Pattern</Text>
          <Text style={[styles.timePeriodLabel, { color: colors.textSecondary }]}>
            {timeFilter === 'Week' ? 'This Week' : timeFilter === 'Month' ? 'This Month' : 'This Year'}
          </Text>
        </View>
        
        {/* Time Filter - Moved here above the chart */}
        <View style={styles.filterContainerInCard}>
          {['Week', 'Month', 'Year'].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                {
                  backgroundColor: timeFilter === filter ? '#9C27B0' : colors.cardGlass,
                  borderColor: timeFilter === filter ? '#9C27B0' : colors.border,
                },
              ]}
              onPress={() => setTimeFilter(filter)}
            >
              <Text style={[styles.filterText, { color: timeFilter === filter ? '#FFF' : colors.textSecondary }]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Y-axis label */}
        <Text style={[styles.yAxisLabel, { color: colors.textSecondary }]}>Hours</Text>

        {computedWeekly && computedWeekly.length > 0 && computedWeekly.some(d => d.deep > 0 || d.light > 0 || d.rem > 0) ? (
          <View style={styles.chartWrapper}>
            <View style={styles.timeLabels}>
              <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>9h</Text>
              <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>6h</Text>
              <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>3h</Text>
              <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>0h</Text>
            </View>
            <View style={styles.chartContainer}>
              {computedWeekly.map((day, index) => (
                <View key={index} style={styles.barContainer}>
                  <View style={styles.barStack}>
                    <View style={[styles.barSegment, { height: `${(day.deep / 9) * 100}%`, backgroundColor: '#9C27B0' }]} />
                    <View style={[styles.barSegment, { height: `${(day.light / 9) * 100}%`, backgroundColor: '#CE93D8' }]} />
                    <View style={[styles.barSegment, { height: `${(day.rem / 9) * 100}%`, backgroundColor: '#7C4DFF' }]} />
                    <View style={[styles.barSegment, { height: `${(day.awake / 9) * 100}%`, backgroundColor: '#B0BEC5' }]} />
                  </View>
                  <Text style={[styles.dayLabel, { color: colors.textSecondary }]}>{day.day}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={[styles.noDataBox, { backgroundColor: colors.info + '10', borderColor: colors.info, marginTop: 16 }]}>
            <Icon name="chart-line-variant" size={48} color={colors.textTertiary} />
            <Text style={[styles.noDataText, { color: colors.textSecondary }]}>No sleep data available yet</Text>
            <Text style={[styles.noDataSubtext, { color: colors.textTertiary }]}>Connect Health Connect to sync your sleep data automatically</Text>
          </View>
        )}
      </View>

      {/* Sleep Stages Legend */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Sleep Stages</Text>
        <View style={styles.legendGrid}>
          {sleepStages.map((stage, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: stage.color }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>{stage.stage}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 100 },
  sectionTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  goalCard: { 
    padding: 24, 
    borderRadius: 20, 
    marginBottom: 20, 
    borderWidth: 1,
  },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  goalLabel: { fontSize: 14, marginBottom: 6 },
  goalValue: { fontSize: 24, fontWeight: 'bold' },
  editBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  editSection: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  editLabel: { fontSize: 13, marginBottom: 12 },
  goalAdjust: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
  adjustBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  adjustValue: { fontSize: 32, fontWeight: 'bold', minWidth: 80, textAlign: 'center' },
  filterContainerInCard: { flexDirection: 'row', gap: 10, marginTop: 16, marginBottom: 20 },
  filterButton: { flex: 1, paddingVertical: 8, borderRadius: 16, alignItems: 'center', borderWidth: 2 },
  filterText: { fontSize: 13, fontWeight: '600' },
  qualityCard: { 
    padding: 24, 
    borderRadius: 20, 
    marginBottom: 20, 
    borderWidth: 1, 
    alignItems: 'center',
  },
  qualityHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  qualityText: { fontSize: 32, fontWeight: 'bold' },
  qualitySubtext: { fontSize: 14, marginBottom: 24 },
  sleepStagesRow: { flexDirection: 'row', gap: 16, marginBottom: 24, width: '100%', justifyContent: 'center' },
  stageBox: { alignItems: 'center', padding: 16, backgroundColor: 'rgba(156, 39, 176, 0.1)', borderRadius: 12, minWidth: 120 },
  stageIndicator: { width: 40, height: 4, borderRadius: 2, marginBottom: 8 },
  stageLabel: { fontSize: 12, marginBottom: 4 },
  stageValue: { fontSize: 18, fontWeight: 'bold' },
  circleContainer: { marginBottom: 24 },
  sleepCircle: { width: 200, height: 200, borderRadius: 100, borderWidth: 12, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  bedtimeIndicator: { position: 'absolute', top: 10, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  bedtimeText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  totalSleep: { fontSize: 32, fontWeight: 'bold' },
  sleepLabel: { fontSize: 14 },
  wakeIndicator: { position: 'absolute', bottom: 10, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  wakeText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  tipCard: { flexDirection: 'row', padding: 16, borderRadius: 16, gap: 12, width: '100%' },
  tipIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(156, 39, 176, 0.2)', justifyContent: 'center', alignItems: 'center' },
  tipContent: { flex: 1 },
  tipTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  tipText: { fontSize: 13, lineHeight: 18 },
  card: { 
    padding: 24, 
    borderRadius: 20, 
    marginBottom: 20, 
    borderWidth: 1,
  },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 18, fontWeight: 'bold' },
  chartHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  timePeriodLabel: { fontSize: 13, fontWeight: '600' },
  yAxisLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  insightText: { fontSize: 14, lineHeight: 20 },
  chartWrapper: { flexDirection: 'row', alignItems: 'center' },
  chartContainer: { flexDirection: 'row', height: 140, alignItems: 'flex-end', justifyContent: 'space-around', flex: 1, paddingLeft: 10 },
  barContainer: { alignItems: 'center', flex: 1 },
  barStack: { width: 20, height: 120, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, overflow: 'hidden', justifyContent: 'flex-end' },
  barSegment: { width: '100%' },
  dayLabel: { fontSize: 11, marginTop: 6 },
  timeLabels: { height: 120, justifyContent: 'space-between', paddingRight: 8 },
  timeLabel: { fontSize: 10 },
  legendGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8, width: '45%' },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { fontSize: 13 },
  noDataBox: { 
    padding: 24, 
    borderRadius: 16, 
    borderWidth: 1, 
    alignItems: 'center', 
    gap: 12 
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
});

export default SleepTab;
