import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import googleFitService from '../services/googleFitService';
import { healthAPI } from '../api/endpoints';

const GoogleFitSync = ({ onSyncComplete }) => {
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, success, error
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    initializeGoogleFit();
  }, []);

  const initializeGoogleFit = async () => {
    try {
      // Check if already signed in
      const signedIn = await googleFitService.isSignedIn();
      setIsSignedIn(signedIn);

      if (signedIn) {
        const user = await googleFitService.getCurrentUser();
        if (user && user.user && user.user.email) {
          setUserEmail(user.user.email);
        }
      }
    } catch (error) {
      console.error('Failed to initialize Google Fit:', error);
    }
  };

  const handleSignIn = async () => {
    try {
      setSyncing(true);
      setSyncStatus('syncing');

      // Sign in with Google
      const result = await googleFitService.signIn();

      if (result.success) {
        setIsSignedIn(true);
        const email = result.userInfo?.user?.email || result.userInfo?.email || 'Unknown';
        setUserEmail(email);
        
        Alert.alert(
          'Success!',
          `Signed in as ${email}. Now you can sync your fitness data.`,
          [{ text: 'OK' }]
        );
        
        setSyncStatus('success');
        setTimeout(() => setSyncStatus('idle'), 2000);
      }
    } catch (error) {
      console.error('Sign-in error:', error);
      setSyncStatus('error');
      
      Alert.alert(
        'Sign-In Failed',
        error.message || 'Failed to sign in with Google. Please try again.',
        [{ text: 'OK' }]
      );
      
      setTimeout(() => setSyncStatus('idle'), 2000);
    } finally {
      setSyncing(false);
    }
  };

  const handleSignOut = async () => {
    try {
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out from Google Fit?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign Out',
            style: 'destructive',
            onPress: async () => {
              await googleFitService.signOut();
              setIsSignedIn(false);
              setUserEmail('');
              Alert.alert('Success', 'Signed out successfully');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Sign-out error:', error);
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  const handleSyncPress = async () => {
    if (!isSignedIn) {
      Alert.alert(
        'Not Signed In',
        'Please sign in with Google first to sync your fitness data.',
        [{ text: 'OK' }]
      );
      return;
    }

    setSyncing(true);
    setSyncStatus('syncing');

    try {
      console.log('Fetching Google Fit data...');
      
      // Fetch fitness data from Google Fit
      const fitnessData = await googleFitService.getAllFitnessData(7);

      // Check if we got any data
      if (!fitnessData || !fitnessData.health_data || fitnessData.health_data.length === 0) {
        Alert.alert(
          'No Data Found',
          'No fitness data found in Google Fit for the last 7 days.\n\nMake sure:\n• Your smartwatch is connected to Google Fit\n• Data has synced from your watch to Google Fit\n• You have granted all fitness permissions',
          [{ text: 'OK' }]
        );
        setSyncStatus('idle');
        setSyncing(false);
        return;
      }

      console.log('Syncing to backend...');
      
      // Sync to backend
      await healthAPI.syncHealthData(fitnessData);

      setSyncStatus('success');
      
      // Get today's date
      const today = new Date().toISOString().split('T')[0];
      const todayData = fitnessData.health_data.find(d => d.date === today);
      
      let message = `Successfully synced ${fitnessData.health_data.length} days of fitness data!`;
      
      if (todayData) {
        message += `\n\nToday's Data:\n• Steps: ${todayData.steps.toLocaleString()}\n• Calories: ${todayData.calories_burned}\n• Distance: ${todayData.distance.toFixed(2)} km\n• Active Minutes: ${todayData.active_minutes}`;
      } else {
        message += `\n\n⚠️ Note: Today's data not yet available. Data may take time to sync from your smartwatch.`;
      }
      
      Alert.alert('Sync Complete!', message, [{ text: 'OK' }]);

      // Notify parent component
      if (onSyncComplete) {
        onSyncComplete();
      }

      // Reset status after 2 seconds
      setTimeout(() => {
        setSyncStatus('idle');
      }, 2000);

    } catch (error) {
      console.error('Sync error:', error);
      setSyncStatus('error');
      
      let errorMessage = 'Failed to sync Google Fit data.';
      
      if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
        errorMessage = 'Session expired. Please sign in again.';
        setIsSignedIn(false);
        setUserEmail('');
      } else if (error.message?.includes('network') || error.message?.includes('Network')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Sync Failed', errorMessage, [{ text: 'OK' }]);

      setTimeout(() => {
        setSyncStatus('idle');
      }, 2000);
    } finally {
      setSyncing(false);
    }
  };

  const getStatusIcon = () => {
    switch (syncStatus) {
      case 'syncing':
        return <ActivityIndicator size={20} color="#fff" />;
      case 'success':
        return <Icon name="check-circle" size={20} color="#fff" />;
      case 'error':
        return <Icon name="alert-circle" size={20} color="#fff" />;
      default:
        return <Icon name="google" size={20} color="#fff" />;
    }
  };

  const getStatusText = () => {
    if (!isSignedIn) {
      return 'Sign in with Google';
    }
    
    switch (syncStatus) {
      case 'syncing':
        return 'Syncing Google Fit...';
      case 'success':
        return 'Synced Successfully!';
      case 'error':
        return 'Sync Failed';
      default:
        return 'Sync Google Fit Data';
    }
  };

  const getButtonColor = () => {
    if (!isSignedIn) {
      return '#DB4437'; // Google red
    }
    
    switch (syncStatus) {
      case 'success':
        return '#4CAF50';
      case 'error':
        return '#FF3B30';
      default:
        return '#4285F4'; // Google blue
    }
  };

  return (
    <View style={styles.container}>
      {/* Main Action Button */}
      <TouchableOpacity
        style={[styles.syncButton, { backgroundColor: getButtonColor() }]}
        onPress={isSignedIn ? handleSyncPress : handleSignIn}
        disabled={syncing}>
        {getStatusIcon()}
        <Text style={styles.syncButtonText}>{getStatusText()}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
    marginBottom: 20,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#4285F4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  userInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(66, 133, 244, 0.1)',
    borderRadius: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  userEmail: {
    fontSize: 13,
    color: '#4285F4',
    fontWeight: '500',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 6,
  },
  signOutText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#888',
    lineHeight: 18,
  },
  featuresList: {
    padding: 12,
    backgroundColor: 'rgba(66, 133, 244, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(66, 133, 244, 0.2)',
  },
  featuresTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4285F4',
    marginBottom: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  featureText: {
    fontSize: 12,
    color: '#666',
  },
});

export default GoogleFitSync;
