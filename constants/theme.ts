import { Platform } from 'react-native';

const tintColorLight = '#dc2626';
const tintColorDark = '#dc2626';

export const Colors = {
  light: {
    text: '#111',
    background: '#fff',
    tint: tintColorLight,
    icon: '#666',
    tabIconDefault: '#999',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#fff',
    background: '#111',
    tint: tintColorLight,
    icon: '#999',
    tabIconDefault: '#666',
    tabIconSelected: tintColorLight,
  },
};

export const Brand = {
  red: '#dc2626',
  darkRed: '#991b1b',
  lightRed: '#fee2e2',
  black: '#111',
  white: '#fff',
  gray: '#666',
  lightGray: '#f5f5f5',
  border: '#ddd',
  textMuted: '#999',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
