/**
 * Projeto: PetDiary
 * Design System Base — equivalente ao global.css do web,
 * adaptado para React Native (sem CSS, sem variáveis CSS).
 *
 * Uso:
 *   import { colors, radii, shadows, fontFamily } from '@/theme';
 *   <View style={{ backgroundColor: colors.bg.app, borderRadius: radii.md }}>
 */

import type { TextStyle, ViewStyle } from 'react-native';
import { Platform } from 'react-native';

// =========================================
// CORES DA MARCA
// =========================================
export const brand = {
  teal: '#24b6d4',
  tealDark: '#168b9f',
  orange: '#f27339',
  orangeDark: '#cc541d',
} as const;

// Gradiente oficial (use com expo-linear-gradient):
//   <LinearGradient colors={gradients.primary} start={{x:0,y:0}} end={{x:1,y:1}} />
export const gradients = {
  primary: [brand.teal, brand.orange] as const,
} as const;

// =========================================
// CORES (semânticas)
// =========================================
export const colors = {
  brand,
  bg: {
    app: '#f4f1eb',           // fundo principal
    surface: '#fdfcf9',       // cards
    surfaceElevated: '#ffffff', // modais
  },
  text: {
    primary: '#2d3748',
    secondary: '#718096',
    inverse: '#ffffff',
  },
  // utilitários derivados
  border: '#e6e1d8',
  overlay: 'rgba(45, 55, 72, 0.5)',
} as const;

// =========================================
// RAIOS DE BORDA
// =========================================
export const radii = {
  sm: 8,
  md: 16,    // padrão para cards de pets
  lg: 24,    // modais
  pill: 9999,
} as const;

// =========================================
// SOMBRAS (sem neumorphism puro — RN não suporta múltiplas sombras nativamente)
// Para o efeito neumórfico real, usar lib `react-native-neomorph-shadows`.
// =========================================
export const shadows: Record<'soft' | 'card' | 'modal', ViewStyle> = {
  soft: Platform.select({
    ios: {
      shadowColor: '#2d3748',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
    },
    android: { elevation: 2 },
    default: {},
  }) as ViewStyle,
  card: Platform.select({
    ios: {
      shadowColor: '#2d3748',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
    },
    android: { elevation: 4 },
    default: {},
  }) as ViewStyle,
  modal: Platform.select({
    ios: {
      shadowColor: '#2d3748',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
    },
    android: { elevation: 12 },
    default: {},
  }) as ViewStyle,
};

// =========================================
// TIPOGRAFIA
// =========================================
// Para usar Nunito no Expo: instalar `@expo-google-fonts/nunito` e carregar
// com `useFonts({ Nunito_400Regular, Nunito_700Bold, ... })` no App.tsx.
export const fontFamily = {
  base: Platform.select({
    ios: 'Nunito',
    android: 'Nunito',
    default: 'System',
  }),
  baseFallback: 'System',
} as const;

export const fontWeight = {
  regular: '400' as TextStyle['fontWeight'],
  medium: '500' as TextStyle['fontWeight'],
  semibold: '600' as TextStyle['fontWeight'],
  bold: '700' as TextStyle['fontWeight'],
  extraBold: '800' as TextStyle['fontWeight'],
};

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
} as const;

// =========================================
// ESPAÇAMENTO (escala consistente com Tailwind / 4px base)
// =========================================
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

// =========================================
// TEMA AGREGADO (export default)
// =========================================
export const theme = {
  colors,
  brand,
  gradients,
  radii,
  shadows,
  fontFamily,
  fontWeight,
  fontSize,
  spacing,
} as const;

export type Theme = typeof theme;

export default theme;
