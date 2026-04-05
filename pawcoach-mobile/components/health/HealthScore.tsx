import { useEffect } from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withSpring,
  withDelay,
} from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export default function HealthScore({ score, size = 140, strokeWidth = 10, label }: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const progress = useSharedValue(0);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  useEffect(() => {
    progress.value = withDelay(
      200,
      withSpring(score / 100, { damping: 22, stiffness: 70, mass: 1 })
    );
  }, [score]);

  const color =
    score >= 70 ? '#2D5A3D' : score >= 40 ? '#C4A882' : '#C0392B';

  const scoreLabel =
    score >= 70 ? 'Excellent' : score >= 40 ? 'Correct' : 'À améliorer';

  return (
    <View
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
      accessibilityLabel={`Score santé : ${score} sur 100, ${scoreLabel}`}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: score }}
    >
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          {/* Track */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#EEF4F0"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress */}
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
            strokeLinecap="round"
          />
        </G>
      </Svg>

      <View style={{ alignItems: 'center' }}>
        <Text
          style={{
            fontSize: size >= 130 ? 32 : 22,
            fontWeight: '700',
            color: '#132A1C',
            lineHeight: size >= 130 ? 38 : 28,
          }}
        >
          {score}
        </Text>
        <Text style={{ fontSize: 11, color: '#687068', marginTop: 2 }}>
          {label ?? scoreLabel}
        </Text>
      </View>
    </View>
  );
}
