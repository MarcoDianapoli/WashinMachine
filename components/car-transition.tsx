import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, PanResponder, Text, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useSegments } from 'expo-router';
import { useApp } from '@/store';

const { width: W } = Dimensions.get('window');

const TAB_ORDER: Record<string, number> = {
  explore: 0,
  index: 1,
  perfil: 2,
};
const TAB_ROUTES = ['/(tabs)/explore', '/(tabs)', '/(tabs)/perfil'] as const;

const TAB_CENTER = (i: number) => W * (i + 0.5) / 3;
const SWIPE_THRESHOLD = 50;

const CAR_EMOJI: Record<string, string> = {
  chico: '\u{1F697}',
  mediano: '\u{1F699}',
  grande: '\u{1F6FB}',
  moto: '\u{1F3CD}',
  trailer: '\u{1F69B}',
};
const DEFAULT_CAR = '\u{1F697}';

function tabIdx(segments: string[]): number | undefined {
  if (segments[0] !== '(tabs)') return undefined;
  if (segments.length < 2) return TAB_ORDER['index'];
  return TAB_ORDER[segments[1]] ?? undefined;
}

function tabIdxFromPath(path: string): number | undefined {
  const p = path.split('/');
  if (p[0] !== '(tabs)') return undefined;
  if (p.length < 2) return TAB_ORDER['index'];
  return TAB_ORDER[p[1]] ?? undefined;
}

export function CarTransitionProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const router = useRouter();
  const prevSegments = useRef(segments.join('/'));
  const segmentsRef = useRef(segments);
  segmentsRef.current = segments;
  const { tamanoVehiculo } = useApp();

  const [visible, setVisible] = useState(false);
  const lastIdx = useRef(tabIdx(segments) ?? 1);
  const animX = useRef(new Animated.Value(TAB_CENTER(lastIdx.current))).current;

  const emoji = CAR_EMOJI[tamanoVehiculo] || DEFAULT_CAR;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => {
        const seg = segmentsRef.current;
        const idx = tabIdx(seg);
        if (idx === undefined) return false;
        if (gs.numberActiveTouches !== 1) return false;
        return Math.abs(gs.dx) > 20 && Math.abs(gs.dx) > Math.abs(gs.dy) * 2;
      },
      onPanResponderRelease: (_, gs) => {
        const seg = segmentsRef.current;
        const idx = tabIdx(seg);
        if (idx === undefined) return;
        if (gs.dx > SWIPE_THRESHOLD && idx > 0) {
          router.push(TAB_ROUTES[idx - 1]);
        } else if (gs.dx < -SWIPE_THRESHOLD && idx < TAB_ROUTES.length - 1) {
          router.push(TAB_ROUTES[idx + 1]);
        }
      },
    })
  ).current;

  useEffect(() => {
    const curr = segments.join('/');
    const prev = prevSegments.current;
    prevSegments.current = curr;

    if (!prev || prev === curr) return;

    const currIdx = tabIdx(segments);
    const prevIdx = tabIdxFromPath(prev);

    if (prevIdx !== undefined && currIdx !== undefined && prevIdx !== currIdx) {
      lastIdx.current = currIdx;
      setVisible(true);
      Animated.timing(animX, {
        toValue: TAB_CENTER(currIdx),
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => setVisible(false));
    }
  }, [segments, animX]);

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      {children}
      {visible && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Animated.View
            style={[
              styles.car,
              {
                bottom: insets.bottom + 55,
                transform: [
                  {
                    translateX: animX.interpolate({
                      inputRange: [0, W],
                      outputRange: [-24, W - 24],
                      extrapolate: 'clamp',
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.emoji}>{emoji}</Text>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  car: {
    position: 'absolute',
    zIndex: 9999,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 8,
  },
  emoji: { fontSize: 26, lineHeight: 30, textAlign: 'center' },
});
