import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'react-native-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import axios from 'axios';
import { generateDietPlan } from '../../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DietPlanScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [dietPlan, setDietPlan] = useState(null);
  const [allergies, setAllergies] = useState('');
  const [dietaryPreference, setDietaryPreference] = useState('none');
  const [goal, setGoal] = useState('maintain');
  const [duration, setDuration] = useState(7);
  const [showDietaryModal, setShowDietaryModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [userGoalLoaded, setUserGoalLoaded] = useState(false);
  const [activePlan, setActivePlan] = useState(null);
  const [showOverrideConfirm, setShowOverrideConfirm] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Load user's fitness goal on mount
  React.useEffect(() => {
    loadUserProfile();
    checkActivePlan();
  }, []);

  const loadUserProfile = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setUserProfile(user);
        setProfileLoaded(true);
        
        // Auto-fill from profile
        if (user.fitness_goal) {
          setGoal(user.fitness_goal);
        }
        if (user.dietary_preference) {
          setDietaryPreference(user.dietary_preference);
        }
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  };

  const checkActivePlan = async () => {
    try {
      const response = await axios.get('http://192.168.29.52:8000/api/ml/check-active-plan/', {
        headers: {
          Authorization: `Bearer ${await AsyncStorage.getItem('access_token')}`
        }
      });
      if (response.data.has_active_plan) {
        setActivePlan(response.data);
      }
    } catch (error) {
      console.log('No active plan or error checking:', error);
    }
  };

  const durationOptions = [
    { label: '1 Week', value: 7 },
    { label: '1 Month', value: 30 },
    { label: '3 Months', value: 90 },
    { label: '6 Months', value: 180 },
    { label: '1 Year', value: 365 }
  ];

  const goalOptions = [
    { key: 'lose_weight', label: 'Lose Weight' },
    { key: 'gain_muscle', label: 'Gain Muscle' },
    { key: 'maintain', label: 'Maintain Health' },
    { key: 'improve_endurance', label: 'Improve Endurance' },
  ];

  const dietaryOptions = [
    { key: 'none', label: 'None' },
    { key: 'vegetarian', label: 'Vegetarian' },
    { key: 'non_veg', label: 'Non-Veg' },
    { key: 'vegan', label: 'Vegan' },
    { key: 'pescatarian', label: 'Pescatarian' },
    { key: 'keto', label: 'Keto' },
    { key: 'paleo', label: 'Paleo' },
    { key: 'gluten_free', label: 'Gluten Free' },
    { key: 'dairy_free', label: 'Dairy Free' },
    { key: 'low_carb', label: 'Low Carb' },
    { key: 'mediterranean', label: 'Mediterranean' },
  ];

  const generatePlan = async (forceNew = false) => {
    setLoading(true);
    try {
      const payload = {
        allergies: allergies.split(',').map(a => a.trim()).filter(a => a).join(','),
        dietary_preference: dietaryPreference,
        activity: 'moderate',
        goal: goal,
        duration: duration,
        force_new: forceNew,
      };

      const response = await generateDietPlan(payload);

      if (response && (response.success || response.message)) {
        Alert.alert(
          'Success',
          `${duration}-day meal plan generated! View it in the Nutrition tab.`,
          [
            { text: 'View Plan', onPress: () => navigation.goBack() },
            { text: 'OK', style: 'cancel' },
          ]
        );
        setDietPlan({ success: true, duration });
        setActivePlan(null); // Clear active plan state
      } else {
        throw new Error('No plan returned from server');
      }
    } catch (error) {
      console.error('Diet plan error:', error?.response?.data || error?.message || error);
      
      // Check if error is due to active plan
      if (error?.response?.data?.error === 'active_plan_exists') {
        setShowOverrideConfirm(true);
      } else {
        const msg = error?.response?.data?.detail || error?.message || 'Failed to generate diet plan';
        Alert.alert('Error', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={isDark ? ['#1A3A3A', '#2A4F4F'] : ['#7A9B9E', '#A8C5C7']}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.textPrimary }]}>AI Diet Plan</Text>
        </View>

        {!dietPlan ? (
          <View>
            {/* Active Plan Warning */}
            {activePlan && (
              <View style={[styles.card, { backgroundColor: colors.warning + '10', borderColor: colors.warning }]}>
                <View style={styles.warningHeader}>
                  <Icon name="alert" size={24} color={colors.warning} />
                  <Text style={[styles.warningTitle, { color: colors.textPrimary }]}>Active Plan Running</Text>
                </View>
                <Text style={[styles.warningText, { color: colors.textSecondary }]}>
                  You have an active {activePlan.total_days}-day meal plan with {activePlan.remaining_days} days remaining.
                </Text>
                <Text style={[styles.warningSubtext, { color: colors.textTertiary, marginTop: 8 }]}>
                  Generating a new plan will replace your current plan. All progress will be kept in history.
                </Text>
              </View>
            )}

            {/* User Profile Info */}
            {profileLoaded && userProfile && (
              <View style={[styles.card, { backgroundColor: colors.info + '10', borderColor: colors.info }]}>
                <View style={styles.warningHeader}>
                  <Icon name="account-check" size={24} color={colors.info} />
                  <Text style={[styles.warningTitle, { color: colors.textPrimary }]}>Using Your Profile</Text>
                </View>
                <Text style={[styles.warningText, { color: colors.textSecondary }]}>
                  AI will generate a personalized meal plan based on your profile:
                </Text>
                <View style={{ marginTop: 12, gap: 6 }}>
                  {userProfile.age && (
                    <Text style={[styles.profileItem, { color: colors.textTertiary }]}>
                      • Age: {userProfile.age} years
                    </Text>
                  )}
                  {userProfile.gender && (
                    <Text style={[styles.profileItem, { color: colors.textTertiary }]}>
                      • Gender: {userProfile.gender}
                    </Text>
                  )}
                  {userProfile.weight && (
                    <Text style={[styles.profileItem, { color: colors.textTertiary }]}>
                      • Weight: {userProfile.weight} kg
                    </Text>
                  )}
                  {userProfile.height && (
                    <Text style={[styles.profileItem, { color: colors.textTertiary }]}>
                      • Height: {userProfile.height} cm
                    </Text>
                  )}
                  {userProfile.fitness_goal && (
                    <Text style={[styles.profileItem, { color: colors.textTertiary }]}>
                      • Goal: {goalOptions.find(opt => opt.key === userProfile.fitness_goal)?.label || userProfile.fitness_goal}
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* Input Form */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Plan Duration</Text>
              <View style={styles.durationGrid}>
                {durationOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.durationButton,
                      {
                        backgroundColor: duration === option.value ? colors.accent : colors.cardGlass,
                        borderColor: duration === option.value ? colors.accent : colors.border,
                      },
                    ]}
                    onPress={() => setDuration(option.value)}
                  >
                    <Text
                      style={[
                        styles.durationText,
                        { color: duration === option.value ? '#fff' : colors.textPrimary },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, { color: colors.textSecondary, marginTop: 20 }]}>Dietary Preference</Text>
              <TouchableOpacity
                style={[styles.dropdownSelector, { backgroundColor: colors.cardGlass, borderColor: colors.border }]}
                onPress={() => setShowDietaryModal(true)}
              >
                <Text style={[styles.dropdownText, { color: colors.textPrimary }]}>
                  {dietaryOptions.find(opt => opt.key === dietaryPreference)?.label || 'Select'}
                </Text>
                <Icon name="chevron-down" size={24} color={colors.textSecondary} />
              </TouchableOpacity>

              <Text style={[styles.label, { color: colors.textSecondary, marginTop: 20 }]}>
                Fitness Goal {profileLoaded && <Text style={{ color: colors.accent }}>(Auto-filled from Profile)</Text>}
              </Text>
              <TouchableOpacity
                style={[styles.dropdownSelector, { backgroundColor: colors.cardGlass, borderColor: colors.border }]}
                onPress={() => setShowGoalModal(true)}
              >
                <Text style={[styles.dropdownText, { color: colors.textPrimary }]}>
                  {goalOptions.find(opt => opt.key === goal)?.label || 'Select'}
                </Text>
                <Icon name="chevron-down" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
              {profileLoaded && (
                <Text style={[styles.helperText, { color: colors.textTertiary, marginTop: 4 }]}>
                  Auto-filled from your profile. Tap to change for this plan only.
                </Text>
              )}

              <Text style={[styles.label, { color: colors.textSecondary, marginTop: 20 }]}>
                Allergies (comma separated)
              </Text>
              <TextInput
                style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]}
                value={allergies}
                onChangeText={setAllergies}
                placeholder="e.g., peanuts, dairy, gluten"
                placeholderTextColor={colors.textTertiary}
              />

              <TouchableOpacity
                style={[styles.generateButton, { backgroundColor: colors.accent }]}
                onPress={generatePlan}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Icon name="sparkles" size={20} color="#FFF" />
                    <Text style={styles.generateButtonText}>Generate {duration}-Day Plan</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View>
            {/* Success Message */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.resultHeader}>
                <Icon name="check-circle" size={64} color={colors.success} />
                <Text style={[styles.resultTitle, { color: colors.textPrimary }]}>
                  Meal Plan Generated!
                </Text>
                <Text style={[styles.resultSubtitle, { color: colors.textSecondary }]}>
                  Your {duration}-day personalized meal plan is ready
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.viewPlanButton, { backgroundColor: colors.accent }]}
                onPress={() => navigation.goBack()}
              >
                <Icon name="food-apple" size={24} color="#FFF" />
                <Text style={styles.viewPlanText}>View Meal Plan</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.regenerateButton, { backgroundColor: colors.cardGlass, borderColor: colors.border }]}
                onPress={() => setDietPlan(null)}
              >
                <Text style={[styles.regenerateText, { color: colors.textPrimary }]}>
                  Generate New Plan
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* Dietary Preference Modal */}
      <Modal visible={showDietaryModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#182E3D' : '#E8F0EE' }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Select Dietary Preference</Text>
            <ScrollView style={styles.optionsList}>
              {dietaryOptions.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.optionItem,
                    { 
                      backgroundColor: dietaryPreference === option.key ? colors.accent + '20' : colors.cardGlass,
                      borderColor: dietaryPreference === option.key ? colors.accent : colors.border
                    }
                  ]}
                  onPress={() => {
                    setDietaryPreference(option.key);
                    setShowDietaryModal(false);
                  }}
                >
                  <Text style={[styles.optionText, { color: dietaryPreference === option.key ? colors.accent : colors.textPrimary }]}>
                    {option.label}
                  </Text>
                  {dietaryPreference === option.key && <Icon name="check" size={20} color={colors.accent} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.cardGlass }]}
              onPress={() => setShowDietaryModal(false)}
            >
              <Text style={[styles.closeButtonText, { color: colors.textPrimary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Goal Modal */}
      <Modal visible={showGoalModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#182E3D' : '#E8F0EE' }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Select Fitness Goal</Text>
            <ScrollView style={styles.optionsList}>
              {goalOptions.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.optionItem,
                    { 
                      backgroundColor: goal === option.key ? colors.accent + '20' : colors.cardGlass,
                      borderColor: goal === option.key ? colors.accent : colors.border
                    }
                  ]}
                  onPress={() => {
                    setGoal(option.key);
                    setShowGoalModal(false);
                  }}
                >
                  <Text style={[styles.optionText, { color: goal === option.key ? colors.accent : colors.textPrimary }]}>
                    {option.label}
                  </Text>
                  {goal === option.key && <Icon name="check" size={20} color={colors.accent} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.cardGlass }]}
              onPress={() => setShowGoalModal(false)}
            >
              <Text style={[styles.closeButtonText, { color: colors.textPrimary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Override Confirmation Modal */}
      <Modal visible={showOverrideConfirm} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#182E3D' : '#E8F0EE' }]}>
            <Icon name="alert-circle" size={64} color={colors.warning} style={{ alignSelf: 'center', marginBottom: 16 }} />
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Replace Active Plan?</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary, textAlign: 'center', marginBottom: 20 }]}>
              You have an active meal plan. Generating a new plan will replace it. Your eating history will be preserved.
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: colors.cardGlass, flex: 1 }]}
                onPress={() => setShowOverrideConfirm(false)}
              >
                <Text style={[styles.closeButtonText, { color: colors.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: colors.warning, flex: 1 }]}
                onPress={() => {
                  setShowOverrideConfirm(false);
                  generatePlan(true); // Force new plan
                }}
              >
                <Text style={[styles.closeButtonText, { color: '#FFF' }]}>Replace Plan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  card: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
  },
  label: {
    fontSize: 14,
    marginBottom: 12,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dropdownSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  dropdownText: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  optionsList: {
    maxHeight: 400,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
  },
  generateButton: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 8,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  durationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  durationButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: '30%',
    alignItems: 'center',
  },
  durationText: {
    fontSize: 13,
    fontWeight: '600',
  },
  resultHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  resultSubtitle: {
    fontSize: 15,
    marginTop: 8,
    textAlign: 'center',
  },
  viewPlanButton: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  viewPlanText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  calorieRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  calorieLabel: {
    fontSize: 16,
  },
  calorieValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 12,
  },
  macroGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  macroItem: {
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  macroValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  mealCard: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  mealType: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  mealCalories: {
    fontSize: 14,
    marginBottom: 8,
  },
  suggestion: {
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 20,
  },
  hydration: {
    fontSize: 16,
    marginBottom: 16,
  },
  tip: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  regenerateButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1,
  },
  regenerateText: {
    fontSize: 15,
    fontWeight: '600',
  },
  bottomSpace: {
    height: 20,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  warningText: {
    fontSize: 14,
    lineHeight: 20,
  },
  warningSubtext: {
    fontSize: 13,
    lineHeight: 18,
  },
  profileItem: {
    fontSize: 13,
    lineHeight: 20,
  },
  modalSubtitle: {
    fontSize: 15,
  },
});

export default DietPlanScreen;
