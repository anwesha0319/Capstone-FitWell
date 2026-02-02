import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

/**
 * GradientBackground Component
 * Multi-layered gradient with distinct color patches
 * Creates beautiful, organic color transitions with pink, purple, white, and blue patches
 */
const GradientBackground = ({ children, style }) => {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.wrapper, style]}>
      {/* Background Layer - Absolute positioned */}
      <View style={styles.backgroundContainer}>
        {/* Base Gradient Layer */}
        <LinearGradient
          colors={isDark 
            ? ['#1A1625', '#1E2235', '#1A2832', '#221A2E']
            : ['#F8E8FF', '#E8D5FF', '#D5B8FF', '#E8D5FF']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {isDark ? (
          // Dark Mode Patches
          <>
            {/* Purple patch - Top left */}
            <LinearGradient
              colors={['rgba(167, 139, 250, 0.3)', 'transparent']}
              style={[styles.patch, styles.topLeft]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              pointerEvents="none"
            />

            {/* Pink patch - Top right */}
            <LinearGradient
              colors={['transparent', 'rgba(255, 184, 232, 0.2)', 'transparent']}
              style={[styles.patch, styles.topRight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              pointerEvents="none"
            />

            {/* Blue patch - Middle left */}
            <LinearGradient
              colors={['rgba(168, 216, 255, 0.15)', 'transparent']}
              style={[styles.patch, styles.middleLeft]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              pointerEvents="none"
            />

            {/* Lavender patch - Center */}
            <LinearGradient
              colors={['transparent', 'rgba(212, 197, 255, 0.25)', 'transparent']}
              style={[styles.patch, styles.center]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              pointerEvents="none"
            />

            {/* Mint patch - Bottom left */}
            <LinearGradient
              colors={['rgba(168, 245, 208, 0.12)', 'transparent']}
              style={[styles.patch, styles.bottomLeft]}
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 0 }}
              pointerEvents="none"
            />

            {/* Purple-pink patch - Bottom right */}
            <LinearGradient
              colors={['transparent', 'rgba(196, 181, 253, 0.2)']}
              style={[styles.patch, styles.bottomRight]}
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 0 }}
              pointerEvents="none"
            />
          </>
        ) : (
          // Light Mode Patches - More vibrant and distinct
          <>
            {/* Pink patch - Top left */}
            <LinearGradient
              colors={['rgba(251, 207, 232, 0.6)', 'transparent']}
              style={[styles.patch, styles.topLeft]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              pointerEvents="none"
            />

            {/* White-pink patch - Top center */}
            <LinearGradient
              colors={['transparent', 'rgba(255, 255, 255, 0.5)', 'transparent']}
              style={[styles.patch, styles.topCenter]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              pointerEvents="none"
            />

            {/* Purple patch - Top right */}
            <LinearGradient
              colors={['transparent', 'rgba(196, 181, 253, 0.7)', 'transparent']}
              style={[styles.patch, styles.topRight]}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 1 }}
              pointerEvents="none"
            />

            {/* Blue patch - Middle left */}
            <LinearGradient
              colors={['rgba(186, 230, 253, 0.5)', 'transparent']}
              style={[styles.patch, styles.middleLeft]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              pointerEvents="none"
            />

            {/* Lavender patch - Center */}
            <LinearGradient
              colors={['transparent', 'rgba(167, 139, 250, 0.3)', 'transparent']}
              style={[styles.patch, styles.center]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              pointerEvents="none"
            />

            {/* Pink-white patch - Middle right */}
            <LinearGradient
              colors={['transparent', 'rgba(251, 207, 232, 0.4)']}
              style={[styles.patch, styles.middleRight]}
              start={{ x: 1, y: 0.5 }}
              end={{ x: 0, y: 0.5 }}
              pointerEvents="none"
            />

            {/* Mint patch - Bottom left */}
            <LinearGradient
              colors={['rgba(167, 243, 208, 0.3)', 'transparent']}
              style={[styles.patch, styles.bottomLeft]}
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 0 }}
              pointerEvents="none"
            />

            {/* Sky blue patch - Bottom center */}
            <LinearGradient
              colors={['transparent', 'rgba(186, 230, 253, 0.5)', 'transparent']}
              style={[styles.patch, styles.bottomCenter]}
              start={{ x: 0.5, y: 1 }}
              end={{ x: 0.5, y: 0 }}
              pointerEvents="none"
            />

            {/* Purple-pink patch - Bottom right */}
            <LinearGradient
              colors={['transparent', 'rgba(196, 181, 253, 0.6)']}
              style={[styles.patch, styles.bottomRight]}
              start={{ x: 1, y: 1 }}
              end={{ x: 0, y: 0 }}
              pointerEvents="none"
            />

            {/* White overlay - Soft glow effect */}
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.3)', 'transparent', 'rgba(255, 255, 255, 0.2)']}
              locations={[0, 0.5, 1]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              pointerEvents="none"
            />
          </>
        )}
      </View>

      {/* Content */}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: width,
    height: height,
  },
  // Patch base style
  patch: {
    position: 'absolute',
    width: width * 0.8,
    height: height * 0.5,
  },
  // Patch positions
  topLeft: {
    top: -height * 0.1,
    left: -width * 0.2,
    width: width * 0.9,
    height: height * 0.4,
  },
  topCenter: {
    top: -height * 0.05,
    left: width * 0.2,
    width: width * 0.6,
    height: height * 0.35,
  },
  topRight: {
    top: -height * 0.1,
    right: -width * 0.2,
    width: width * 0.9,
    height: height * 0.45,
  },
  middleLeft: {
    top: height * 0.25,
    left: -width * 0.3,
    width: width * 0.8,
    height: height * 0.4,
  },
  center: {
    top: height * 0.3,
    left: width * 0.1,
    width: width * 0.8,
    height: height * 0.4,
  },
  middleRight: {
    top: height * 0.3,
    right: -width * 0.2,
    width: width * 0.7,
    height: height * 0.35,
  },
  bottomLeft: {
    bottom: -height * 0.1,
    left: -width * 0.2,
    width: width * 0.8,
    height: height * 0.4,
  },
  bottomCenter: {
    bottom: -height * 0.05,
    left: width * 0.2,
    width: width * 0.6,
    height: height * 0.35,
  },
  bottomRight: {
    bottom: -height * 0.1,
    right: -width * 0.2,
    width: width * 0.9,
    height: height * 0.45,
  },
});

export default GradientBackground;
