import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'react-native-linear-gradient';
import GlassCard from '../../components/GlassCard';
import { useTheme } from '../../context/ThemeContext';
import { getTypographyStyle } from '../../utils/styleHelpers';
import BodyMetricsTab from './analytics/BodyMetricsTab';
import VitalsTab from './analytics/VitalsTab';
import LifestyleTab from './analytics/LifestyleTab';
import SleepTab from './analytics/SleepTab';
import NutritionTab from './analytics/NutritionTab';
import ActivityTab from './analytics/ActivityTab';

const AnalyticsScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('Body Metrics');

  const tabs = [
    { name: 'Body Metrics', icon: 'human-male-height' },
    { name: 'Vitals', icon: 'heart-pulse' },
    { name: 'Lifestyle', icon: 'account-heart' },
    { name: 'Sleep', icon: 'sleep' },
    { name: 'Nutrition', icon: 'food-apple' },
    { name: 'Activity', icon: 'run' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'Body Metrics': return <BodyMetricsTab />;
      case 'Vitals': return <VitalsTab />;
      case 'Lifestyle': return <LifestyleTab />;
      case 'Sleep': return <SleepTab />;
      case 'Nutrition': return <NutritionTab navigation={navigation} />;
      case 'Activity': return <ActivityTab navigation={navigation} />;
      default: return <BodyMetricsTab />;
    }
  };

  return (
    <LinearGradient
      colors={isDark ? [colors.backgroundStart, colors.backgroundMid, colors.backgroundEnd] : [colors.backgroundStart, colors.backgroundMid, colors.backgroundEnd]}
      style={styles.container}
    >
      <View style={styles.innerContainer}>
        <View style={styles.header}>
          <Text style={getTypographyStyle(colors, 'h1')}>Analytics</Text>
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.tabBar} 
          contentContainerStyle={styles.tabContent}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.name;
            return (
              <TouchableOpacity 
                key={tab.name} 
                onPress={() => setActiveTab(tab.name)}
              >
                <View
                  style={[
                    styles.tab,
                    {
                      backgroundColor: isActive 
                        ? (isDark ? colors.accent : colors.accent)
                        : (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.5)'),
                      borderColor: isActive ? colors.accent : 'transparent',
                      borderWidth: isActive ? 2 : 1,
                      borderRadius: 20,
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }
                  ]}
                >
                  <Icon 
                    name={tab.icon} 
                    size={20} 
                    color={isActive ? '#FFFFFF' : (isDark ? '#FFFFFF' : colors.textPrimary)} 
                  />
                  <Text style={[
                    {
                      marginLeft: 8,
                      fontSize: 14,
                      fontWeight: isActive ? '600' : '500',
                      color: isActive ? '#FFFFFF' : (isDark ? '#FFFFFF' : colors.textPrimary)
                    }
                  ]}>
                    {tab.name}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        
        <View style={styles.content}>{renderContent()}</View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
  },
  header: { 
    paddingHorizontal: 20, 
    paddingTop: 50, 
    paddingBottom: 10 
  },
  tabBar: { 
    maxHeight: 70 
  },
  tabContent: { 
    paddingHorizontal: 20, 
    paddingVertical: 10, 
    gap: 10 
  },
  tab: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
  },
  content: { 
    flex: 1 
  },
});

export default AnalyticsScreen;
