// Design tokens and theme matching "MediFlow Health Hub" (Vitreous Precision)
export const COLORS = {
  // Brand foundations
  background: '#070e1a',
  surface: '#070e1a',
  primary: '#40cef3',
  primaryContainer: '#04b5d9',
  primaryDim: '#28c0e4',
  onPrimary: '#00414f',
  
  secondary: '#c57eff',
  secondaryContainer: '#7714bb',
  secondaryDim: '#c57eff',
  onSecondary: '#340058',
  
  tertiary: '#5ed8ff',
  tertiaryContainer: '#4dc9f1',
  tertiaryDim: '#39bce2',
  onTertiary: '#00485a',

  // Neutrals & Surface Hierarchy
  onBackground: '#e5ebfd',
  onSurface: '#e5ebfd',
  onSurfaceVariant: '#a4abbc',
  outline: '#6f7585',
  outlineVariant: '#414856',

  surfaceBright: '#222c3f',
  surfaceContainer: '#111a28',
  surfaceContainerHigh: '#172030',
  surfaceContainerHighest: '#1c2637',
  surfaceContainerLow: '#0c1321',
  surfaceContainerLowest: '#000000',

  // Status
  success: '#10B981',
  warning: '#F59E0B',
  error: '#ff716c',
  errorContainer: '#9f0519',
  onError: '#490006',
  emergency: '#FF6B35',
  info: '#3B82F6',

  // Glassmorphism (Vitreous Precision)
  glassFill: 'rgba(7, 14, 26, 0.6)',
  glassBorder: 'rgba(111, 117, 133, 0.2)',
  glassWhite: 'rgba(255, 255, 255, 0.06)',
  glassOverlay: 'rgba(7, 14, 26, 0.85)',
} as const;

export const GRADIENTS = {
  background: ['#070e1a', '#111a28', '#070e1a'] as string[],
  primary: ['#40cef3', '#04b5d9'] as string[], // Signature 135deg gradient
  secondary: ['#c57eff', '#7714bb'] as string[],
  tertiary: ['#5ed8ff', '#4dc9f1'] as string[],
  card: ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)'] as string[],
  emergency: ['#FF6B35', '#E53E3E'] as string[],
  success: ['#10B981', '#059669'] as string[],
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const;

export const RADIUS = {
  sm: 4,      // Minimalist
  md: 8,      // ROUND_EIGHT
  lg: 12,
  xl: 24,     // Card corners
  '2xl': 32,
  '3xl': 48,
  full: 9999, // Primary buttons
} as const;

export const FONT_FAMILY = {
  display: 'Manrope_800ExtraBold',
  headline: 'Manrope_700Bold',
  title: 'Manrope_600SemiBold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  label: 'Inter_600SemiBold',
};

export const FONT_SIZE = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
} as const;

export const SHADOWS = {
  primary: {
    shadowColor: '#40cef3',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  glass: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 32,
    elevation: 12,
  },
} as const;

// Specializations with updated color palette
export const SPECIALIZATIONS = [
  { id: 'general', label: 'General', icon: 'stethoscope', color: '#40cef3' },
  { id: 'cardiology', label: 'Cardiology', icon: 'heart', color: '#ff716c' },
  { id: 'dermatology', label: 'Dermatology', icon: 'sun', color: '#F59E0B' },
  { id: 'neurology', label: 'Neurology', icon: 'brain', color: '#c57eff' },
  { id: 'orthopedics', label: 'Orthopedics', icon: 'bone', color: '#3B82F6' },
  { id: 'pediatrics', label: 'Pediatrics', icon: 'baby', color: '#EC4899' },
  { id: 'gynecology', label: 'Gynecology', icon: 'flower', color: '#DB2777' },
  { id: 'ophthalmology', label: 'Eye', icon: 'eye', color: '#4CC9F0' },
  { id: 'dentistry', label: 'Dentistry', icon: 'smile', color: '#10B981' },
  { id: 'psychiatry', label: 'Psychiatry', icon: 'brain', color: '#7C3AED' },
  { id: 'urology', label: 'Urology', icon: 'droplet', color: '#2563EB' },
  { id: 'ent', label: 'ENT', icon: 'ear', color: '#0891B2' },
] as const;

export const NAV_THEME = {
  dark: {
    background: COLORS.background,
    border: COLORS.outlineVariant,
    card: COLORS.surfaceContainer,
    notification: COLORS.primary,
    primary: COLORS.primary,
    text: COLORS.onSurface,
  },
};
