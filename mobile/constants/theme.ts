export const theme = {
  colors: {
    background: '#F6F3EE',
    surface: '#FFFFFF',
    surfaceMuted: '#EEE8DF',
    primary: '#1F6F5B',
    primaryDark: '#154D40',
    accent: '#E07A5F',
    text: '#1F2933',
    textMuted: '#6B7280',
    border: '#E5DFD6',
    success: '#2A9D8F',
    warning: '#E9C46A',
    danger: '#C44536',
    overlay: 'rgba(31, 41, 51, 0.45)',
  },
  radius: {
    sm: 12,
    md: 18,
    lg: 24,
    xl: 32,
  },
  spacing: (value: number) => value * 8,
};

export type Theme = typeof theme;
