import { useState } from 'react';
import { View, Text, Dimensions } from 'react-native';
import {
  VictoryChart,
  VictoryLine,
  VictoryArea,
  VictoryAxis,
  VictoryScatter,
  VictoryTheme,
  VictoryVoronoiContainer,
} from 'victory-native';

export interface WeightPoint {
  date: string;
  value: number;
}

interface Props {
  data: WeightPoint[];
  normalMin?: number;
  normalMax?: number;
  unit?: string;
}

const CHART_HEIGHT = 200;
const PADDING = { top: 12, bottom: 36, left: 44, right: 16 };

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

export default function WeightChart({ data, normalMin, normalMax, unit = 'kg' }: Props) {
  const [activePoint, setActivePoint] = useState<WeightPoint | null>(null);
  const chartWidth = Dimensions.get('window').width - 32; // px-4 both sides

  if (data.length < 2) {
    return (
      <View
        style={{
          height: CHART_HEIGHT,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F9F7F4',
          borderRadius: 12,
        }}
      >
        <Text style={{ fontSize: 13, color: '#687068' }}>
          Ajoutez au moins 2 pesées pour afficher le graphe
        </Text>
      </View>
    );
  }

  // Convert to x-index for VictoryChart
  const chartData = data.map((p, i) => ({ x: i, y: p.value, date: p.date }));

  // Normal zone as area between normalMin and normalMax
  const zoneData =
    normalMin !== undefined && normalMax !== undefined
      ? chartData.map((p) => ({ x: p.x, y: normalMax, y0: normalMin }))
      : null;

  const ticks = chartData.map((p) => p.x);
  const tickLabels = chartData.map((p) => formatDateShort(p.date));

  // Y domain with padding
  const yValues = chartData.map((p) => p.y);
  if (normalMin !== undefined) yValues.push(normalMin);
  if (normalMax !== undefined) yValues.push(normalMax);
  const yMin = Math.min(...yValues) * 0.95;
  const yMax = Math.max(...yValues) * 1.05;

  return (
    <View accessibilityLabel={`Graphe de poids avec ${data.length} mesures`}>
      {/* Active point tooltip */}
      {activePoint && (
        <View
          style={{
            backgroundColor: '#2D5A3D',
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 6,
            alignSelf: 'center',
            marginBottom: 4,
          }}
        >
          <Text style={{ color: '#FFF8F0', fontSize: 13, fontWeight: '600' }}>
            {activePoint.value.toFixed(1)} {unit} — {formatDateShort(activePoint.date)}
          </Text>
        </View>
      )}

      <VictoryChart
        width={chartWidth}
        height={CHART_HEIGHT}
        padding={PADDING}
        domain={{ y: [yMin, yMax] }}
        theme={VictoryTheme.grayscale}
        containerComponent={
          <VictoryVoronoiContainer
            voronoiDimension="x"
            onActivated={(points) => {
              if (points.length > 0) {
                const p = points[0];
                const idx = p.x as number;
                setActivePoint(data[idx] ?? null);
              }
            }}
            onDeactivated={() => setActivePoint(null)}
          />
        }
      >
        {/* Normal zone */}
        {zoneData && (
          <VictoryArea
            data={zoneData}
            style={{
              data: {
                fill: 'rgba(45, 90, 61, 0.08)',
                stroke: 'rgba(45, 90, 61, 0.15)',
                strokeWidth: 1,
                strokeDasharray: '4,3',
              },
            }}
          />
        )}

        {/* Weight line */}
        <VictoryLine
          data={chartData}
          style={{
            data: { stroke: '#2D5A3D', strokeWidth: 2.5 },
          }}
          interpolation="monotoneX"
          animate={{ duration: 500, onLoad: { duration: 600 } }}
        />

        {/* Data points */}
        <VictoryScatter
          data={chartData}
          size={4}
          style={{
            data: {
              fill: '#FFF8F0',
              stroke: '#2D5A3D',
              strokeWidth: 2,
            },
          }}
        />

        {/* X Axis */}
        <VictoryAxis
          tickValues={ticks}
          tickFormat={(t) => tickLabels[t as number] ?? ''}
          style={{
            axis: { stroke: '#E4D0BB' },
            tickLabels: { fontSize: 10, fill: '#687068', padding: 4 },
            grid: { stroke: 'none' },
            ticks: { stroke: 'none' },
          }}
        />

        {/* Y Axis */}
        <VictoryAxis
          dependentAxis
          tickFormat={(y: number) => `${y}${unit}`}
          style={{
            axis: { stroke: '#E4D0BB' },
            tickLabels: { fontSize: 10, fill: '#687068', padding: 4 },
            grid: { stroke: '#EEF4F0', strokeWidth: 1 },
            ticks: { stroke: 'none' },
          }}
        />
      </VictoryChart>

      {/* Legend */}
      {zoneData && (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 16,
            marginTop: -4,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 16, height: 2.5, backgroundColor: '#2D5A3D', borderRadius: 2 }} />
            <Text style={{ fontSize: 11, color: '#687068' }}>Poids</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 16, height: 8, backgroundColor: 'rgba(45,90,61,0.12)', borderRadius: 2 }} />
            <Text style={{ fontSize: 11, color: '#687068' }}>Zone normale</Text>
          </View>
        </View>
      )}
    </View>
  );
}
