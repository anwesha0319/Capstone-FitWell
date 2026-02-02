import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('darkMode');
      if (savedTheme !== null) {
        setIsDarkMode(JSON.parse(savedTheme));
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
    }
  };

  const toggleTheme = async () => {
    try {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      await AsyncStorage.setItem('darkMode', JSON.stringify(newMode));
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  const theme = {
    isDark: isDarkMode,
    colors: isDarkMode ? darkColors : lightColors,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

// Light Mode - AI Sidekick Dreamy Glassmorphism
// Soft radial gradient with purple-pink tones
const lightColors = {
  // Main Background - Gradient Array for LinearGradient
  backgroundGradient: ['#F8E8FF', '#E8D5FF', '#D5B8FF', '#E8D5FF', '#F8E8FF'],
  backgroundStart: '#F8E8FF',  // Pale pink-white (center)
  backgroundMid: '#E8D5FF',    // Light lavender (mid)
  backgroundMid2: '#D5B8FF',   // Soft purple (outer)
  backgroundMid3: '#E8D5FF',   // Light lavender
  backgroundEnd: '#F8E8FF',    // Pale pink-white
  backgroundSolid: '#E8D5FF',  // Average for solid backgrounds
  
  // Secondary Background (Chat / Content Screens) - Calmer Cool Blues
  secondaryBgGradient: ['#FAFCFF', '#F0F5FF', '#F5F8FF'],
  secondaryBgStart: '#FAFCFF', // Soft white-blue
  secondaryBgMid: '#F0F5FF',   // Cool light blue
  secondaryBgEnd: '#F5F8FF',   // Airy white-blue
  
  // Glassmorphism Cards - AI Sidekick Frosted Glass
  card: 'rgba(255, 255, 255, 0.55)',      // Primary glass (55% opacity - clearer)
  cardGlass: 'rgba(255, 255, 255, 0.45)', // Nested glass (45% opacity)
  cardStrong: 'rgba(255, 255, 255, 0.65)', // Strong glass for inputs (65% opacity)
  cardBorder: 'rgba(255, 255, 255, 0.75)', // Frosted edge highlight (brighter)
  cardBorderInner: 'rgba(255, 255, 255, 0.5)', // Inner glow
  cardTint: 'rgba(139, 92, 246, 0.08)',   // Purple tint overlay
  
  // Text - Deep Purple Tones (AI Sidekick Style) - FIXED FOR VISIBILITY
  textPrimary: '#0F0A1A',      // Almost black with purple tint (H1) - MAXIMUM CONTRAST
  textSecondary: '#1A0F2E',    // Very dark purple (H2) - HIGH CONTRAST
  textTertiary: '#2D1B4E',     // Dark purple (body) - READABLE
  textLabel: '#3D2B5F',        // Medium dark for labels - VISIBLE
  textPlaceholder: '#4A3A6C',  // Medium for placeholder - VISIBLE
  textOnAccent: '#FFFFFF',     // Text on accent buttons
  textDisabled: '#9B8FB8',     // Disabled text
  
  // Primary Brand Accent - Purple Gradient (AI Sidekick)
  accent: '#8B5CF6',           // Vibrant purple (primary)
  accentLight: '#A78BFA',      // Light purple
  accentLighter: '#C4B5FD',    // Lighter purple
  accentDark: '#5B21B6',       // Darker purple for deeper logout color in light mode
  accentHover: '#9370F5',      // Hover state (10% lighter)
  accentPressed: '#7C3AED',    // Pressed state
  accentGradient: ['#8B5CF6', '#A78BFA', '#C4B5FD'], // 3-stop gradient array
  
  // Button Styles - AI Sidekick
  primaryButtonGradient: ['#8B5CF6', '#A78BFA', '#C4B5FD'], // Gradient array for LinearGradient
  primaryButtonText: '#FFFFFF',
  primaryButtonSolid: '#8B5CF6',
  primaryButtonBorder: 'rgba(255, 255, 255, 0.6)',
  secondaryButton: 'rgba(255, 255, 255, 0.3)',
  secondaryButtonText: '#8B5CF6',
  secondaryButtonBorder: 'rgba(255, 255, 255, 0.5)',
  ghostButton: 'transparent',
  ghostButtonText: '#8B5CF6',
  ghostButtonHover: 'rgba(139, 92, 246, 0.08)',
  
  // Chat UI Colors
  chatAI: 'rgba(240, 245, 255, 0.65)',        // AI message bubble (glass + cool)
  chatAIText: '#2D3748',
  chatAIBorder: 'rgba(167, 139, 250, 0.2)',
  chatUserGradient: ['#A78BFA', '#C4B5FD'],   // User message gradient array
  chatUserText: '#FFFFFF',
  chatInput: 'rgba(255, 255, 255, 0.50)',     // Input field (frosted glass)
  chatInputText: '#2D3748',
  chatInputPlaceholder: '#A0AEC0',
  chatInputBorder: 'rgba(255, 255, 255, 0.6)',
  chatInputFocusBorder: 'rgba(167, 139, 250, 0.5)',
  
  // Colorful Icon Colors (Rounded, Soft, Pastel Fills) - MODE-AWARE
  iconPrimary: '#8B5CF6',      // Vibrant purple (works in both modes)
  iconSecondary: '#6E6A86',    // Dark enough for light mode
  iconInactive: '#CBD5E0',     // Disabled
  iconBackground: 'rgba(167, 139, 250, 0.12)', // Soft circle background
  iconBackgroundHover: 'rgba(167, 139, 250, 0.20)',
  
  // Icon Gradient Colors (Cute AI Companion Aesthetic) - DARKER FOR LIGHT MODE
  iconViolet: '#7C3AED',       // Darker violet for visibility
  iconLavender: '#8B5CF6',     // Medium purple
  iconSkyBlue: '#0EA5E9',      // Darker sky blue
  iconSoftPink: '#EC4899',     // Darker pink
  iconMintGreen: '#10B981',    // Darker mint green
  
  // Specific Feature Icons - DARKER FOR LIGHT MODE
  iconApple: '#10B981',        // Darker green (nutrition)
  iconFire: '#EC4899',         // Darker pink (calories)
  iconWater: '#0EA5E9',        // Darker blue (hydration)
  iconHeart: '#EC4899',        // Darker pink (heart)
  iconDumbbell: '#7C3AED',     // Darker violet (workout)
  iconSleep: '#8B5CF6',        // Medium purple (sleep)
  
  // Status Colors - Soft & Clear
  success: '#A7F3D0',          // Mint green
  error: '#FBCFE8',            // Soft pink
  warning: '#FDE68A',          // Soft yellow
  info: '#BAE6FD',             // Sky blue
  
  // Chart Colors - Soft Pastels
  chartProtein: '#A7F3D0',     // Mint green
  chartCarbs: '#C4B5FD',       // Light lavender
  chartFat: '#FBCFE8',         // Soft pink
  chartFiber: '#BAE6FD',       // Sky blue
  chartCalories: '#A78BFA',    // Soft violet
  chartSteps: '#A7F3D0',       // Mint green
  chartSleep: '#C4B5FD',       // Light lavender
  chartHeartRate: '#FBCFE8',   // Soft pink
  chartSpO2: '#BAE6FD',        // Sky blue
  chartBackground: 'rgba(255, 255, 255, 0.40)',
  chartGrid: 'rgba(120, 100, 180, 0.06)',
  
  // Semantic Colors
  purple: '#C4B5FD',           // Light lavender
  orange: '#FDE68A',           // Soft yellow
  
  // Shadows & Depth - AI Sidekick Purple Shadows (React Native format)
  shadow: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
  },
  shadowLight: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  shadowDark: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  shadowCard: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 10,
  },
  shadowCardSecondary: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 5,
  },
  shadowIcon: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
  },
  shadowElevated: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.20,
    shadowRadius: 48,
    elevation: 12,
  },
  shadowButton: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  shadowButtonHover: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 10,
  },
  
  // Glow Effects - Soft Glow Behind Floating Buttons (color values for overlays)
  glow: 'rgba(167, 139, 250, 0.2)',       // Soft glow
  glowMedium: 'rgba(167, 139, 250, 0.3)', // Medium glow
  glowStrong: 'rgba(167, 139, 250, 0.4)', // Strong glow
  glowBloom: 'rgba(167, 139, 250, 0.5)',  // Bloom effect
  
  // Border & Dividers
  border: 'rgba(167, 139, 250, 0.15)',    // Soft border
  divider: 'rgba(167, 139, 250, 0.08)',   // Very subtle divider
  
  // Overlay & Navigation
  overlay: 'rgba(255, 255, 255, 0.85)',   // Light overlay
  navBar: 'rgba(255, 255, 255, 0.75)',    // Frosted glass bottom nav
  
  // Special Effects
  centerGlow: 'rgba(255, 255, 255, 0.40)', // Center radial glow
  vignette: 'rgba(167, 139, 250, 0.03)',   // Very subtle edge tint
  noise: 'rgba(0, 0, 0, 0.01)',            // Subtle noise texture
  
  // Blur Values (for BlurView intensity prop)
  blurAmount: 32,              // Default blur
  blurLight: 24,               // Light blur
  blurStrong: 40,              // Strong blur
  
  // Border Radius Values - AI Sidekick
  radiusSmall: 12,
  radiusMedium: 16,
  radiusLarge: 20,
  radiusXLarge: 24,
  radiusNested: 16,    // Nested cards
  radiusInput: 12,     // Input fields
  
  // Blur Values - AI Sidekick (for backdrop-filter equivalent)
  backdropBlur: 20,    // Primary cards
  backdropBlurNested: 16, // Nested cards
  backdropBlurInput: 12,  // Input fields
  backdropSaturate: 180,  // Saturation boost
  
  // Logo Path
  logoPath: 'C:\\Capstone\\HealthConnect\\frontendBare\\android\\app\\src\\main\\res\\mipmap-xxxhdpi\\ic_launcher.png',
  
  // Font Families - System Defaults (will be upgraded to Inter)
  fontRegular: 'System',
  fontMedium: 'System',
  fontSemiBold: 'System',
  fontBold: 'System',
  
  // Color Palette Reference
  softViolet: '#8B5CF6',       // Primary accent
  lightLavender: '#A78BFA',    // Secondary
  lighterLavender: '#C4B5FD',  // Tertiary
  skyBlue: '#BAE6FD',          // Quaternary
  softPink: '#FBCFE8',         // Quinary
  mintGreen: '#A7F3D0',        // Senary
};

// Dark Mode - Soft Futuristic Dark Glassmorphism
// Dreamy dark AI companion with soft neon accents
const darkColors = {
  // Deep Gradient Background - Soft Dark Purples (Not Harsh Black)
  backgroundGradient: ['#1A1625', '#221B35', '#2A2440', '#1F1A2E', '#1A1625'],
  backgroundStart: '#1A1625',  // Deep soft purple
  backgroundMid: '#221B35',    // Midnight purple
  backgroundMid2: '#2A2440',   // Darker purple
  backgroundMid3: '#1F1A2E',   // Deep purple
  backgroundEnd: '#1A1625',    // Deep soft purple
  backgroundSolid: '#211C32',  // Average for solid backgrounds
  
  // Secondary Background (Chat / Content Screens)
  secondaryBgGradient: ['#1C1828', '#241F35', '#1E1A2D'],
  secondaryBgStart: '#1C1828', // Soft dark purple
  secondaryBgMid: '#241F35',   // Midnight purple
  secondaryBgEnd: '#1E1A2D',   // Deep purple
  
  // Glassmorphism Cards - Translucent Dark Glass (Dreamy, Not Metallic)
  card: 'rgba(60, 50, 90, 0.45)',         // Soft dark glass
  cardGlass: 'rgba(60, 50, 90, 0.35)',    // Light glass for layering
  cardStrong: 'rgba(60, 50, 90, 0.60)',   // Strong glass for modals
  cardBorder: 'rgba(167, 139, 250, 0.25)', // Soft violet glow border
  cardTint: 'rgba(167, 139, 250, 0.12)',  // Violet tint overlay
  
  // Text - Soft Light Colors (Not Pure White)
  // Make text slightly brighter for improved readability in dark mode
  textPrimary: '#FFFFFF',      // Use white for headings for higher contrast
  textSecondary: '#F0F0F0',    // Very light for body text
  textTertiary: '#CFCFD3',     // Muted light tone for labels
  textPlaceholder: '#6B6580',  // Placeholder text
  textOnAccent: '#FFFFFF',     // Text on accent buttons
  textDisabled: '#4A4560',     // Disabled text
  
  // Primary Brand Accent - Soft Neon Violet (Not Harsh)
  accent: '#B794FF',           // Soft neon violet (primary)
  accentLight: '#D4C5FF',      // Light neon lavender
  accentDark: '#9370F5',       // Medium neon violet
  accentHover: '#C8AAFF',      // Hover state
  accentPressed: '#A685F0',    // Pressed state
  accentGradient: ['#B794FF', '#D4C5FF'], // Gradient array
  
  // Button Styles
  primaryButtonGradient: ['#B794FF', '#D4C5FF'], // Gradient array for LinearGradient
  primaryButtonText: '#1A1625',
  primaryButtonSolid: '#B794FF',
  secondaryButton: 'rgba(60, 50, 90, 0.45)',
  secondaryButtonText: '#B794FF',
  secondaryButtonBorder: 'rgba(167, 139, 250, 0.4)',
  ghostButton: 'transparent',
  ghostButtonText: '#B794FF',
  ghostButtonHover: 'rgba(167, 139, 250, 0.12)',
  
  // Chat UI Colors
  chatAI: 'rgba(60, 50, 90, 0.65)',           // AI message (dark glass)
  chatAIText: '#E8E4F3',
  chatAIBorder: 'rgba(167, 139, 250, 0.25)',
  chatUserGradient: ['#B794FF', '#D4C5FF'],   // User message gradient array
  chatUserText: '#1A1625',
  chatInput: 'rgba(60, 50, 90, 0.50)',        // Input field (dark glass)
  chatInputText: '#E8E4F3',
  chatInputPlaceholder: '#6B6580',
  chatInputBorder: 'rgba(167, 139, 250, 0.25)',
  chatInputFocusBorder: 'rgba(167, 139, 250, 0.5)',
  
  // Colorful Icon Colors (Soft Neon, Not Harsh)
  iconPrimary: '#B794FF',      // Matches accent
  iconSecondary: '#8B85A3',    // Muted
  iconInactive: '#4A4560',     // Disabled
  iconBackground: 'rgba(167, 139, 250, 0.15)', // Soft circle background
  iconBackgroundHover: 'rgba(167, 139, 250, 0.25)',
  
  // Icon Gradient Colors (Cute AI Companion - Dark Mode)
  iconViolet: '#B794FF',       // Soft neon violet
  iconLavender: '#D4C5FF',     // Light neon lavender
  iconSkyBlue: '#A8D8FF',      // Soft blue
  iconSoftPink: '#FFB8E8',     // Soft pink
  iconMintGreen: '#A8F5D0',    // Mint green
  
  // Specific Feature Icons
  iconApple: '#A8F5D0',        // Mint green (nutrition)
  iconFire: '#FFB8E8',         // Soft pink (calories)
  iconWater: '#A8D8FF',        // Soft blue (hydration)
  iconHeart: '#FFB8E8',        // Soft pink (heart)
  iconDumbbell: '#B794FF',     // Soft neon violet (workout)
  iconSleep: '#D4C5FF',        // Light neon lavender (sleep)
  
  // Status Colors - Soft Neon
  success: '#A8F5D0',          // Mint green
  error: '#FFB8E8',            // Soft pink
  warning: '#FFE8A8',          // Soft yellow
  info: '#A8D8FF',             // Soft blue
  
  // Chart Colors - Soft Neon Pastels
  chartProtein: '#A8F5D0',     // Mint green
  chartCarbs: '#D4C5FF',       // Light neon lavender
  chartFat: '#FFB8E8',         // Soft pink
  chartFiber: '#A8D8FF',       // Soft blue
  chartCalories: '#B794FF',    // Soft neon violet
  chartSteps: '#A8F5D0',       // Mint green
  chartSleep: '#D4C5FF',       // Light neon lavender
  chartHeartRate: '#FFB8E8',   // Soft pink
  chartSpO2: '#A8D8FF',        // Soft blue
  chartBackground: 'rgba(0, 0, 0, 0.30)',
  chartGrid: 'rgba(167, 139, 250, 0.08)',
  
  // Semantic Colors
  purple: '#D4C5FF',           // Light neon lavender
  orange: '#FFE8A8',           // Soft yellow
  
  // Shadows & Depth - Soft, Not Harsh (React Native format)
  shadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 8,
    elevation: 4,
  },
  shadowLight: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.20,
    shadowRadius: 4,
    elevation: 2,
  },
  shadowDark: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 6,
  },
  shadowCard: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.30,
    shadowRadius: 32,
    elevation: 10,
  },
  shadowIcon: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  shadowElevated: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.40,
    shadowRadius: 48,
    elevation: 12,
  },
  shadowButton: {
    shadowColor: '#B794FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 8,
  },
  
  // Glow Effects - Soft Neon Glow (color values for overlays)
  glow: 'rgba(167, 139, 250, 0.25)',      // Soft glow
  glowMedium: 'rgba(167, 139, 250, 0.35)', // Medium glow
  glowStrong: 'rgba(167, 139, 250, 0.45)', // Strong glow
  glowBloom: 'rgba(167, 139, 250, 0.55)',  // Bloom effect
  
  // Border & Dividers
  border: 'rgba(167, 139, 250, 0.20)',    // Soft border
  divider: 'rgba(167, 139, 250, 0.12)',   // Very subtle divider
  
  // Overlay & Navigation
  overlay: 'rgba(0, 0, 0, 0.70)',         // Dark overlay
  navBar: 'rgba(60, 50, 90, 0.60)',       // Dark glass bottom nav
  
  // Special Effects
  centerGlow: 'rgba(167, 139, 250, 0.20)', // Center radial glow
  vignette: 'rgba(0, 0, 0, 0.30)',        // Edge darkening
  noise: 'rgba(255, 255, 255, 0.02)',     // Subtle noise texture
  
  // Blur Values (for BlurView intensity prop)
  blurAmount: 32,              // Default blur
  blurLight: 24,               // Light blur
  blurStrong: 40,              // Strong blur
  
  // Border Radius Values
  radiusSmall: 12,
  radiusMedium: 16,
  radiusLarge: 20,
  radiusXLarge: 24,
  
  // Color Palette Reference
  softNeonViolet: '#B794FF',   // Primary accent
  lightNeonLavender: '#D4C5FF', // Secondary
  softBlue: '#A8D8FF',         // Tertiary
  softPink: '#FFB8E8',         // Quaternary
  mintGreen: '#A8F5D0',        // Quinary
};
