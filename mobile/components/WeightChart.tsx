import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';

import { theme } from '@/constants/theme';
import type { WeightRecord } from '@/types/models';

export function WeightChart({ records }: { records: WeightRecord[] }) {
  if (records.length < 2) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Add at least two weigh-ins to see a trend.</Text>
      </View>
    );
  }
  const values = records.map((item) => Number(item.weight));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const width = 320;
  const height = 160;
  const pad = 16;
  const points = values
    .map((value, index) => {
      const x = pad + (index / (values.length - 1)) * (width - pad * 2);
      const y = height - pad - ((value - min) / (max - min || 1)) * (height - pad * 2);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <View style={styles.wrap}>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <Polyline points={points} fill="none" stroke={theme.colors.primary} strokeWidth={3} />
        {values.map((value, index) => {
          const x = pad + (index / (values.length - 1)) * (width - pad * 2);
          const y = height - pad - ((value - min) / (max - min || 1)) * (height - pad * 2);
          return <Circle key={`${value}-${index}`} cx={x} cy={y} r={4} fill={theme.colors.accent} />;
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 8,
  },
  empty: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 20,
  },
  emptyText: { color: theme.colors.textMuted, textAlign: 'center' },
});
