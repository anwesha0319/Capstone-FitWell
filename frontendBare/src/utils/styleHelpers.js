/**
 * Style Helpers - AI Sidekick Color Grading System
 * Comprehensive utility functions for consistent styling
 */

/**
 * Glassmorphism Card Styles
 * Creates frosted glass effect with backdrop blur
 */
export const getGlassCardStyle = (colors, variant = 'primary') => {
  const variants = {
    primary: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderRadius: colors.radiusXLarge,
      // Note: backdrop-filter not directly supported in RN
      // Use BlurView component for actual blur effect
    },
    nested: {
      backgroundColor: colors.cardGlass,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.5)',
      borderRadius: colors.radiusNested,
    },
    input: {
      backgroundColor: colors.cardStrong,
      borderWidth: 1.5,
      borderColor: 'rgba(255, 255, 255, 0.6)',
      borderRadius: colors.radiusInput,
    },
  };

  return variants[variant] || variants.primary;
};

/**
 * Button Styles with Gradient Support
 */
export const getButtonStyle = (colors, variant = 'primary', state = 'default') => {
  const baseStyles = {
    primary: {
      default: {
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.primaryButtonBorder || 'rgba(255, 255, 255, 0.6)',
        paddingVertical: 14,
        paddingHorizontal: 24,
        // Gradient colors for LinearGradient component
        gradientColors: colors.accentGradient,
      },
      hover: {
        transform: [{ scale: 1.05 }],
      },
      pressed: {
        transform: [{ scale: 0.98 }],
      },
    },
    secondary: {
      default: {
        backgroundColor: colors.secondaryButton,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.secondaryButtonBorder,
        paddingVertical: 14,
        paddingHorizontal: 24,
      },
      hover: {
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
      },
    },
    ghost: {
      default: {
        backgroundColor: 'transparent',
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 24,
      },
      hover: {
        backgroundColor: colors.ghostButtonHover,
      },
    },
  };

  return baseStyles[variant]?.[state] || baseStyles.primary.default;
};

/**
 * Shadow Styles
 */
export const getShadowStyle = (colors, elevation = 'card') => {
  const shadows = {
    card: {
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 32,
      elevation: 8,
    },
    cardSecondary: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 16,
      elevation: 4,
    },
    button: {
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 6,
    },
    buttonHover: {
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.5,
      shadowRadius: 24,
      elevation: 8,
    },
    icon: {
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 4,
    },
    elevated: {
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.2,
      shadowRadius: 48,
      elevation: 12,
    },
  };

  return shadows[elevation] || shadows.card;
};

/**
 * Typography Styles
 */
export const getTypographyStyle = (colors, variant = 'body') => {
  const typography = {
    h1: {
      fontSize: 32,
      fontWeight: '700',
      color: colors.textPrimary,
      letterSpacing: -0.5,
    },
    h2: {
      fontSize: 24,
      fontWeight: '600',
      color: colors.textPrimary,
      letterSpacing: -0.3,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    body: {
      fontSize: 16,
      fontWeight: '400',
      color: colors.textSecondary,
      lineHeight: 24,
    },
    bodyMedium: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.textPrimary,
      lineHeight: 24,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    caption: {
      fontSize: 12,
      fontWeight: '400',
      color: colors.textSecondary,
    },
    placeholder: {
      fontSize: 16,
      fontWeight: '400',
      color: colors.textPlaceholder,
    },
    accent: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.accent,
    },
  };

  return typography[variant] || typography.body;
};

/**
 * Icon Container Styles
 */
export const getIconContainerStyle = (colors, size = 'medium', backgroundColor) => {
  const sizes = {
    small: 32,
    medium: 40,
    large: 56,
  };

  const dimension = sizes[size] || sizes.medium;

  return {
    width: dimension,
    height: dimension,
    borderRadius: dimension / 2,
    backgroundColor: backgroundColor || colors.iconBackground,
    justifyContent: 'center',
    alignItems: 'center',
    ...getShadowStyle(colors, 'icon'),
  };
};

/**
 * Input Field Styles
 */
export const getInputStyle = (colors, isFocused = false) => {
  return {
    backgroundColor: colors.cardStrong,
    borderWidth: 1.5,
    borderColor: isFocused ? colors.accentLight : 'rgba(255, 255, 255, 0.6)',
    borderRadius: colors.radiusInput,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.textPrimary,
    ...(isFocused && {
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    }),
  };
};

/**
 * Divider Styles
 */
export const getDividerStyle = (colors, variant = 'subtle') => {
  return {
    subtle: {
      height: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    strong: {
      height: 1,
      backgroundColor: 'rgba(139, 92, 246, 0.2)',
    },
  }[variant];
};

/**
 * Status Indicator Styles
 */
export const getStatusStyle = (colors, status = 'active') => {
  const statuses = {
    active: {
      color: colors.accentLight,
      backgroundColor: `${colors.accent}20`,
    },
    success: {
      color: colors.success,
      backgroundColor: `${colors.success}20`,
    },
    error: {
      color: colors.error,
      backgroundColor: `${colors.error}20`,
    },
    warning: {
      color: colors.warning,
      backgroundColor: `${colors.warning}20`,
    },
    disabled: {
      color: colors.textDisabled,
      backgroundColor: 'rgba(233, 213, 255, 0.4)',
    },
  };

  return statuses[status] || statuses.active;
};

/**
 * Animation Timing
 */
export const ANIMATION_TIMING = {
  fast: 150,
  normal: 300,
  slow: 400,
  blur: 400,
};

/**
 * Easing Functions
 */
export const EASING = {
  material: [0.4, 0.0, 0.2, 1],
  easeOut: [0.0, 0.0, 0.2, 1],
  easeIn: [0.4, 0.0, 1, 1],
  easeInOut: [0.4, 0.0, 0.6, 1],
};

/**
 * Scale Values
 */
export const SCALE = {
  hover: 1.05,
  hoverSmall: 1.02,
  pressed: 0.98,
};

/**
 * Z-Index Layers
 */
export const Z_INDEX = {
  base: 0,
  ambient: 1,
  card: 10,
  nested: 15,
  floating: 20,
  modal: 100,
  tooltip: 200,
};
