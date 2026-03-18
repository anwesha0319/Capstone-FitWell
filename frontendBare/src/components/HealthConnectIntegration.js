import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
  Image
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';
import healthConnectService from '../services/healthConnectService';

const HealthConnectIntegration = () => {
  const { colors, isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [dataTypes, setDataTypes] = useState({
    steps: true,
    heart_rate: true,
    sleep: true,
    exercise: true,
    water_intake: true,
    nutrition: false
  });

  useEffect(() => {
    loadConnectionStatus();
  }, []);

  const loadConnectionStatus = async () => {
    try {
      const status = await healthConnectService.getConnectionStatus();
      setConnectionStatus(status);
    } catch (error) {
      console.error('Error loading connection status:', error);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    try {
      const connected = await healthConnectService.connect();
      
      if (connected) {
        Alert.alert(
          'Connected Successfully',
          'Health Connect is now connected to FitWell!',
          [{ text: 'OK' }]
        );
        await loadConnectionStatus();
      }
    } catch (error) {
      Alert.alert('Connection Failed', error.message || 'Failed to connect to Health Connect');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    Alert.alert(
      'Disconnect Health Connect',
      'Are you sure you want to disconnect Health Connect? Your health data will no longer sync automatically.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await healthConnectService.disconnect();
              await loadConnectionStatus();
              Alert.alert('Disconnected', 'Health Connect has been disconnected.');
            } catch (error) {
              Alert.alert('Error', 'Failed to disconnect');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await healthConnectService.syncWithBackend();
      
      if (result.success) {
        Alert.alert(
          'Sync Complete',
          `Health data synced successfully!\n${result.data_points} data points updated.`,
          [{ text: 'OK' }]
        );
        await loadConnectionStatus();
      } else {
        Alert.alert('Sync Failed', result.error || 'Failed to sync health data');
      }
    } catch (error) {
      Alert.alert('Sync Error', error.message || 'An error occurred during sync');
    } finally {
      setSyncing(false);
    }
  };

  const toggleDataType = (type) => {
    setDataTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const DataTypeToggle = ({ type, label, icon, description }) => (
    <View style={[styles.dataTypeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.dataTypeHeader}>
        <View style={styles.dataTypeIconContainer}>
          <Icon name={icon} size={24} color={colors.accent} />
        </View>
        <View style={styles.dataTypeInfo}>
          <Text style={[styles.dataTypeLabel, { color: colors.textPrimary }]}>{label}</Text>
          <Text style={[styles.dataTypeDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Switch
          value={dataTypes[type]}
          onValueChange={() => toggleDataType(type)}
          trackColor={{ false: colors.border, true: colors.accent }}
          thumbColor={colors.card}
        />
      </View>
    </View>
  );

  if (!connectionStatus) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={[styles.headerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.headerContent}>
          <View style={[styles.logoContainer, { backgroundColor: colors.accent + '20' }]}>
            <Icon name="cellphone-android" size={40} color={colors.accent} />
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Health Connect</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Connect to sync health data from Samsung Health and other apps
            </Text>
          </View>
        </View>
        
        <View style={styles.statusContainer}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { 
              backgroundColor: connectionStatus.isConnected ? colors.success : colors.warning 
            }]} />
            <Text style={[styles.statusText, { color: colors.textPrimary }]}>
              {connectionStatus.isConnected ? 'Connected' : 'Not Connected'}
            </Text>
          </View>
          {connectionStatus.lastSync && (
            <Text style={[styles.lastSync, { color: colors.textTertiary }]}>
              Last sync: {new Date(connectionStatus.lastSync).toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>

      {/* Connection Card */}
      <View style={[styles.connectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Connection</Text>
        
        {connectionStatus.isConnected ? (
          <View style={styles.connectedState}>
            <View style={[styles.connectedBadge, { backgroundColor: colors.success + '20' }]}>
              <Icon name="check-circle" size={20} color={colors.success} />
              <Text style={[styles.connectedText, { color: colors.success }]}>Connected</Text>
            </View>
            <Text style={[styles.connectedDescription, { color: colors.textSecondary }]}>
              Your health data is syncing with FitWell
            </Text>
            
            <View style={styles.connectionButtons}>
              <TouchableOpacity
                style={[styles.syncButton, { backgroundColor: colors.accent }]}
                onPress={handleSync}
                disabled={syncing}
              >
                {syncing ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Icon name="sync" size={20} color="#FFF" />
                    <Text style={styles.syncButtonText}>Sync Now</Text>
                  </>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.disconnectButton, { backgroundColor: colors.cardGlass, borderColor: colors.border }]}
                onPress={handleDisconnect}
                disabled={loading}
              >
                <Icon name="link-off" size={20} color={colors.warning} />
                <Text style={[styles.disconnectButtonText, { color: colors.warning }]}>Disconnect</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.disconnectedState}>
            <View style={[styles.disconnectedBadge, { backgroundColor: colors.warning + '20' }]}>
              <Icon name="alert-circle" size={20} color={colors.warning} />
              <Text style={[styles.disconnectedText, { color: colors.warning }]}>Not Connected</Text>
            </View>
            <Text style={[styles.disconnectedDescription, { color: colors.textSecondary }]}>
              Connect to automatically sync your health data
            </Text>
            
            <TouchableOpacity
              style={[styles.connectButton, { backgroundColor: colors.accent }]}
              onPress={handleConnect}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Icon name="link" size={20} color="#FFF" />
                  <Text style={styles.connectButtonText}>Connect Health Connect</Text>
                </>
              )}
            </TouchableOpacity>
            
            {!connectionStatus.isAvailable && (
              <Text style={[styles.notAvailableText, { color: colors.textTertiary }]}>
                Note: Health Connect app is required on your device
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Data Types Card */}
      <View style={[styles.dataTypesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Data to Sync</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
          Choose which health data to sync with FitWell
        </Text>
        
        <View style={styles.dataTypesList}>
          <DataTypeToggle
            type="steps"
            label="Steps & Activity"
            icon="walk"
            description="Daily step count, distance, and active minutes"
          />
          
          <DataTypeToggle
            type="heart_rate"
            label="Heart Rate"
            icon="heart-pulse"
            description="Resting and exercise heart rate measurements"
          />
          
          <DataTypeToggle
            type="sleep"
            label="Sleep"
            icon="sleep"
            description="Sleep duration and quality tracking"
          />
          
          <DataTypeToggle
            type="exercise"
            label="Exercise"
            icon="run"
            description="Workout sessions and exercise data"
          />
          
          <DataTypeToggle
            type="water_intake"
            label="Water Intake"
            icon="cup-water"
            description="Daily water consumption tracking"
          />
          
          <DataTypeToggle
            type="nutrition"
            label="Nutrition"
            icon="food-apple"
            description="Calorie and nutrient intake (if available)"
          />
        </View>
      </View>

      {/* Benefits Card */}
      <View style={[styles.benefitsCard, { backgroundColor: colors.info + '10', borderColor: colors.info }]}>
        <Text style={[styles.benefitsTitle, { color: colors.textPrimary }]}>Benefits of Connecting</Text>
        
        <View style={styles.benefitsList}>
          <View style={styles.benefitItem}>
            <Icon name="chart-line" size={20} color={colors.info} />
            <Text style={[styles.benefitText, { color: colors.textSecondary }]}>
              Automatic data sync - no manual entry needed
            </Text>
          </View>
          
          <View style={styles.benefitItem}>
            <Icon name="brain" size={20} color={colors.info} />
            <Text style={[styles.benefitText, { color: colors.textSecondary }]}>
              More accurate AI recommendations
            </Text>
          </View>
          
          <View style={styles.benefitItem}>
            <Icon name="trending-up" size={20} color={colors.info} />
            <Text style={[styles.benefitText, { color: colors.textSecondary }]}>
              Better progress tracking and insights
            </Text>
          </View>
          
          <View style={styles.benefitItem}>
            <Icon name="shield-check" size={20} color={colors.info} />
            <Text style={[styles.benefitText, { color: colors.textSecondary }]}>
              Your data is secure and private
            </Text>
          </View>
        </View>
      </View>

      {/* Privacy Note */}
      <View style={[styles.privacyCard, { backgroundColor: colors.cardGlass, borderColor: colors.border }]}>
        <Icon name="shield-lock" size={24} color={colors.textTertiary} />
        <Text style={[styles.privacyText, { color: colors.textTertiary }]}>
          Your health data is encrypted and only used to provide personalized fitness insights. 
          We never share your data with third parties.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCard: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  statusContainer: {
    gap: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  lastSync: {
    fontSize: 12,
  },
  connectionCard: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  connectedState: {
    gap: 16,
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  connectedText: {
    fontSize: 14,
    fontWeight: '600',
  },
  connectedDescription: {
    fontSize: 14,
  },
  connectionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  syncButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  syncButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disconnectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  disconnectButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  disconnectedState: {
    gap: 16,
  },
  disconnectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  disconnectedText: {
    fontSize: 14,
    fontWeight: '600',
  },
  disconnectedDescription: {
    fontSize: 14,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  connectButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  notAvailableText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  dataTypesCard: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
  },
  dataTypesList: {
    gap: 12,
  },
  dataTypeCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  dataTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dataTypeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dataTypeInfo: {
    flex: 1,
  },
  dataTypeLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  dataTypeDescription: {
    fontSize: 12,
  },
  benefitsCard: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    fontSize: 14,
    flex: 1,
  },
  privacyCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 40,
  },
  privacyText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
});

export default HealthConnectIntegration;