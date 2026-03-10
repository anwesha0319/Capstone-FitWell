import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'react-native-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { generateMarathonPlan } from '../../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MarathonPlanScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [marathonPlan, setMarathonPlan] = useState(null);
  const [showInputForm, setShowInputForm] = useState(false);
  
  // Form inputs
  const [formData, setFormData] = useState({
    age: '',
    avgSteps: '5000',
    spo2: '98',
    restingHeartRate: '70',
    sleepHours: '7',
    goalTimeHours: '4',
    marathonDate: '',
    experienceLevel: 'beginner',
    targetDistance: 'half_marathon'
  });

  useEffect(() => {
    loadUserProfile();
    setDefaultMarathonDate();
  }, []);

  const loadUserProfile = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const today = new Date();
        const birthDate = new Date(user.date_of_birth);
        const age = today.getFullYear() - birthDate.getFullYear();
        
        setFormData(prev => ({
          ...prev,
          age: age.toString()
        }));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const setDefaultMarathonDate = () => {
    const date = new Date();
    date.setMonth(date.getMonth() + 3); // 3 months from now
    const dateStr = date.toISOString().split('T')[0];
    setFormData(prev => ({ ...prev, marathonDate: dateStr }));
  };

  const handleGeneratePlan = async () => {
    // Validate inputs
    if (!formData.age || !formData.marathonDate) {
      Alert.alert('Missing Information', 'Please fill in your age and marathon date');
      return;
    }

    setLoading(true);
    setShowInputForm(false);
    
    try {
      const response = await generateMarathonPlan({
        experience_level: formData.experienceLevel,
        target_distance: formData.targetDistance,
        age: parseInt(formData.age),
        avg_steps: parseInt(formData.avgSteps),
        spo2: parseInt(formData.spo2),
        resting_heart_rate: parseInt(formData.restingHeartRate),
        sleep_hours: parseFloat(formData.sleepHours),
        goal_time_hours: parseFloat(formData.goalTimeHours),
        marathon_date: formData.marathonDate
      });
      
      if (response.success && response.marathon_plan) {
        setMarathonPlan(response.marathon_plan);
        Alert.alert(
          'Success',
          'Marathon training plan generated!',
          [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]
        );
        
        // Automatically navigate back after 2 seconds
        setTimeout(() => {
          navigation.goBack();
        }, 2000);
      } else {
        Alert.alert('Error', 'Failed to generate marathon plan');
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to generate marathon plan');
    } finally {
      setLoading(false);
    }
  };

  const InputField = ({ label, value, onChangeText, placeholder, keyboardType = 'default', info }) => (
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>{label}</Text>
      {info && <Text style={[styles.inputInfo, { color: colors.textTertiary }]}>{info}</Text>}
      <TextInput
        style={[styles.input, { backgroundColor: colors.cardGlass, color: colors.textPrimary, borderColor: colors.border }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        keyboardType={keyboardType}
      />
    </View>
  );

  const SelectField = ({ label, value, options, onSelect, info }) => (
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>{label}</Text>
      {info && <Text style={[styles.inputInfo, { color: colors.textTertiary }]}>{info}</Text>}
      <View style={styles.selectRow}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.selectOption,
              { 
                backgroundColor: value === option.value ? colors.accent : colors.cardGlass,
                borderColor: value === option.value ? colors.accent : colors.border
              }
            ]}
            onPress={() => onSelect(option.value)}
          >
            <Text style={[styles.selectOptionText, { color: value === option.value ? '#FFF' : colors.textPrimary }]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <LinearGradient
      colors={isDark ? [colors.backgroundStart, colors.backgroundMid, colors.backgroundEnd] : [colors.backgroundStart, colors.backgroundMid, colors.backgroundEnd]}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.textPrimary }]}>AI Marathon Plan</Text>
        </View>

        {!marathonPlan ? (
          <View style={styles.emptyState}>
            <View style={[styles.iconCircle, { backgroundColor: colors.accent + '20' }]}>
              <Icon name="run-fast" size={64} color={colors.accent} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Get Your Marathon Training Plan</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              AI will generate a custom weekly training schedule based on your experience and health data
            </Text>
            
            <TouchableOpacity
              style={[styles.generateButton, { backgroundColor: colors.accent }]}
              onPress={() => setShowInputForm(true)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Icon name="sparkles" size={20} color="#FFF" />
                  <Text style={styles.generateButtonText}>Generate Plan</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Plan Summary */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.planTitle, { color: colors.textPrimary }]}>{marathonPlan.plan_title}</Text>
              
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <View style={[styles.summaryIcon, { backgroundColor: '#FF7043' + '20' }]}>
                    <Icon name="fire" size={24} color="#FF7043" />
                  </View>
                  <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{marathonPlan.estimated_weekly_calories}</Text>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Calories</Text>
                </View>

                <View style={styles.summaryItem}>
                  <View style={[styles.summaryIcon, { backgroundColor: '#42A5F5' + '20' }]}>
                    <Icon name="map-marker-distance" size={24} color="#42A5F5" />
                  </View>
                  <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{marathonPlan.weekly_mileage_km}</Text>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>KM/Week</Text>
                </View>

                <View style={styles.summaryItem}>
                  <View style={[styles.summaryIcon, { backgroundColor: '#66BB6A' + '20' }]}>
                    <Icon name="calendar-week" size={24} color="#66BB6A" />
                  </View>
                  <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{marathonPlan.workouts_per_week}</Text>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Workouts</Text>
                </View>
              </View>
            </View>

            {/* Weekly Schedule */}
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Weekly Schedule</Text>
            
            {marathonPlan.weekly_schedule.map((day, index) => {
              const isRestDay = day.run_type.toLowerCase().includes('rest');
              const dayColor = isRestDay ? '#9E9E9E' : '#AB47BC';
              
              return (
                <View key={index} style={[styles.dayCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.dayHeader}>
                    <View style={[styles.dayBadge, { backgroundColor: dayColor }]}>
                      <Text style={styles.dayBadgeText}>{day.day.substring(0, 3).toUpperCase()}</Text>
                    </View>
                    <View style={styles.dayInfo}>
                      <Text style={[styles.dayType, { color: colors.textPrimary }]}>{day.run_type}</Text>
                      {!isRestDay && (
                        <Text style={[styles.dayDistance, { color: colors.textSecondary }]}>{day.distance_km} km</Text>
                      )}
                    </View>
                    {!isRestDay && (
                      <View style={[styles.distanceBadge, { backgroundColor: '#42A5F5' + '20' }]}>
                        <Icon name="map-marker-distance" size={16} color="#42A5F5" />
                        <Text style={[styles.distanceText, { color: '#42A5F5' }]}>{day.distance_km} km</Text>
                      </View>
                    )}
                  </View>
                  {day.notes && (
                    <Text style={[styles.dayNotes, { color: colors.textSecondary }]}>{day.notes}</Text>
                  )}
                </View>
              );
            })}

            {/* Regenerate Button */}
            <TouchableOpacity
              style={[styles.regenerateButton, { backgroundColor: colors.cardGlass, borderColor: colors.border }]}
              onPress={() => setShowInputForm(true)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.accent} />
              ) : (
                <>
                  <Icon name="refresh" size={20} color={colors.accent} />
                  <Text style={[styles.regenerateButtonText, { color: colors.accent }]}>Generate New Plan</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Input Form Modal */}
      <Modal visible={showInputForm} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#182E3D' : '#E8F0EE' }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Marathon Training Details</Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                Provide your information for a personalized marathon training plan
              </Text>

              <InputField
                label="Age"
                value={formData.age}
                onChangeText={(text) => setFormData({...formData, age: text})}
                placeholder="25"
                keyboardType="numeric"
                info="From your profile"
              />

              <SelectField
                label="Experience Level"
                value={formData.experienceLevel}
                options={[
                  { label: 'Beginner', value: 'beginner' },
                  { label: 'Intermediate', value: 'intermediate' },
                  { label: 'Advanced', value: 'advanced' }
                ]}
                onSelect={(value) => setFormData({...formData, experienceLevel: value})}
              />

              <SelectField
                label="Target Distance"
                value={formData.targetDistance}
                options={[
                  { label: '10K', value: '10k' },
                  { label: 'Half Marathon', value: 'half_marathon' },
                  { label: 'Full Marathon', value: 'full_marathon' }
                ]}
                onSelect={(value) => setFormData({...formData, targetDistance: value})}
              />

              <InputField
                label="Marathon Date"
                value={formData.marathonDate}
                onChangeText={(text) => setFormData({...formData, marathonDate: text})}
                placeholder="2026-05-15"
                info="Format: YYYY-MM-DD"
              />

              <InputField
                label="Goal Time (hours)"
                value={formData.goalTimeHours}
                onChangeText={(text) => setFormData({...formData, goalTimeHours: text})}
                placeholder="4"
                keyboardType="numeric"
                info="Your target completion time"
              />

              <InputField
                label="Average Daily Steps"
                value={formData.avgSteps}
                onChangeText={(text) => setFormData({...formData, avgSteps: text})}
                placeholder="5000"
                keyboardType="numeric"
                info="Will be fetched from Health Connect (using default for now)"
              />

              <InputField
                label="Resting Heart Rate (BPM)"
                value={formData.restingHeartRate}
                onChangeText={(text) => setFormData({...formData, restingHeartRate: text})}
                placeholder="70"
                keyboardType="numeric"
                info="Will be fetched from Health Connect (using default for now)"
              />

              <InputField
                label="Average Sleep (hours)"
                value={formData.sleepHours}
                onChangeText={(text) => setFormData({...formData, sleepHours: text})}
                placeholder="7"
                keyboardType="numeric"
                info="Will be fetched from Health Connect (using default for now)"
              />

              <InputField
                label="SpO2 Level (%)"
                value={formData.spo2}
                onChangeText={(text) => setFormData({...formData, spo2: text})}
                placeholder="98"
                keyboardType="numeric"
                info="Will be fetched from Health Connect (using default for now)"
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.cardGlass, borderWidth: 1, borderColor: colors.border }]}
                  onPress={() => setShowInputForm(false)}
                >
                  <Text style={[styles.modalButtonText, { color: colors.textPrimary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.accent }]}
                  onPress={handleGeneratePlan}
                >
                  <Text style={[styles.modalButtonText, { color: '#FFF' }]}>Generate</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  content: { padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  backButton: { marginRight: 16 },
  title: { fontSize: 24, fontWeight: 'bold' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  iconCircle: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  emptyTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  emptySubtitle: { fontSize: 15, textAlign: 'center', marginBottom: 32, paddingHorizontal: 20, lineHeight: 22 },
  generateButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 25, gap: 10 },
  generateButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  card: { padding: 24, borderRadius: 20, marginBottom: 20, borderWidth: 1 },
  planTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center', gap: 8 },
  summaryIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  summaryValue: { fontSize: 24, fontWeight: 'bold' },
  summaryLabel: { fontSize: 13 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  dayCard: { padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1 },
  dayHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dayBadge: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  dayBadgeText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  dayInfo: { flex: 1 },
  dayType: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  dayDistance: { fontSize: 14 },
  distanceBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, gap: 4 },
  distanceText: { fontSize: 14, fontWeight: '600' },
  dayNotes: { fontSize: 13, marginTop: 12, fontStyle: 'italic', lineHeight: 18 },
  regenerateButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 16, borderWidth: 2, gap: 10, marginTop: 8 },
  regenerateButtonText: { fontSize: 16, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  modalSubtitle: { fontSize: 14, marginBottom: 24 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  inputInfo: { fontSize: 12, marginBottom: 8, fontStyle: 'italic' },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16 },
  selectRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  selectOption: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  selectOptionText: { fontSize: 14, fontWeight: '600' },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 20 },
  modalButton: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  modalButtonText: { fontSize: 16, fontWeight: 'bold' },
});

export default MarathonPlanScreen;
