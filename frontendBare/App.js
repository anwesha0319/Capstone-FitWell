import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { ThemeProvider } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import googleFitService from './src/services/googleFitService';
import { initializeNotifications } from './src/services/notificationService';

export default function App() {
  useEffect(() => {
    // Configure Google Sign-In on app startup
    try {
      googleFitService.configure();
    } catch (error) {
      console.error('Failed to configure Google Sign-In:', error);
    }
    
    // Initialize notifications
    initializeNotifications();
  }, []);

  return (
    <ThemeProvider>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent={true}
      />
      <AppNavigator />
    </ThemeProvider>
  );
}