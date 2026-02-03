import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { useTheme } from '../context/ThemeContext';

/**
 * GlassCard Component
 * True glassmorphism with real blur effect
 * 
 * CRITICAL: Do NOT put solid backgrounds inside this card
 * or you will destroy the glass effect!
 */
const GlassCard = ({ children, style, variant = 'primary', elevation = 'card' }) => {
  const { colors, isDark } = useTheme();

  const variants = {
    primary: {
      borderRadius: colors.radiusLarge,
      borderWidth: 2,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.75)' : 'rgba(139, 92, 246, 0.3)',
      backgroundColor: colors.card,
      shadowColor: '#FFFFFF',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.8 : 0.4,
      shadowRadius: 20,
    },
    nested: {
      borderRadius: colors.radiusNested,
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.65)' : 'rgba(139, 92, 246, 0.25)',
      backgroundColor: colors.cardGlass,
      shadowColor: '#FFFFFF',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: isDark ? 0.6 : 0.3,
      shadowRadius: 16,
    },
    strong: {
      borderRadius: colors.radiusMedium,
      borderWidth: 2,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(139, 92, 246, 0.35)',
      backgroundColor: colors.cardStrong,
      shadowColor: '#FFFFFF',
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: isDark ? 0.9 : 0.5,
      shadowRadius: 24,
    },
  };

  const elevations = {
    card: colors.shadowCard,
    button: colors.shadowButton,
    subtle: colors.shadowLight,
  };

  const variantStyle = variants[variant] || variants.primary;
  const elevationStyle = elevations[elevation] || elevations.card;

  // For Android, use a more opaque background since BlurView might not work
  if (Platform.OS === 'android') {
    const androidVariants = {
      primary: {
        ...variantStyle,
        backgroundColor: isDark ? 'rgba(60, 50, 90, 0.85)' : 'rgba(255, 255, 255, 0.25)',
        elevation: 16,
      },
      nested: {
        ...variantStyle,
        backgroundColor: isDark ? 'rgba(60, 50, 90, 0.75)' : 'rgba(255, 255, 255, 0.18)',
        elevation: 12,
      },
      strong: {
        ...variantStyle,
        backgroundColor: isDark ? 'rgba(60, 50, 90, 0.92)' : 'rgba(255, 255, 255, 0.35)',
        elevation: 18,
      },
    };
    
    return (
      <BlurView
        style={[
          styles.card,
          androidVariants[variant] || androidVariants.primary,
          style,
        ]}
        blurType={isDark ? 'dark' : 'light'}
        blurAmount={15}
        reducedTransparencyFallbackColor={isDark ? 'rgba(60, 50, 90, 0.85)' : 'rgba(255, 255, 255, 0.25)'}
      >
        {children}
      </BlurView>
    );
  }

  // iOS gets the full blur effect
  return (
    <BlurView
      style={[
        styles.card,
        variantStyle,
        style,
      ]}
      blurType={isDark ? 'dark' : 'light'}
      blurAmount={20}
      reducedTransparencyFallbackColor={isDark ? 'rgba(60, 50, 90, 0.80)' : 'rgba(255, 255, 255, 0.25)'}
    >
      {children}
    </BlurView>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 20,
    overflow: 'hidden',
  },
});

export default GlassCard;
