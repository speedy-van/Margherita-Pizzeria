/** The website's cream, sage and black palette. */
export const colors = {
  background: '#FCFBF7', surface: '#FFFFFF', surfaceMuted: '#F4F1E8',
  text: '#000000', textMuted: '#555B55', border: '#D8D2C4',
  primary: '#A4BDA7', primaryPressed: '#8EA891', onPrimary: '#000000',
  success: '#287346', danger: '#AD302C', white: '#FFFFFF',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radii = { sm: 10, md: 16, lg: 24, pill: 999 } as const;
export const typography = {
  body: 'Inter_400Regular', medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold', bold: 'Inter_700Bold',
  heading: 'PlayfairDisplay_600SemiBold',
} as const;
export const shadows = {
  card: { shadowColor: '#263A2A', shadowOpacity: 0.06, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
} as const;
