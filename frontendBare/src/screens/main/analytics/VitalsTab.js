import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LineChart } from 'react-native-chart-kit';
import { useTheme } from '../../../context/ThemeContext';
import { saveHealthData } from '../../../utils/storage';
import { useEffect, useState } from 'react';
import { getHealthData as apiGetHealthData } from '../../../api/client';

const { width } = Dimensions.get('window');

const VitalsTab = () => {
  const { colors, isDark } = useTheme();
  
  const [bpData, setBpData] = useState([]);
  const [vitalsRealtime, setVitalsRealtime] = useState(null);
  const [dataError, setDataError] = useState(null);

  useEffect(() => {
    const loadVitals = async () => {
      try {
        const result = await apiGetHealthData(7);
        if (result && Array.isArray(result) && result.length > 0) {
          // Filter out entries with no BP data
          const validBpData = result.filter(r => (r.systolic || r.bp_sys) && (r.diastolic || r.bp_dia));
          
          if (validBpData.length > 0) {
            const mapped = validBpData.map(r => ({ 
              day: r.date ? new Date(r.date).toLocaleDateString('en-US',{weekday:'short'}) : '', 
              sys: r.systolic || r.bp_sys || 0, 
              dia: r.diastolic || r.bp_dia || 0 
            }));
            setBpData(mapped);
          } else {
            setBpData([]);
          }
          
          const latest = result[0];
          setVitalsRealtime({ 
            heartRate: latest.heart_rate || null, 
            spO2: latest.spo2 || null, 
            cholesterol: latest.cholesterol || null, 
            temperature: latest.temperature || null 
          });

          // Optionally persist latest BP
          if ((latest.systolic || latest.bp_sys) && (latest.diastolic || latest.bp_dia)) {
            await saveHealthData({ 
              bloodPressure: { 
                systolic: latest.systolic || latest.bp_sys, 
                diastolic: latest.diastolic || latest.bp_dia, 
                timestamp: latest.date || new Date().toISOString() 
              } 
            });
          }
        } else {
          setBpData([]);
        }
      } catch (err) {
        console.warn('VitalsTab - getHealthData error', err?.message || err);
        setDataError(err);
        setBpData([]);
      }
    };
    loadVitals();
  }, []);


  // Vitals data array for grid layout
  const vitalsData = [
    { icon: 'heart-pulse', label: 'Heart Rate', value: vitalsRealtime?.heartRate ? String(vitalsRealtime.heartRate) : '0', unit: 'bpm', status: vitalsRealtime?.heartRate ? 'Measured' : 'No data', color: colors.error },
    { icon: 'water', label: 'Blood Pressure', value: bpData && bpData.length > 0 ? `${bpData[0].sys}/${bpData[0].dia}` : '0/0', unit: 'mmHg', status: bpData && bpData.length > 0 ? 'Measured' : 'No data', color: colors.purple },
    { icon: 'lungs', label: 'SpO2', value: vitalsRealtime?.spO2 ? String(vitalsRealtime.spO2) : '0', unit: '%', status: vitalsRealtime?.spO2 ? 'Measured' : 'No data', color: colors.accent },
    { icon: 'molecule', label: 'Cholesterol', value: vitalsRealtime?.cholesterol ? String(vitalsRealtime.cholesterol) : '0', unit: 'mg/dL', status: vitalsRealtime?.cholesterol ? 'Measured' : 'No data', color: colors.warning },
    { icon: 'thermometer', label: 'Temperature', value: vitalsRealtime?.temperature ? String(vitalsRealtime.temperature) : '0', unit: '°C', status: vitalsRealtime?.temperature ? 'Measured' : 'No data', color: colors.orange },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Vitals</Text>
      {dataError && (
        <View style={{ paddingHorizontal: 6, marginBottom: 12 }}>
          <Text style={{ color: colors.error, fontSize: 13 }}>* Unable to load vitals (Network Error). Showing zeros where data is missing.</Text>
        </View>
      )}

      {/* Vertical Grid - 2 columns */}
      <View style={styles.vitalsGrid}>
        {vitalsData.map((vital, index) => (
          <View key={index} style={[styles.vitalCard, { backgroundColor: colors.cardGlass, borderColor: colors.border }]}>
            <View style={[styles.iconCircle, { backgroundColor: vital.color + '20' }]}>
              <Icon name={vital.icon} size={28} color={vital.color} />
            </View>
            <Text style={[styles.vitalValue, { color: colors.textPrimary }]}>{vital.value}</Text>
            <Text style={[styles.vitalLabel, { color: colors.textSecondary }]}>{vital.label}</Text>
            <Text style={[styles.vitalUnit, { color: colors.textTertiary }]}>{vital.unit}</Text>
            <View style={[styles.statusBadge, { backgroundColor: colors.success + '20' }]}>
              <Text style={[styles.statusText, { color: colors.success }]}>{vital.status}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Blood Pressure History */}
      {bpData && bpData.length > 0 ? (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Blood Pressure History</Text>
          <View style={[styles.infoBox, { backgroundColor: colors.accent + '10', borderColor: colors.accent }]}>
            <Icon name="information" size={20} color={colors.accent} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                <Text style={{ fontWeight: 'bold' }}>Systolic</Text> (top number): Pressure when heart beats{'\n'}
                <Text style={{ fontWeight: 'bold' }}>Diastolic</Text> (bottom number): Pressure when heart rests
              </Text>
            </View>
          </View>
          <View style={styles.bpLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.purple }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>Systolic</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>Diastolic</Text>
            </View>
          </View>
          
          <View style={styles.chartWithLabel}>
            {/* Y-axis label positioned on left */}
            <View style={styles.yAxisLabelContainer}>
              <Text style={[styles.yAxisLabel, { color: colors.textSecondary }]}>mmHg</Text>
            </View>
            
            <LineChart
            data={{
              labels: bpData.map(d => d.day),
              datasets: [
                { data: bpData.map(d => d.sys), color: (opacity = 1) => `rgba(155, 89, 182, ${opacity})`, strokeWidth: 2 },
                { data: bpData.map(d => d.dia), color: (opacity = 1) => isDark ? `rgba(61, 214, 198, ${opacity})` : `rgba(47, 79, 74, ${opacity})`, strokeWidth: 2 }
              ],
              legend: ['Systolic', 'Diastolic']
            }}
            width={width - 80}
            height={220}
            chartConfig={{
              backgroundColor: 'transparent',
              backgroundGradientFrom: colors.card,
              backgroundGradientTo: colors.card,
              decimalPlaces: 0,
              color: (opacity = 1) => isDark ? `rgba(230, 241, 239, ${opacity})` : `rgba(30, 42, 40, ${opacity})`,
              labelColor: () => isDark ? '#E6F1EF' : '#1E2A28',
              style: { borderRadius: 16 },
              propsForDots: { r: '4' },
              propsForBackgroundLines: {
                strokeDasharray: '',
                stroke: isDark ? 'rgba(230, 241, 239, 0.1)' : 'rgba(30, 42, 40, 0.1)',
              }
            }}
            bezier
            style={{ marginVertical: 8, borderRadius: 16 }}
            />
          </View>
        </View>
      ) : (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Blood Pressure History</Text>
          <View style={[styles.noDataBox, { backgroundColor: colors.info + '10', borderColor: colors.info }]}>
            <Icon name="chart-line-variant" size={48} color={colors.textTertiary} />
            <Text style={[styles.noDataText, { color: colors.textSecondary }]}>No blood pressure data available yet</Text>
            <Text style={[styles.noDataSubtext, { color: colors.textTertiary }]}>Connect Health Connect to sync your vitals automatically</Text>
          </View>
        </View>
      )}

      {/* Abnormalities Alert */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.alertHeader}>
          <View style={[styles.iconCircle, { backgroundColor: colors.success + '20' }]}>
            <Icon name="alert-circle" size={24} color={colors.success} />
          </View>
          <Text style={[styles.cardTitle, { color: colors.textPrimary, marginBottom: 0 }]}>Abnormalities</Text>
        </View>
        <View style={[styles.alertBox, { backgroundColor: colors.success + '10', borderColor: colors.success }]}>
          <Icon name="check-circle" size={20} color={colors.success} />
          <Text style={[styles.alertText, { color: colors.textPrimary }]}>No abnormalities detected. All vitals are within normal range.</Text>
        </View>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 100 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  vitalsGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  vitalCard: { 
    width: '48%',
    padding: 16, 
    borderRadius: 16, 
    borderWidth: 1, 
    marginBottom: 12, 
    alignItems: 'center',
  },
  iconCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  vitalValue: { fontSize: 24, fontWeight: 'bold', marginBottom: 2 },
  vitalLabel: { fontSize: 12, fontWeight: '600', marginBottom: 2 },
  vitalUnit: { fontSize: 11, marginBottom: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '600' },
  card: { 
    padding: 24, 
    borderRadius: 20, 
    marginBottom: 20, 
    borderWidth: 1,
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  infoBox: { flexDirection: 'row', padding: 12, borderRadius: 12, borderWidth: 1, gap: 10, marginBottom: 16 },
  infoContent: { flex: 1 },
  infoText: { fontSize: 13, lineHeight: 18 },
  bpLegend: { flexDirection: 'row', gap: 20, marginBottom: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { fontSize: 13 },
  chartWithLabel: { flexDirection: 'row', alignItems: 'center' },
  yAxisLabelContainer: { 
    position: 'absolute', 
    left: -10, 
    top: 80,
    transform: [{ rotate: '-90deg' }],
    zIndex: 10,
  },
  yAxisLabel: { fontSize: 11, fontWeight: '600' },
  alertHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  alertBox: { flexDirection: 'row', padding: 16, borderRadius: 12, borderWidth: 1, gap: 12 },
  alertText: { flex: 1, fontSize: 14 },
  noDataBox: { 
    padding: 24, 
    borderRadius: 16, 
    borderWidth: 1, 
    alignItems: 'center', 
    gap: 12 
  },
  noDataText: { 
    fontSize: 16, 
    fontWeight: '600', 
    textAlign: 'center' 
  },
  noDataSubtext: { 
    fontSize: 13, 
    textAlign: 'center' 
  },
});

export default VitalsTab;
