import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'react-native-linear-gradient';
import { useTheme } from '../../context/ThemeContext';

const AboutFitWellScreen = () => {
  const { colors, isDark } = useTheme();

  const openLink = (url) => {
    Linking.openURL(url).catch((err) => console.error('Failed to open URL:', err));
  };

  return (
    <LinearGradient
      colors={isDark ? [colors.backgroundStart, colors.backgroundMid, colors.backgroundEnd] : [colors.backgroundStart, colors.backgroundMid, colors.backgroundEnd]}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/images/fitwell_logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={[styles.appName, { color: colors.textPrimary }]}>FitWell</Text>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>
            Track your progress, stay on top of your health
          </Text>
        </View>

        <Text style={[styles.mainTitle, { color: colors.textPrimary }]}>About FitWell</Text>

        {/* App Description */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardText, { color: colors.textSecondary }]}>
            FitWell is your comprehensive health and fitness tracking application designed to help you
            achieve your wellness goals. Track your daily activities, monitor vital health metrics, and
            receive personalized recommendations powered by advanced AI technology.
          </Text>
        </View>

        {/* Why Choose Us */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Why Choose Us</Text>
        
        <View style={styles.whyChooseGrid}>
          <View style={[styles.whyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.whyIcon, { backgroundColor: colors.success + '30' }]}>
              <Icon name="chart-line" size={28} color={colors.success} />
            </View>
            <Text style={[styles.whyTitle, { color: colors.textPrimary }]}>
              Comprehensive Tracking
            </Text>
          </View>

          <View style={[styles.whyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.whyIcon, { backgroundColor: colors.purple + '30' }]}>
              <Icon name="brain" size={28} color={colors.purple} />
            </View>
            <Text style={[styles.whyTitle, { color: colors.textPrimary }]}>
              AI-Powered Insights
            </Text>
          </View>

          <View style={[styles.whyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.whyIcon, { backgroundColor: colors.warning + '30' }]}>
              <Icon name="target" size={28} color={colors.warning} />
            </View>
            <Text style={[styles.whyTitle, { color: colors.textPrimary }]}>
              Goal Achievement
            </Text>
          </View>

          <View style={[styles.whyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.whyIcon, { backgroundColor: colors.accent + '30' }]}>
              <Icon name="shield-check" size={28} color={colors.accent} />
            </View>
            <Text style={[styles.whyTitle, { color: colors.textPrimary }]}>
              Privacy & Security
            </Text>
          </View>
        </View>

        {/* Privacy Statement */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Privacy Statement</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.privacyTitle, { color: colors.textPrimary }]}>
            Your Data, Your Control
          </Text>
          <Text style={[styles.cardText, { color: colors.textSecondary }]}>
            At FitWell, we take your privacy seriously. All your health and fitness data is encrypted 
            and stored securely on your device and our protected servers. We never sell, rent, or share 
            your personal information with third parties.
          </Text>

          <Text style={[styles.privacyTitle, { color: colors.textPrimary, marginTop: 16 }]}>
            What We Collect
          </Text>
          <Text style={[styles.cardText, { color: colors.textSecondary }]}>
            We only collect the health metrics you choose to share: activity data, vital signs, 
            nutrition information, and fitness goals. This data is used solely to provide you with 
            personalized insights and recommendations.
          </Text>

          <Text style={[styles.privacyTitle, { color: colors.textPrimary, marginTop: 16 }]}>
            Your Rights
          </Text>
          <Text style={[styles.cardText, { color: colors.textSecondary }]}>
            You have complete control over your data. You can view, modify, export, or delete your 
            information at any time. Contact our support team for assistance with data-related requests.
          </Text>
        </View>

        {/* Contact & Support */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Contact & Support</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity
            style={styles.contactRow}
            onPress={() => openLink('tel:+912345678900')}
          >
            <Icon name="phone" size={24} color={colors.accent} />
            <Text style={[styles.contactText, { color: colors.textPrimary }]}>
              +91 2345678900
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactRow}
            onPress={() => openLink('mailto:support@fitwell.com')}
          >
            <Icon name="email" size={24} color={colors.accent} />
            <Text style={[styles.contactText, { color: colors.textPrimary }]}>
              support@fitwell.com
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactRow}
            onPress={() => openLink('https://instagram.com/fitwell')}
          >
            <Icon name="instagram" size={24} color={colors.accent} />
            <Text style={[styles.contactText, { color: colors.textPrimary }]}>
              @fitwell
            </Text>
          </TouchableOpacity>
        </View>

        {/* Version */}
        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: colors.textTertiary }]}>
            FitWell Version 1.0.0
          </Text>
          <Text style={[styles.versionText, { color: colors.textTertiary }]}>
            Build 2026.02.01
          </Text>
        </View>

        {/* Copyright */}
        <Text style={[styles.copyright, { color: colors.textTertiary }]}>
          © 2026 FitWell. All rights reserved.
        </Text>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 16,
  },
  card: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
  },
  cardText: {
    fontSize: 15,
    lineHeight: 22,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  contactText: {
    fontSize: 16,
    marginLeft: 16,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  versionText: {
    fontSize: 13,
    marginBottom: 4,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoImage: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    textAlign: 'center',
  },
  whyChooseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  whyCard: {
    width: '48%',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  whyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  whyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  copyright: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  bottomSpace: {
    height: 20,
  },
});

export default AboutFitWellScreen;
