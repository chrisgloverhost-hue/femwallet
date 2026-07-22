import type { FC } from 'react';
import { memo, useEffect, useRef, useState } from 'react';

import { Stack, useTheme } from '@onekeyhq/components';
import { createLazySdkLoader } from '@onekeyhq/shared/src/utils/lazySdkLoader';

import { LightweightChartPulseDot } from '../../../../components/LightweightChart/LightweightChartPulseDot';
import { createChartDom, updateChartDom } from './chartUtils';

import type { IChartViewAdapterProps, IOnekeyChartApi } from './chartUtils';
import type { UTCTimestamp } from 'lightweight-charts';

const getChartLib = createLazySdkLoader(() => import('lightweight-charts'));

const ChartViewAdapter: FC<IChartViewAdapterProps> = ({
  data,
  onHover,
  lineColor,
  topColor,
  bottomColor,
  height,
  pulseLastPoint,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  // Per-instance chart handle. The chart is created asynchronously (lazy lib
  // load), so the data-update effect below can fire before it exists — guard on
  // this ref instead of reading a global singleton.
  const chartRef = useRef<IOnekeyChartApi | null>(null);
  // Keep the latest data/colors so the async create path can render the current
  // frame as soon as the chart is ready.
  const latestPropsRef = useRef({ data, lineColor, topColor, bottomColor });
  latestPropsRef.current = { data, lineColor, topColor, bottomColor };
  const theme = useTheme();
  const textSubduedColor = theme.textSubdued.val;

  // Pixel-position of the last data point for the live pulse dot.
  const [lastPointPos, setLastPointPos] = useState<{
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) {
      return;
    }

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    void getChartLib().then(({ AreaSeries, createChart }) => {
      if (cancelled || !chartContainerRef.current) return;
      const { chart, handleResize } = createChartDom(
        createChart,
        AreaSeries,
        chartContainerRef.current,
        onHover,
        height,
        textSubduedColor,
      );
      chartRef.current = chart as IOnekeyChartApi;
      // Render the current frame now that the chart exists, since the update
      // effect may have already run (and no-op'd) before this resolved.
      updateChartDom({ chart: chartRef.current, ...latestPropsRef.current });
      cleanup = () => {
        window.removeEventListener('resize', handleResize);
        chart.remove();
        chartRef.current = null;
      };
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textSubduedColor]);

  useEffect(() => {
    const chart = chartRef.current;
    // Chart not created yet; the create effect will render the latest frame.
    if (!chart) {
      return;
    }
    updateChartDom({
      chart,
      bottomColor,
      topColor,
      lineColor,
      data,
    });

    if (!pulseLastPoint || !data?.length) {
      setLastPointPos(null);
      return;
    }

    // Defer coordinate conversion to the next animation frame so lightweight-
    // charts has committed the new data before we query pixel positions.
    requestAnimationFrame(() => {
      const series = chartRef.current?._onekey_series;
      if (!series || !chartRef.current || !data.length) return;
      const lastPt = data[data.length - 1] as [UTCTimestamp, number];
      const x = chartRef.current.timeScale().timeToCoordinate(lastPt[0]);
      const y = series.priceToCoordinate(lastPt[1]);
      if (x !== null && y !== null && x > 0 && y > 0) {
        setLastPointPos({ x, y });
      } else {
        setLastPointPos(null);
      }
    });
  }, [bottomColor, topColor, data, lineColor, pulseLastPoint]);

  return (
    <Stack position="relative" width="100%" height={height}>
      <div style={{ width: '100%', height }} ref={chartContainerRef} />
      {pulseLastPoint && lastPointPos ? (
        <LightweightChartPulseDot
          x={lastPointPos.x}
          y={lastPointPos.y}
          color={lineColor ?? '#33C641'}
        />
      ) : null}
    </Stack>
  );
};
ChartViewAdapter.displayName = 'ChartViewAdapter';
export default memo(ChartViewAdapter);
