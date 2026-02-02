import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'react-native-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveGoals, getGoals } from '../../utils/storage';

const MyProfileScreen = () => {
  const { colors, isDark } = useTheme();
  const [user, setUser] = useState(null);
  const [stepsGoal, setStepsGoal] = useState('10000');
  const [bedtime, setBedtime] = useState('22:00');
  const [screenTimeTarget, setScreenTimeTarget] = useState('4');
  const [isEditingGoals, setIsEditingGoals] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState('account');
  const [showBedtimeModal, setShowBedtimeModal] = useState(false);

  const avatars = [
    { name: 'account', label: 'Default', bg: '#2F4F4A' },
    { name: 'run', label: 'Runner', bg: '#EF5350' },
    { name: 'dumbbell', label: 'Gym', bg: '#FF7043' },
    { name: 'bike', label: 'Cyclist', bg: '#66BB6A' },
    { name: 'yoga', label: 'Yoga', bg: '#AB47BC' },
    { name: 'swim', label: 'Swimmer', bg: '#42A5F5' },
    { name: 'basketball', label: 'Basketball', bg: '#FFA726' },
    { name: 'soccer', label: 'Soccer', bg: '#26C6DA' },
    { name: 'tennis', label: 'Tennis', bg: '#FFCA28' },
    { name: 'golf', label: 'Golf', bg: '#66BB6A' },
    { name: 'hiking', label: 'Hiking', bg: '#8D6E63' },
    { name: 'boxing-glove', label: 'Boxing', bg: '#EC407A' },
    { name: 'karate', label: 'Karate', bg: '#7C4DFF' },
    { name: 'weight-lifter', label: 'Lifter', bg: '#FF5722' },
    { name: 'meditation', label: 'Zen', bg: '#9C27B0' },
    { name: 'fitwell', label: 'FitWell', bg: '#8B5CF6', isLogo: true },
  ];

  useEffect(() => {
    loadUserData();
    loadGoalsData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const loadGoalsData = async () => {
    const goals = await getGoals();
    setStepsGoal(goals.stepsGoal);
    setBedtime(goals.bedtime);
    setScreenTimeTarget(goals.screenTimeTarget);
    
    const savedAvatar = await AsyncStorage.getItem('selectedAvatar');
    if (savedAvatar) {
      setSelectedAvatar(savedAvatar);
    }
  };

  const saveGoalsData = async () => {
    const success = await saveGoals({
      stepsGoal,
      bedtime,
      screenTimeTarget,
    });
    
    if (success) {
      setIsEditingGoals(false);
      Alert.alert('Success', 'Goals saved successfully!');
    } else {
      Alert.alert('Error', 'Failed to save goals');
    }
  };

  const handleAvatarSelect = async (avatarName) => {
    setSelectedAvatar(avatarName);
    await AsyncStorage.setItem('selectedAvatar', avatarName);
    setShowAvatarModal(false);
    Alert.alert('Success', 'Avatar updated!');
  };

  const getFitnessGoalDescription = (goal) => {
    const descriptions = {
      'lose_weight': 'Lose Weight - Focus on calorie deficit and cardio exercises',
      'gain_muscle': 'Gain Muscle - Build strength with resistance training and protein',
      'maintain': 'Maintain Weight - Keep current fitness level with balanced routine',
      'improve_endurance': 'Improve Endurance - Enhance stamina with aerobic activities',
      'flexibility': 'Flexibility - Increase range of motion with stretching and yoga',
      'general_fitness': 'General Fitness - Overall health and wellness improvement',
    };
    return descriptions[goal] || goal || 'Not specified';
  };

  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const h = hour.toString().padStart(2, '0');
        const m = minute.toString().padStart(2, '0');
        times.push(`${h}:${m}`);
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  return (
    <LinearGradient
      colors={isDark ? [colors.backgroundStart, colors.backgroundMid, colors.backgroundEnd] : [colors.backgroundStart, colors.backgroundMid, colors.backgroundEnd]}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={[styles.mainTitle, { color: colors.textPrimary }]}>My Profile</Text>

        {/* Profile Header */}
        <View style={[styles.profileHeader, { backgroundColor: 'transparent', borderColor: colors.border }]}>
          <TouchableOpacity onPress={() => setShowAvatarModal(true)} style={styles.avatarContainer}>
            <View style={[styles.avatarLarge, { backgroundColor: avatars.find(a => a.name === selectedAvatar)?.bg || colors.accent, borderColor: colors.border }]}>
              {selectedAvatar === 'fitwell' ? (
                <Image 
                  source={require('../../assets/images/fitwell_logo.png')}
                  style={{ width: 60, height: 60 }}
                  resizeMode="contain"
                />
              ) : (
                <Icon name={selectedAvatar} size={60} color="#FFFFFF" />
              )}
            </View>
            <View style={[styles.editAvatarBadge, { backgroundColor: colors.accent }]}>
              <Icon name="pencil" size={14} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <Text style={[styles.editAvatarText, { color: colors.textSecondary }]}>Edit Avatar</Text>
          <Text style={[styles.userName, { color: colors.textPrimary }]}>
            {user?.first_name} {user?.last_name}
          </Text>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
            {user?.email}
          </Text>
        </View>

        {/* Avatar Selection Modal */}
        <Modal
          visible={showAvatarModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowAvatarModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Choose Avatar</Text>
              <ScrollView 
                style={styles.avatarScrollView} 
                showsVerticalScrollIndicator={true}
                contentContainerStyle={styles.avatarScrollContent}
              >
                <View style={styles.avatarGrid}>
                  {avatars.map((avatar) => (
                    <TouchableOpacity
                      key={avatar.name}
                      style={[
                        styles.avatarOption,
                        { 
                          backgroundColor: avatar.bg,
                          borderColor: selectedAvatar === avatar.name ? colors.accent : 'transparent',
                          borderWidth: selectedAvatar === avatar.name ? 3 : 0,
                        }
                      ]}
                      onPress={() => handleAvatarSelect(avatar.name)}
                    >
                      {avatar.isLogo ? (
                        <Image 
                          source={require('../../assets/images/fitwell_logo.png')}
                          style={{ width: 40, height: 40 }}
                          resizeMode="contain"
                        />
                      ) : (
                        <Icon name={avatar.name} size={40} color="#FFFFFF" />
                      )}
                      <Text style={[styles.avatarLabel, { color: '#FFFFFF' }]}>{avatar.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              <TouchableOpacity
                style={[styles.closeModalButton, { backgroundColor: colors.accent }]}
                onPress={() => setShowAvatarModal(false)}
              >
                <Text style={styles.closeModalText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Personal Information */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Personal Information</Text>
        <View style={[styles.infoCard, { backgroundColor: 'transparent', borderColor: colors.border }]}>
          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: colors.accent + '30' }]}>
              <Icon name="account" size={20} color={colors.accent} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>Full Name</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                {user?.first_name} {user?.last_name}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: colors.accent + '30' }]}>
              <Icon name="gender-male-female" size={20} color={colors.accent} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>Gender</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                {user?.gender || 'Not specified'}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: colors.accent + '30' }]}>
              <Icon name="cake-variant" size={20} color={colors.accent} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>Date of Birth</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                {user?.date_of_birth || 'Not specified'}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: colors.accent + '30' }]}>
              <Icon name="human-male-height" size={20} color={colors.accent} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>Height</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                {user?.height ? `${user.height} cm` : 'Not specified'}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: colors.accent + '30' }]}>
              <Icon name="weight-kilogram" size={20} color={colors.accent} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>Weight</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                {user?.weight ? `${user.weight} kg` : 'Not specified'}
              </Text>
            </View>
          </View>
        </View>

        {/* Goals & Targets */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Goals & Targets</Text>
          {!isEditingGoals && (
            <TouchableOpacity onPress={() => setIsEditingGoals(true)}>
              <Icon name="pencil" size={20} color={colors.accent} />
            </TouchableOpacity>
          )}
        </View>
        <View style={[styles.goalsCard, { backgroundColor: 'transparent', borderColor: colors.border }]}>
          <View style={styles.goalRow}>
            <View style={[styles.goalIcon, { backgroundColor: colors.accent + '30' }]}>
              <Icon name="walk" size={24} color={colors.accent} />
            </View>
            <View style={styles.goalContent}>
              <Text style={[styles.goalLabel, { color: colors.textSecondary }]}>Daily Steps Goal</Text>
              {isEditingGoals ? (
                <TextInput
                  style={[styles.goalInput, { color: colors.textPrimary, borderColor: colors.border }]}
                  value={stepsGoal}
                  onChangeText={setStepsGoal}
                  keyboardType="numeric"
                  placeholderTextColor={colors.textTertiary}
                />
              ) : (
                <Text style={[styles.goalValue, { color: colors.textPrimary }]}>{stepsGoal} steps</Text>
              )}
            </View>
          </View>

          <View style={styles.goalRow}>
            <View style={[styles.goalIcon, { backgroundColor: '#7C4DFF' + '30' }]}>
              <Icon name="moon-waning-crescent" size={24} color="#7C4DFF" />
            </View>
            <View style={styles.goalContent}>
              <Text style={[styles.goalLabel, { color: colors.textSecondary }]}>Bedtime Schedule</Text>
              {isEditingGoals ? (
                <TouchableOpacity
                  style={[styles.timeSelector, { backgroundColor: colors.cardGlass, borderColor: colors.border }]}
                  onPress={() => setShowBedtimeModal(true)}
                >
                  <Icon name="moon-waning-crescent" size={20} color="#7C4DFF" />
                  <Text style={[styles.timeSelectorText, { color: colors.textPrimary }]}>{bedtime}</Text>
                  <Icon name="chevron-down" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              ) : (
                <View style={styles.bedtimeDisplay}>
                  <Icon name="moon-waning-crescent" size={18} color="#7C4DFF" />
                  <Text style={[styles.goalValue, { color: colors.textPrimary, marginLeft: 8 }]}>{bedtime}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.goalRow}>
            <View style={[styles.goalIcon, { backgroundColor: colors.accent + '30' }]}>
              <Icon name="cellphone" size={24} color={colors.accent} />
            </View>
            <View style={styles.goalContent}>
              <Text style={[styles.goalLabel, { color: colors.textSecondary }]}>Screen Time Target</Text>
              {isEditingGoals ? (
                <View style={styles.bedtimeRow}>
                  <TextInput
                    style={[styles.goalInput, { color: colors.textPrimary, borderColor: colors.border, flex: 1 }]}
                    value={screenTimeTarget}
                    onChangeText={setScreenTimeTarget}
                    keyboardType="numeric"
                    placeholder="Hours"
                    placeholderTextColor={colors.textTertiary}
                  />
                  <Text style={[styles.hoursLabel, { color: colors.textSecondary }]}>hrs</Text>
                </View>
              ) : (
                <View style={styles.bedtimeDisplay}>
                  <Icon name="timer-outline" size={18} color={colors.accent} />
                  <Text style={[styles.goalValue, { color: colors.textPrimary, marginLeft: 8 }]}>{screenTimeTarget} hrs/day</Text>
                </View>
              )}
            </View>
          </View>

          {isEditingGoals && (
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.accent }]}
              onPress={saveGoalsData}
            >
              <Text style={styles.saveButtonText}>Save Goals</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Fitness Goal */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Fitness Goal</Text>
        <View style={[styles.fitnessCard, { backgroundColor: 'transparent', borderColor: colors.border }]}>
          <View style={[styles.fitnessIconCircle, { backgroundColor: colors.success + '20' }]}>
            <Icon name="target" size={40} color={colors.success} />
          </View>
          <Text style={[styles.fitnessGoalTitle, { color: colors.textPrimary }]}>
            {getFitnessGoalDescription(user?.fitness_goal).split(' - ')[0]}
          </Text>
          <Text style={[styles.fitnessGoalDescription, { color: colors.textSecondary }]}>
            {getFitnessGoalDescription(user?.fitness_goal).split(' - ')[1] || 'Set your fitness goal to get personalized recommendations'}
          </Text>
        </View>

        {/* Bedtime Picker Modal */}
        <Modal
          visible={showBedtimeModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowBedtimeModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.timeModalContent, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Select Bedtime</Text>
              <ScrollView style={styles.timeScrollView} showsVerticalScrollIndicator={false}>
                {timeOptions.map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.timeOption,
                      {
                        backgroundColor: bedtime === time ? colors.accent + '20' : colors.cardGlass,
                        borderColor: bedtime === time ? colors.accent : colors.border,
                      }
                    ]}
                    onPress={() => {
                      setBedtime(time);
                      setShowBedtimeModal(false);
                    }}
                  >
                    <Icon name="clock-outline" size={20} color={bedtime === time ? colors.accent : colors.textSecondary} />
                    <Text style={[styles.timeOptionText, { color: bedtime === time ? colors.accent : colors.textPrimary }]}>
                      {time}
                    </Text>
                    {bedtime === time && <Icon name="check" size={20} color={colors.accent} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                style={[styles.closeModalButton, { backgroundColor: colors.accent }]}
                onPress={() => setShowBedtimeModal(false)}
              >
                <Text style={styles.closeModalText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Copyright */}
        <Text style={[styles.copyright, { color: colors.textTertiary }]}>
          © 2026 FitWell. All rights reserved.
        </Text>

        <View style={styles.bottomSpace} />
      </ScrollView>
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
    paddingTop: 20,
    paddingBottom: 100,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 30,
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 1,
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 16,
  },
  infoCard: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  goalsCard: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 1,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  goalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  goalContent: {
    flex: 1,
  },
  goalLabel: {
    fontSize: 13,
    marginBottom: 8,
    fontWeight: '600',
  },
  goalInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fitnessCard: {
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
  },
  fitnessIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  fitnessGoalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  fitnessGoalDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  timeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    gap: 8,
  },
  timeSelectorText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  bedtimeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  hoursLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  timeModalContent: {
    width: '85%',
    maxHeight: '70%',
    borderRadius: 20,
    padding: 24,
  },
  timeScrollView: {
    maxHeight: 400,
  },
  timeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    gap: 12,
  },
  timeOptionText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
  },
  copyright: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  bottomSpace: {
    height: 20,
  },
  avatarContainer: {
    position: 'relative',
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAvatarText: {
    fontSize: 12,
    marginTop: 8,
    marginBottom: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  avatarScrollView: {
    maxHeight: 400,
    flexGrow: 0,
  },
  avatarScrollContent: {
    paddingBottom: 10,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  avatarOption: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  avatarLabel: {
    fontSize: 9,
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '600',
  },
  closeModalButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeModalText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  goalValue: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  bedtimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  alarmButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MyProfileScreen;
