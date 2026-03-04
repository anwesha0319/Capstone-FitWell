import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';

const DrawerMenu = ({ navigation, onClose }) => {
  const { colors, isDark, toggleTheme } = useTheme();
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUserData();
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

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
              // Force app restart by clearing everything
              if (onClose) onClose();
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  const getInitials = () => {
    if (!user) return 'U';
    const firstInitial = user.first_name?.charAt(0)?.toUpperCase() || '';
    const lastInitial = user.last_name?.charAt(0)?.toUpperCase() || '';
    return firstInitial + lastInitial || user.email?.charAt(0)?.toUpperCase() || 'U';
  };

  const menuSections = [
    {
      title: 'MY PROFILE',
      items: [
        {
          icon: 'account',
          label: 'Profile Details',
          onPress: () => Alert.alert('Profile', 'Profile screen coming soon'),
        },
      ],
    },
    {
      title: 'ANALYTICS',
      items: [
        {
          icon: 'heart-pulse',
          label: 'Heart Rate',
          onPress: () => Alert.alert('Coming Soon', 'Heart rate analysis will be available soon'),
        },
        {
          icon: 'sleep',
          label: 'Sleep Quality',
          onPress: () => Alert.alert('Coming Soon', 'Sleep analysis will be available soon'),
        },
        {
          icon: 'water',
          label: 'Blood Pressure',
          onPress: () => Alert.alert('Coming Soon', 'Blood pressure tracking coming soon'),
        },
        {
          icon: 'brain',
          label: 'Stress Level',
          onPress: () => Alert.alert('Coming Soon', 'Stress tracking coming soon'),
        },
        {
          icon: 'test-tube',
          label: 'Cholesterol',
          onPress: () => Alert.alert('Coming Soon', 'Cholesterol tracking coming soon'),
        },
      ],
    },
    {
      title: 'RECOMMENDATIONS',
      items: [
        {
          icon: 'food-apple',
          label: 'Diet Plan',
          screen: 'DietPlan',
        },
        {
          icon: 'dumbbell',
          label: 'Workout Plan',
          screen: 'WorkoutPlan',
        },
        {
          icon: 'run-fast',
          label: 'Marathon Plan',
          screen: 'MarathonPlan',
        },
      ],
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with User Info */}
      <View style={[styles.header, { backgroundColor: colors.cardSecondary, borderBottomColor: colors.border }]}>
        <View style={[styles.avatarLarge, { borderColor: colors.accent }]}>
          <Text style={[styles.avatarTextLarge, { color: colors.accent }]}>
            {getInitials()}
          </Text>
        </View>
        <Text style={[styles.userName, { color: colors.textPrimary }]}>
          {user?.first_name} {user?.last_name}
        </Text>
        <Text style={[styles.userEmail, { color: colors.textTertiary }]}>
          {user?.email}
        </Text>
      </View>

      {/* Menu Sections */}
      <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
        {menuSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
              {section.title}
            </Text>
            {section.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={itemIndex}
                style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => {
                  if (item.screen) {
                    navigation.navigate(item.screen);
                  } else if (item.onPress) {
                    item.onPress();
                  }
                  if (onClose) onClose();
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: 'transparent' }]}>
                  <Icon name={item.icon} size={20} color={colors.accent} />
                </View>
                <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>
                  {item.label}
                </Text>
                <Icon name="chevron-right" size={20} color={colors.textTertiary} />
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
            SETTINGS
          </Text>
          
          {/* Theme Toggle */}
          <View style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.iconContainer, { backgroundColor: `${colors.accent}20` }]}>
              <Icon 
                name={isDark ? 'moon-waning-crescent' : 'white-balance-sunny'} 
                size={20} 
                color={colors.accent} 
              />
            </View>
            <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>
              {isDark ? 'Dark Mode' : 'Light Mode'}
            </Text>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#ccc', true: colors.accent }}
              thumbColor={isDark ? '#fff' : '#f4f3f4'}
              ios_backgroundColor="#ccc"
            />
          </View>
        </View>

        {/* Logout Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
            ACCOUNT
          </Text>

          {/* Logout */}
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: isDark ? '#C44536' : colors.accentDark }]}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Icon name="logout" size={20} color="#fff" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarTextLarge: {
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
  },
  menuContainer: {
    flex: 1,
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 0,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 10,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default DrawerMenu;
