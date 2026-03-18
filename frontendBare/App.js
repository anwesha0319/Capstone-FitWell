import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { ThemeProvider } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import googleFitService from './src/services/googleFitService';

export default function App() {
  useEffect(() => {
    // Configure Google Sign-In on app startup
    try {
      googleFitService.configure();
    } catch (error) {
      console.error('Error configuring Google Sign-In:', error);
    }
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