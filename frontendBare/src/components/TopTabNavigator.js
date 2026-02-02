import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import screens
import HomeScreen from '../screens/main/HomeScreen';
import AnalyticsScreen from '../screens/main/AnalyticsScreen';
import MyProfileScreen from '../screens/main/MyProfileScreen';
import AboutFitWellScreen from '../screens/main/AboutFitWellScreen';

const { width } = Dimensions.get('window');
const Tab = createMaterialTopTabNavigator();

const TopTabNavigator = () => {
  const { colors, isDark, toggleTheme } = useTheme();

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
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={{
          tabBarScrollEnabled: true,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarLabelStyle: {
            fontSize: 15,
            fontWeight: '600',
            textTransform: 'none',
          },
          tabBarStyle: {
            backgroundColor: colors.card + '80',
            paddingTop: 50,
            paddingBottom: 12,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
          },
          tabBarIndicatorStyle: {
            backgroundColor: colors.accent,
            height: 3,
            borderRadius: 3,
          },
          tabBarItemStyle: {
            width: 'auto',
            minWidth: 100,
          },
          swipeEnabled: true, // Enable swiping between tabs
          animationEnabled: true,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarIcon: ({ color, focused }) => (
              <Icon name="home" size={focused ? 22 : 24} color={color} />
            ),
            tabBarLabel: ({ focused }) => focused ? 'Home' : '',
          }}
        />
        <Tab.Screen
          name="Analytics"
          component={AnalyticsScreen}
          options={{
            tabBarIcon: ({ color, focused }) => (
              <Icon name="chart-box" size={focused ? 22 : 24} color={color} />
            ),
            tabBarLabel: ({ focused }) => focused ? 'Statistic' : '',
          }}
        />
        <Tab.Screen
          name="Profile"
          component={MyProfileScreen}
          options={{
            tabBarIcon: ({ color, focused }) => (
              <Icon name="account" size={focused ? 22 : 24} color={color} />
            ),
            tabBarLabel: ({ focused }) => focused ? 'Profile' : '',
          }}
        />
        <Tab.Screen
          name="About"
          component={AboutFitWellScreen}
          options={{
            tabBarIcon: ({ color, focused }) => (
              <Icon name="information" size={focused ? 22 : 24} color={color} />
            ),
            tabBarLabel: ({ focused }) => focused ? 'About' : '',
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsTab}
          options={{
            tabBarIcon: ({ color }) => (
              <View style={styles.settingsIcons}>
                <TouchableOpacity onPress={toggleTheme} style={styles.iconButton}>
                  <Icon
                    name={isDark ? 'white-balance-sunny' : 'moon-waning-crescent'}
                    size={24}
                    color={colors.accent}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleLogout} style={styles.iconButton}>
                  <Icon name="logout" size={24} color={isDark ? colors.error : '#DC2626'} />
                </TouchableOpacity>
              </View>
            ),
            tabBarLabel: () => null,
          }}
        />
      </Tab.Navigator>
    </View>
  );
};

// Dummy Settings component (just shows the icons)
const SettingsTab = () => {
  const { colors } = useTheme();
  return (
    <View style={[styles.settingsContainer, { backgroundColor: colors.backgroundStart }]}>
      <Text style={[styles.settingsText, { color: colors.textPrimary }]}>
        Use the icons above to toggle theme or logout
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  settingsIcons: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  settingsText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default TopTabNavigator;
