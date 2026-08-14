import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import { Colors } from '@/constants/Colors';
import { useApp } from '@/store';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const ARC_LENGTH = 386;
const CIRCUMFERENCE = 515;

interface SpeedometerLoaderProps {
  compact?: boolean;
  fullScreen?: boolean;
  message?: string;
  size?: number;
  accentColor?: string;
  trackColor?: string;
}

export function SpeedometerLoader({
  compact = false,
  fullScreen = false,
  message = 'Calentando motores',
  size = compact ? 28 : 190,
  accentColor,
  trackColor,
}: SpeedometerLoaderProps) {
  const { tema } = useApp();
  const theme = Colors[tema];
  const progress = useRef(new Animated.Value(0)).current;
  const [percentage, setPercentage] = useState(0);

  useEffect(() => {
    const listener = progress.addListener(({ value }) => {
      if (!compact) setPercentage(Math.round(value * 100));
    });

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration: 1_250,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.delay(220),
        Animated.timing(progress, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false,
        }),
      ]),
    );

    animation.start();
    return () => {
      animation.stop();
      progress.removeListener(listener);
    };
  }, [compact, progress]);

  const colors = useMemo(() => ({
    accent: accentColor ?? theme.primary,
    track: trackColor ?? 'rgba(255,255,255,0.10)',
  }), [accentColor, theme.primary, trackColor]);

  const dashOffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [ARC_LENGTH, 0],
  });
  const needleRotation = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['-132deg', '132deg'],
  });
  const strokeWidth = compact ? 13 : 10;

  return (
    <View
      style={[
        styles.root,
        fullScreen && styles.fullScreen,
        fullScreen && { backgroundColor: '#0d0d0f' },
      ]}
      accessibilityRole="progressbar"
      accessibilityLabel={message}
    >
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} viewBox="0 0 200 200" style={StyleSheet.absoluteFill}>
          <G rotation="135" origin="100, 100">
            <Circle
              cx="100"
              cy="100"
              r="82"
              fill="none"
              stroke={colors.track}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={`${ARC_LENGTH} ${CIRCUMFERENCE}`}
            />
            <AnimatedCircle
              cx="100"
              cy="100"
              r="82"
              fill="none"
              stroke={colors.accent}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={`${ARC_LENGTH} ${CIRCUMFERENCE}`}
              strokeDashoffset={dashOffset}
            />
          </G>
        </Svg>

        {!compact && (
          <Image
            source={require('../assets/images/logo.png')}
            resizeMode="contain"
            style={[
              styles.logo,
              {
                width: size * 0.5,
                height: size * 0.5,
                left: size * 0.25,
                top: size * 0.25,
              },
            ]}
          />
        )}

        <Animated.View
          style={[
            styles.needleRotor,
            { width: size, height: size, transform: [{ rotate: needleRotation }] },
          ]}
        >
          <View
            style={[
              styles.needle,
              {
                width: Math.max(2, size * 0.02),
                height: size * 0.37,
                left: size / 2 - Math.max(2, size * 0.02) / 2,
                top: size * 0.13,
                backgroundColor: compact ? colors.accent : '#ffffff',
              },
            ]}
          />
        </Animated.View>

        <View
          style={[
            styles.hub,
            {
              width: Math.max(4, size * 0.075),
              height: Math.max(4, size * 0.075),
              borderRadius: size,
              left: size / 2 - Math.max(4, size * 0.075) / 2,
              top: size / 2 - Math.max(4, size * 0.075) / 2,
              backgroundColor: compact ? colors.accent : '#f4f3f1',
            },
          ]}
        />
      </View>

      {!compact && (
        <View style={styles.meta}>
          <Text style={[styles.percentage, { color: fullScreen ? '#f4f3f1' : theme.text }]}>
            {percentage}%
          </Text>
          <Text style={[styles.message, { color: fullScreen ? '#888891' : theme.textMuted }]}>
            {message}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreen: {
    flex: 1,
    paddingHorizontal: 24,
  },
  logo: {
    position: 'absolute',
  },
  needleRotor: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  needle: {
    position: 'absolute',
    borderRadius: 99,
    shadowColor: '#ef3b42',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 6,
  },
  hub: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: 'rgba(13,13,15,0.72)',
  },
  meta: {
    alignItems: 'center',
    gap: 9,
    marginTop: 18,
  },
  percentage: {
    color: '#f4f3f1',
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  message: {
    color: '#888891',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 3.1,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
});
