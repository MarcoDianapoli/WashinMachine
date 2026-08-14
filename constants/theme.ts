import { Platform } from 'react-native';

const tintColorLight = '#ef3b42';
const tintColorDark = '#ef3b42';

export const Colors = {
  light: {
    text: '#0d0d0f',
    background: '#f4f3f1',
    tint: tintColorLight,
    icon: '#68686f',
    tabIconDefault: '#77777f',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#f4f3f1',
    background: '#0d0d0f',
    tint: tintColorDark,
    icon: '#a3a3aa',
    tabIconDefault: '#77777f',
    tabIconSelected: tintColorLight,
  },
};

export const Brand = {
  red: '#ef3b42',
  darkRed: '#991b1b',
  lightRed: '#fee2e2',
  black: '#0d0d0f',
  white: '#fff',
  gray: '#666',
  lightGray: '#f4f3f1',
  border: '#d4d1cb',
  textMuted: '#68686f',
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
