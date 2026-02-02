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
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.card,
    },
    nested: {
      borderRadius: colors.radiusNested,
      borderWidth: 1,
      borderColor: colors.cardBorderInner,
      backgroundColor: colors.cardGlass,
    },
    strong: {
      borderRadius: colors.radiusMedium,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.cardStrong,
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
        backgroundColor: isDark ? 'rgba(60, 50, 90, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      },
      nested: {
        ...variantStyle,
        backgroundColor: isDark ? 'rgba(60, 50, 90, 0.85)' : 'rgba(255, 255, 255, 0.85)',
      },
      strong: {
        ...variantStyle,
        backgroundColor: isDark ? 'rgba(60, 50, 90, 0.98)' : 'rgba(255, 255, 255, 0.98)',
      },
    };
    
    return (
      <BlurView
        style={[
          styles.card,
          androidVariants[variant] || androidVariants.primary,
          elevationStyle,
          style,
        ]}
        blurType={isDark ? 'dark' : 'light'}
        blurAmount={10}
        reducedTransparencyFallbackColor={isDark ? 'rgba(60, 50, 90, 0.95)' : 'rgba(255, 255, 255, 0.95)'}
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
        elevationStyle,
        style,
      ]}
      blurType={isDark ? 'dark' : 'light'}
      blurAmount={colors.blurAmount}
      reducedTransparencyFallbackColor={isDark ? 'rgba(60, 50, 90, 0.90)' : 'rgba(255, 255, 255, 0.85)'}
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
