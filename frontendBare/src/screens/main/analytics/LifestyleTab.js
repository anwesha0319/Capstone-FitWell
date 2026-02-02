import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../context/ThemeContext';
import { saveHealthData, getHealthData } from '../../../utils/storage';
import { calculateStressFromBP, getStressColor } from '../../../utils/healthCalculations';

const LifestyleTab = () => {
  const { colors, isDark } = useTheme();
  const [showDetails, setShowDetails] = useState(false);
  const [showDietModal, setShowDietModal] = useState(false);
  const [showSmokingModal, setShowSmokingModal] = useState(false);
  const [showAlcoholModal, setShowAlcoholModal] = useState(false);
  const [diet, setDiet] = useState('Vegetarian');
  const [smoking, setSmoking] = useState('Non-smoker');
  const [alcohol, setAlcohol] = useState('None');
  const [stressLevel, setStressLevel] = useState(0);
  const [hasLifestyleData, setHasLifestyleData] = useState(false);
  
  // Temporary selection states for modals
  const [tempDiet, setTempDiet] = useState(null);
  const [tempSmoking, setTempSmoking] = useState(null);
  const [tempAlcohol, setTempAlcohol] = useState(null);

  // Dropdown options
  const dietOptions = ['Vegetarian', 'Vegan', 'Non-vegetarian', 'Pescatarian', 'Keto', 'Paleo', 'Gluten Free', 'Dairy Free'];
  const smokingOptions = ['Non-smoker', 'Occasional', 'Regular', 'Heavy'];
  const alcoholOptions = ['None', 'Occasional', 'Moderate', 'Heavy'];

  const [healthScore, setHealthScore] = useState(100);

  // Calculate health score based on lifestyle factors
  const calculateHealthScore = () => {
    let score = 100;
    
    // Diet impact (-5 to 0)
    const dietScores = {
      'Vegetarian': 0,
      'Vegan': 0,
      'Pescatarian': -2,
      'Non-vegetarian': -5,
      'Keto': -3,
      'Paleo': -3,
      'Gluten Free': -2,
      'Dairy Free': -2,
      'Non-Veg': -5
    };
    score += dietScores[diet] || 0;
    
    // Smoking impact (-30 to 0)
    const smokingScores = {
      'Non-smoker': 0,
      'Occasional': -10,
      'Regular': -20,
      'Heavy': -30
    };
    score += smokingScores[smoking] || 0;
    
    // Alcohol impact (-20 to 0)
    const alcoholScores = {
      'None': 0,
      'Occasional': -5,
      'Moderate': -10,
      'Heavy': -20
    };
    score += alcoholScores[alcohol] || 0;
    
    // Stress impact (-30 to 0)
    if (stressLevel < 30) score += 0;
    else if (stressLevel < 60) score -= 15;
    else score -= 30;
    
    return Math.max(0, Math.min(100, score));
  };
  
  useEffect(() => {
    const score = calculateHealthScore();
    setHealthScore(score);
  }, [diet, smoking, alcohol, stressLevel]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const data = await getHealthData();
      setDiet(data.diet || 'Vegetarian');
      setSmoking(data.smokingStatus || 'Non-smoker');
      setAlcohol(data.alcoholConsumption || 'None');
      setHasLifestyleData(!!(data.diet || data.smokingStatus || data.alcoholConsumption));
      
      // Calculate stress from BP if available
      if (data.bloodPressure && data.bloodPressure.systolic && data.bloodPressure.diastolic) {
        const stress = calculateStressFromBP(data.bloodPressure.systolic, data.bloodPressure.diastolic);
        setStressLevel(Math.round(stress));
      } else {
        setStressLevel(0);
      }
    } catch (error) {
      console.error('Error loading lifestyle data:', error);
    }
  };

  // Modal handlers with temp state
  const handleOpenDietModal = () => {
    setTempDiet(diet);
    setShowDietModal(true);
  };

  const handleOpenSmokingModal = () => {
    setTempSmoking(smoking);
    setShowSmokingModal(true);
  };

  const handleOpenAlcoholModal = () => {
    setTempAlcohol(alcohol);
    setShowAlcoholModal(true);
  };

  // Save handlers
  const handleSaveDiet = async () => {
    if (tempDiet) {
      try {
        await saveHealthData({ diet: tempDiet });
        setDiet(tempDiet);
        setShowDietModal(false);
      } catch (error) {
        console.error('Error saving diet:', error);
        Alert.alert('Error', 'Failed to save changes. Please try again.');
      }
    }
  };

  const handleSaveSmoking = async () => {
    if (tempSmoking) {
      try {
        await saveHealthData({ smokingStatus: tempSmoking });
        setSmoking(tempSmoking);
        setShowSmokingModal(false);
      } catch (error) {
        console.error('Error saving smoking status:', error);
        Alert.alert('Error', 'Failed to save changes. Please try again.');
      }
    }
  };

  const handleSaveAlcohol = async () => {
    if (tempAlcohol) {
      try {
        await saveHealthData({ alcoholConsumption: tempAlcohol });
        setAlcohol(tempAlcohol);
        setShowAlcoholModal(false);
      } catch (error) {
        console.error('Error saving alcohol consumption:', error);
        Alert.alert('Error', 'Failed to save changes. Please try again.');
      }
    }
  };

  // Cancel handlers
  const handleCancelDiet = () => {
    setTempDiet(null);
    setShowDietModal(false);
  };

  const handleCancelSmoking = () => {
    setTempSmoking(null);
    setShowSmokingModal(false);
  };

  const handleCancelAlcohol = () => {
    setTempAlcohol(null);
    setShowAlcoholModal(false);
  };

  const strength = 85;
  const agility = 78;
  const endurance = 92;

  const getScoreColor = (score) => {
    if (score >= 80) return colors.success;
    if (score >= 60) return colors.warning;
    return colors.error;
  };

  // Get health message based on score
  const getHealthMessage = () => {
    if (healthScore >= 85) return { icon: 'check-circle', color: colors.success, text: 'You are a healthy individual' };
    if (healthScore >= 70) return { icon: 'alert-circle', color: colors.warning, text: 'Your health is good, but could be improved' };
    if (healthScore >= 50) return { icon: 'alert', color: colors.warning, text: 'Consider improving your lifestyle habits' };
    return { icon: 'alert-octagon', color: colors.error, text: 'Your health needs attention - consult a healthcare provider' };
  };

  // Calculate disease risks based on lifestyle
  const calculateDiseaseRisks = () => {
    // Heart Failure Risk
    let heartRisk = 10;
    if (smoking === 'Heavy') heartRisk += 40;
    else if (smoking === 'Regular') heartRisk += 25;
    else if (smoking === 'Occasional') heartRisk += 10;
    if (alcohol === 'Heavy') heartRisk += 15;
    else if (alcohol === 'Moderate') heartRisk += 8;
    if (stressLevel > 60) heartRisk += 20;
    else if (stressLevel > 30) heartRisk += 10;
    heartRisk = Math.min(95, heartRisk);

    // Liver Failure Risk
    let liverRisk = 15;
    if (alcohol === 'Heavy') liverRisk += 50;
    else if (alcohol === 'Moderate') liverRisk += 25;
    else if (alcohol === 'Occasional') liverRisk += 10;
    if (smoking === 'Heavy') liverRisk += 15;
    else if (smoking === 'Regular') liverRisk += 10;
    if (diet === 'Non-vegetarian') liverRisk += 5;
    liverRisk = Math.min(95, liverRisk);

    // Kidney Disease Risk
    let kidneyRisk = 12;
    if (smoking === 'Heavy') kidneyRisk += 25;
    else if (smoking === 'Regular') kidneyRisk += 15;
    if (alcohol === 'Heavy') kidneyRisk += 20;
    else if (alcohol === 'Moderate') kidneyRisk += 10;
    if (stressLevel > 60) kidneyRisk += 15;
    kidneyRisk = Math.min(95, kidneyRisk);

    return { heartRisk, liverRisk, kidneyRisk };
  };

  const healthMessage = getHealthMessage();
  const { heartRisk, liverRisk, kidneyRisk } = calculateDiseaseRisks();

  const getRiskLevel = (risk) => {
    if (risk < 30) return { level: 'Low', color: colors.success };
    if (risk < 60) return { level: 'Moderate', color: colors.warning };
    return { level: 'High', color: colors.error };
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Lifestyle</Text>

      {!hasLifestyleData && (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.noDataTitle, { color: colors.textPrimary }]}>Lifestyle info not set</Text>
          <Text style={[styles.noDataText, { color: colors.textSecondary }]}>We couldn't find lifestyle details in your profile. Please open your profile and provide diet, smoking and alcohol details so we can give accurate insights.</Text>
          <TouchableOpacity style={[styles.generateButton, { backgroundColor: colors.accent, alignSelf: 'center' }]} onPress={() => {/* navigate to profile if available */}}>
            <Icon name="account" size={18} color="#FFF" />
            <Text style={styles.generateButtonText}>Open Profile</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Horizontal Cards */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
        <TouchableOpacity 
          style={[styles.lifestyleCard, { backgroundColor: colors.cardGlass, borderColor: colors.border }]}
          onPress={handleOpenDietModal}
        >
          <View style={[styles.iconCircle, { backgroundColor: colors.success + '20' }]}>
            <Icon name="food-apple" size={32} color={colors.success} />
          </View>
          <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Diet</Text>
          <Text style={[styles.cardValue, { color: colors.textPrimary }]}>{diet}</Text>
          <Icon name="pencil" size={16} color={colors.accent} style={{ marginTop: 8 }} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.lifestyleCard, { backgroundColor: colors.cardGlass, borderColor: colors.border }]}
          onPress={handleOpenSmokingModal}
        >
          <View style={[styles.iconCircle, { backgroundColor: colors.error + '20' }]}>
            <Icon name="smoking" size={32} color={colors.error} />
          </View>
          <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Smoking</Text>
          <Text style={[styles.cardValue, { color: colors.textPrimary }]}>{smoking}</Text>
          <Icon name="pencil" size={16} color={colors.accent} style={{ marginTop: 8 }} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.lifestyleCard, { backgroundColor: colors.cardGlass, borderColor: colors.border }]}
          onPress={handleOpenAlcoholModal}
        >
          <View style={[styles.iconCircle, { backgroundColor: colors.warning + '20' }]}>
            <Icon name="glass-cocktail" size={32} color={colors.warning} />
          </View>
          <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Alcohol</Text>
          <Text style={[styles.cardValue, { color: colors.textPrimary }]}>{alcohol}</Text>
          <Icon name="pencil" size={16} color={colors.accent} style={{ marginTop: 8 }} />
        </TouchableOpacity>

        <View style={[styles.lifestyleCard, { backgroundColor: colors.cardGlass, borderColor: colors.border }]}>
          <View style={[styles.iconCircle, { backgroundColor: getStressColor(stressLevel, colors) + '20' }]}>
            <Icon name="brain" size={32} color={getStressColor(stressLevel, colors)} />
          </View>
          <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Stress Level</Text>
          <Text style={[styles.cardValue, { color: colors.textPrimary }]}>{stressLevel}%</Text>
        </View>
      </ScrollView>

      {/* Health Score */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.scoreHeader}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Health Score</Text>
          <TouchableOpacity onPress={() => setShowDetails(true)}>
            <Text style={[styles.viewMore, { color: colors.accent }]}>View More</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.scoreContainer}>
          <View style={styles.circularScore}>
            <View style={[styles.scoreCircle, { borderColor: getScoreColor(healthScore) }]}>
              <Text style={[styles.scoreValue, { color: colors.textPrimary }]}>{healthScore}</Text>
              <Text style={[styles.scoreMax, { color: colors.textSecondary }]}>/100</Text>
            </View>
          </View>
          
          <View style={styles.metricsContainer}>
            <View style={styles.metricRow}>
              <Icon name="arm-flex" size={20} color={getScoreColor(strength)} />
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Strength</Text>
              <View style={styles.metricBar}>
                <View style={[styles.metricFill, { width: `${strength}%`, backgroundColor: getScoreColor(strength) }]} />
              </View>
              <Text style={[styles.metricValue, { color: colors.textPrimary }]}>{strength}</Text>
            </View>

            <View style={styles.metricRow}>
              <Icon name="run-fast" size={20} color={getScoreColor(agility)} />
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Agility</Text>
              <View style={styles.metricBar}>
                <View style={[styles.metricFill, { width: `${agility}%`, backgroundColor: getScoreColor(agility) }]} />
              </View>
              <Text style={[styles.metricValue, { color: colors.textPrimary }]}>{agility}</Text>
            </View>

            <View style={styles.metricRow}>
              <Icon name="heart-pulse" size={20} color={getScoreColor(endurance)} />
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Endurance</Text>
              <View style={styles.metricBar}>
                <View style={[styles.metricFill, { width: `${endurance}%`, backgroundColor: getScoreColor(endurance) }]} />
              </View>
              <Text style={[styles.metricValue, { color: colors.textPrimary }]}>{endurance}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.messageBox, { backgroundColor: healthMessage.color + '10', borderColor: healthMessage.color }]}>
          <Icon name={healthMessage.icon} size={20} color={healthMessage.color} />
          <Text style={[styles.messageText, { color: colors.textPrimary }]}>{healthMessage.text}</Text>
        </View>
      </View>

      {/* Health Risk Insights */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.riskHeader}>
          <View style={[styles.iconCircle, { backgroundColor: colors.warning + '20' }]}>
            <Icon name="shield-alert" size={24} color={colors.warning} />
          </View>
          <Text style={[styles.cardTitle, { color: colors.textPrimary, marginBottom: 0 }]}>Disease Risks</Text>
        </View>
        <Text style={[styles.riskSubtitle, { color: colors.textSecondary }]}>
          Based on your vitals and lifestyle habits
        </Text>

        {/* Heart Failure Risk */}
        <View style={[styles.riskCard, { backgroundColor: colors.cardGlass, borderColor: colors.border }]}>
          <View style={styles.riskRow}>
            <View style={[styles.riskIcon, { backgroundColor: getRiskLevel(heartRisk).color + '20' }]}>
              <Icon name="heart-pulse" size={28} color={getRiskLevel(heartRisk).color} />
            </View>
            <View style={styles.riskInfo}>
              <Text style={[styles.riskName, { color: colors.textPrimary }]}>Heart Failure Risk</Text>
              <View style={styles.riskLevelRow}>
                <View style={[styles.riskBadge, { backgroundColor: getRiskLevel(heartRisk).color + '20', borderColor: getRiskLevel(heartRisk).color }]}>
                  <Text style={[styles.riskBadgeText, { color: getRiskLevel(heartRisk).color }]}>{getRiskLevel(heartRisk).level}</Text>
                </View>
                <Text style={[styles.riskPercentage, { color: getRiskLevel(heartRisk).color }]}>{heartRisk}%</Text>
              </View>
            </View>
          </View>
          <View style={[styles.riskBar, { backgroundColor: colors.cardGlass }]}>
            <View style={[styles.riskBarFill, { width: `${heartRisk}%`, backgroundColor: getRiskLevel(heartRisk).color }]} />
          </View>
          <Text style={[styles.riskNote, { color: colors.textSecondary }]}>
            {smoking !== 'Non-smoker' || stressLevel > 30 
              ? 'Smoking and stress increase heart disease risk. Consider lifestyle changes.' 
              : 'Your cardiovascular health is excellent. Keep up regular exercise and balanced diet.'}
          </Text>
        </View>

        {/* Liver Failure Risk */}
        <View style={[styles.riskCard, { backgroundColor: colors.cardGlass, borderColor: colors.border }]}>
          <View style={styles.riskRow}>
            <View style={[styles.riskIcon, { backgroundColor: getRiskLevel(liverRisk).color + '20' }]}>
              <Icon name="water-outline" size={28} color={getRiskLevel(liverRisk).color} />
            </View>
            <View style={styles.riskInfo}>
              <Text style={[styles.riskName, { color: colors.textPrimary }]}>Liver Failure Risk</Text>
              <View style={styles.riskLevelRow}>
                <View style={[styles.riskBadge, { backgroundColor: getRiskLevel(liverRisk).color + '20', borderColor: getRiskLevel(liverRisk).color }]}>
                  <Text style={[styles.riskBadgeText, { color: getRiskLevel(liverRisk).color }]}>{getRiskLevel(liverRisk).level}</Text>
                </View>
                <Text style={[styles.riskPercentage, { color: getRiskLevel(liverRisk).color }]}>{liverRisk}%</Text>
              </View>
            </View>
          </View>
          <View style={[styles.riskBar, { backgroundColor: colors.cardGlass }]}>
            <View style={[styles.riskBarFill, { width: `${liverRisk}%`, backgroundColor: getRiskLevel(liverRisk).color }]} />
          </View>
          <Text style={[styles.riskNote, { color: colors.textSecondary }]}>
            {alcohol === 'Heavy' || alcohol === 'Moderate'
              ? 'High alcohol consumption significantly increases liver disease risk. Consider reducing intake.'
              : 'Monitor alcohol intake and maintain healthy weight.'}
          </Text>
        </View>

        {/* Kidney Disease Risk */}
        <View style={[styles.riskCard, { backgroundColor: colors.cardGlass, borderColor: colors.border }]}>
          <View style={styles.riskRow}>
            <View style={[styles.riskIcon, { backgroundColor: getRiskLevel(kidneyRisk).color + '20' }]}>
              <Icon name="water-check" size={28} color={getRiskLevel(kidneyRisk).color} />
            </View>
            <View style={styles.riskInfo}>
              <Text style={[styles.riskName, { color: colors.textPrimary }]}>Kidney Disease Risk</Text>
              <View style={styles.riskLevelRow}>
                <View style={[styles.riskBadge, { backgroundColor: getRiskLevel(kidneyRisk).color + '20', borderColor: getRiskLevel(kidneyRisk).color }]}>
                  <Text style={[styles.riskBadgeText, { color: getRiskLevel(kidneyRisk).color }]}>{getRiskLevel(kidneyRisk).level}</Text>
                </View>
                <Text style={[styles.riskPercentage, { color: getRiskLevel(kidneyRisk).color }]}>{kidneyRisk}%</Text>
              </View>
            </View>
          </View>
          <View style={[styles.riskBar, { backgroundColor: colors.cardGlass }]}>
            <View style={[styles.riskBarFill, { width: `${kidneyRisk}%`, backgroundColor: getRiskLevel(kidneyRisk).color }]} />
          </View>
          <Text style={[styles.riskNote, { color: colors.textSecondary }]}>
            {smoking !== 'Non-smoker' || alcohol !== 'None'
              ? 'Smoking and alcohol can damage kidney function. Stay hydrated and reduce harmful habits.'
              : 'Good hydration and blood pressure levels. Continue healthy lifestyle habits.'}
          </Text>
        </View>

        {/* Preventive Insights */}
        <View style={[styles.preventiveBox, { backgroundColor: colors.accent + '10', borderColor: colors.accent }]}>
          <Icon name="shield-check" size={20} color={colors.accent} />
          <View style={styles.preventiveContent}>
            <Text style={[styles.preventiveTitle, { color: colors.textPrimary }]}>Preventive Insights</Text>
            <Text style={[styles.preventiveText, { color: colors.textSecondary }]}>
              • Regular health checkups every 6 months{'\n'}
              • Maintain balanced diet and exercise routine{'\n'}
              • Monitor stress levels and get adequate sleep{'\n'}
              • Stay hydrated (8-10 glasses daily)
            </Text>
          </View>
        </View>
      </View>

      {/* Detailed Modal */}
      <Modal visible={showDetails} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#182E3D' : '#A3B8C8' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Detailed Health Analysis</Text>
              <TouchableOpacity onPress={() => setShowDetails(false)}>
                <Icon name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={[styles.detailCard, { backgroundColor: 'transparent', borderColor: colors.border }]}>
                <Text style={[styles.detailTitle, { color: colors.textPrimary }]}>Overall Health Score: {healthScore}/100</Text>
                <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                  Your health score is calculated based on multiple factors including physical fitness, lifestyle choices, and vital signs.
                </Text>
              </View>

              <View style={[styles.detailCard, { backgroundColor: 'transparent', borderColor: colors.border }]}>
                <Text style={[styles.detailTitle, { color: colors.textPrimary }]}>Strength: {strength}/100</Text>
                <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                  Excellent upper body and core strength. Continue resistance training 3-4 times per week.
                </Text>
              </View>

              <View style={[styles.detailCard, { backgroundColor: 'transparent', borderColor: colors.border }]}>
                <Text style={[styles.detailTitle, { color: colors.textPrimary }]}>Agility: {agility}/100</Text>
                <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                  Good flexibility and coordination. Consider adding yoga or pilates to improve further.
                </Text>
              </View>

              <View style={[styles.detailCard, { backgroundColor: 'transparent', borderColor: colors.border }]}>
                <Text style={[styles.detailTitle, { color: colors.textPrimary }]}>Endurance: {endurance}/100</Text>
                <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                  Outstanding cardiovascular endurance. Your aerobic capacity is above average for your age group.
                </Text>
              </View>

              <View style={[styles.detailCard, { backgroundColor: 'transparent', borderColor: colors.border }]}>
                <Text style={[styles.detailTitle, { color: colors.textPrimary }]}>Recommendations</Text>
                <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                  • Maintain current exercise routine{'\n'}
                  • Stay hydrated (8-10 glasses daily){'\n'}
                  • Get 7-8 hours of quality sleep{'\n'}
                  • Manage stress through meditation{'\n'}
                  • Regular health checkups every 6 months
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Diet Selection Modal */}
      <Modal visible={showDietModal} transparent animationType="fade">
        <TouchableOpacity 
          style={styles.dropdownOverlay} 
          activeOpacity={1} 
          onPress={handleCancelDiet}
        >
          <TouchableOpacity 
            activeOpacity={1} 
            onPress={(e) => e.stopPropagation()}
            style={[styles.dropdownContent, { backgroundColor: isDark ? '#182E3D' : '#E8F0EE' }]}
          >
            <Text style={[styles.dropdownTitle, { color: colors.textPrimary }]}>Select Diet Type</Text>
            <ScrollView style={styles.optionsList}>
              {dietOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.optionItem,
                    { 
                      backgroundColor: tempDiet === option ? colors.accent + '20' : colors.cardGlass,
                      borderColor: tempDiet === option ? colors.accent : colors.border
                    }
                  ]}
                  onPress={() => setTempDiet(option)}
                >
                  <Text style={[styles.optionText, { color: tempDiet === option ? colors.accent : colors.textPrimary }]}>
                    {option}
                  </Text>
                  {tempDiet === option && <Icon name="check" size={20} color={colors.accent} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.cardGlass, borderColor: colors.border }]}
                onPress={handleCancelDiet}
              >
                <Text style={[styles.cancelButtonText, { color: colors.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.accent }]}
                onPress={handleSaveDiet}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Smoking Selection Modal */}
      <Modal visible={showSmokingModal} transparent animationType="fade">
        <TouchableOpacity 
          style={styles.dropdownOverlay} 
          activeOpacity={1} 
          onPress={handleCancelSmoking}
        >
          <TouchableOpacity 
            activeOpacity={1} 
            onPress={(e) => e.stopPropagation()}
            style={[styles.dropdownContent, { backgroundColor: isDark ? '#182E3D' : '#E8F0EE' }]}
          >
            <Text style={[styles.dropdownTitle, { color: colors.textPrimary }]}>Select Smoking Status</Text>
            <ScrollView style={styles.optionsList}>
              {smokingOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.optionItem,
                    { 
                      backgroundColor: tempSmoking === option ? colors.accent + '20' : colors.cardGlass,
                      borderColor: tempSmoking === option ? colors.accent : colors.border
                    }
                  ]}
                  onPress={() => setTempSmoking(option)}
                >
                  <Text style={[styles.optionText, { color: tempSmoking === option ? colors.accent : colors.textPrimary }]}>
                    {option}
                  </Text>
                  {tempSmoking === option && <Icon name="check" size={20} color={colors.accent} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.cardGlass, borderColor: colors.border }]}
                onPress={handleCancelSmoking}
              >
                <Text style={[styles.cancelButtonText, { color: colors.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.accent }]}
                onPress={handleSaveSmoking}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Alcohol Selection Modal */}
      <Modal visible={showAlcoholModal} transparent animationType="fade">
        <TouchableOpacity 
          style={styles.dropdownOverlay} 
          activeOpacity={1} 
          onPress={handleCancelAlcohol}
        >
          <TouchableOpacity 
            activeOpacity={1} 
            onPress={(e) => e.stopPropagation()}
            style={[styles.dropdownContent, { backgroundColor: isDark ? '#182E3D' : '#E8F0EE' }]}
          >
            <Text style={[styles.dropdownTitle, { color: colors.textPrimary }]}>Select Alcohol Consumption</Text>
            <ScrollView style={styles.optionsList}>
              {alcoholOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.optionItem,
                    { 
                      backgroundColor: tempAlcohol === option ? colors.accent + '20' : colors.cardGlass,
                      borderColor: tempAlcohol === option ? colors.accent : colors.border
                    }
                  ]}
                  onPress={() => setTempAlcohol(option)}
                >
                  <Text style={[styles.optionText, { color: tempAlcohol === option ? colors.accent : colors.textPrimary }]}>
                    {option}
                  </Text>
                  {tempAlcohol === option && <Icon name="check" size={20} color={colors.accent} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.cardGlass, borderColor: colors.border }]}
                onPress={handleCancelAlcohol}
              >
                <Text style={[styles.cancelButtonText, { color: colors.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.accent }]}
                onPress={handleSaveAlcohol}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 100 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  horizontalScroll: { marginBottom: 20 },
  lifestyleCard: { 
    width: 140, 
    padding: 16, 
    borderRadius: 20, 
    borderWidth: 1, 
    marginRight: 12, 
    alignItems: 'center',
  },
  iconCircle: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  cardLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  cardValue: { fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
  stressNote: { fontSize: 10, marginTop: 4 },
  card: { 
    padding: 24, 
    borderRadius: 20, 
    marginBottom: 20, 
    borderWidth: 1,
  },
  scoreHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  cardTitle: { fontSize: 18, fontWeight: 'bold' },
  viewMore: { fontSize: 14, fontWeight: '600' },
  scoreContainer: { flexDirection: 'row', gap: 20, marginBottom: 20 },
  circularScore: { alignItems: 'center', justifyContent: 'center' },
  scoreCircle: { width: 120, height: 120, borderRadius: 60, borderWidth: 8, justifyContent: 'center', alignItems: 'center' },
  scoreValue: { fontSize: 40, fontWeight: 'bold' },
  scoreMax: { fontSize: 16 },
  metricsContainer: { flex: 1, gap: 16 },
  metricRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metricLabel: { fontSize: 13, width: 70 },
  metricBar: { flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' },
  metricFill: { height: '100%', borderRadius: 4 },
  metricValue: { fontSize: 13, fontWeight: 'bold', width: 30, textAlign: 'right' },
  messageBox: { flexDirection: 'row', padding: 16, borderRadius: 12, borderWidth: 1, gap: 12, alignItems: 'center' },
  messageText: { flex: 1, fontSize: 14, fontWeight: '600' },
  riskHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  riskSubtitle: { fontSize: 13, marginBottom: 16 },
  riskCard: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  riskRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  riskIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  riskInfo: { flex: 1 },
  riskName: { fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
  riskLevelRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  riskBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  riskBadgeText: { fontSize: 12, fontWeight: 'bold' },
  riskPercentage: { fontSize: 18, fontWeight: 'bold' },
  riskBar: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 12 },
  riskBarFill: { height: '100%', borderRadius: 4 },
  riskNote: { fontSize: 13, lineHeight: 18 },
  preventiveBox: { flexDirection: 'row', padding: 16, borderRadius: 12, borderWidth: 1, gap: 12, marginTop: 8 },
  preventiveContent: { flex: 1 },
  preventiveTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 8 },
  preventiveText: { fontSize: 13, lineHeight: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { height: '80%', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  detailCard: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  detailTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  detailText: { fontSize: 14, lineHeight: 20 },
  dropdownOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  dropdownContent: { width: '100%', maxWidth: 400, borderRadius: 24, padding: 24, maxHeight: '70%' },
  dropdownTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  optionsList: { maxHeight: 400 },
  optionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 10, borderWidth: 2 },
  optionText: { fontSize: 16, fontWeight: '600' },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 16 },
  modalButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelButton: { borderWidth: 2 },
  saveButton: {},
  cancelButtonText: { fontSize: 16, fontWeight: 'bold' },
  saveButtonText: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },
  closeButton: { marginTop: 16, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  closeButtonText: { fontSize: 16, fontWeight: 'bold' },
});

export default LifestyleTab;
