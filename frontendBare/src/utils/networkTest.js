/**
 * Network Test Utility
 * Helps diagnose backend connectivity issues
 */

import { Alert } from 'react-native';
import { API_BASE_URL } from '../config';

export const testBackendConnection = async () => {
  try {
    const testUrl = API_BASE_URL.replace('/api', '');
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 5000, // 5 second timeout
    });
    
    if (response.ok) {
      return {
        success: true,
        message: `✅ Backend is running at ${API_BASE_URL}`,
        status: response.status,
      };
    } else {
      return {
        success: false,
        message: `⚠️ Backend responded with status ${response.status} at ${API_BASE_URL}`,
        status: response.status,
      };
    }
  } catch (error) {
    let errorMessage = '❌ Cannot connect to backend.\n\n';
    
    if (error.message.includes('Network request failed')) {
      errorMessage += 'Network request failed. Possible issues:\n';
      errorMessage += '1. Backend server not running\n';
      errorMessage += '2. Wrong IP address\n';
      errorMessage += '3. Firewall blocking port 8000\n';
      errorMessage += '4. Devices not on same network\n\n';
      errorMessage += `Trying to connect to: ${API_BASE_URL}\n\n`;
      errorMessage += 'To fix:\n';
      errorMessage += '1. Run backend: cd backend && python manage.py runserver 0.0.0.0:8000\n';
      errorMessage += '2. Find your IP: ipconfig (Windows) or ifconfig (Mac/Linux)\n';
      errorMessage += '3. Update config.js with correct IP\n';
    } else if (error.message.includes('timeout')) {
      errorMessage += 'Connection timeout. Server might be slow or unresponsive.';
    } else {
      errorMessage += `Error: ${error.message}`;
    }
    
    return {
      success: false,
      message: errorMessage,
      error: error.message,
    };
  }
};

export const getNetworkInfo = () => {
  return {
    apiBaseUrl: API_BASE_URL,
    backendIp: API_BASE_URL.split('://')[1].split(':')[0],
    backendPort: API_BASE_URL.split(':')[2].split('/')[0],
    timestamp: new Date().toISOString(),
  };
};

export const showNetworkTestDialog = async () => {
  const result = await testBackendConnection();
  const networkInfo = getNetworkInfo();
  
  const message = `${result.message}\n\nCurrent Configuration:\n`;
  const info = `IP: ${networkInfo.backendIp}\nPort: ${networkInfo.backendPort}\nURL: ${networkInfo.apiBaseUrl}`;
  
  Alert.alert(
    'Network Test Result',
    `${message}\n${info}`,
    [
      { text: 'OK' },
      { 
        text: 'Change IP', 
        onPress: () => {
          // This would ideally open a settings screen
          Alert.alert('Info', 'Edit frontendBare/src/config.js to change IP address');
        }
      }
    ]
  );
  
  return result;
};