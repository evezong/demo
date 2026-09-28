import { Kline } from '../../core/models/market.models';
import { buildCandleGeometry, indexAtRatio } from './candle-geometry';

const kline = (open: number, high: number, low: number, close: number): Kline => ({
  openTime: 0,
  open,
  high,
  low,
  close,
  volume: 1,
});

describe('buildCandleGeometry', () => {
  it('returns empty geometry for no data', () => {
    expect(buildCandleGeometry([], 100, 100)).toEqual({ candles: [], gridLines: [] });
  });

  it('places candles evenly and marks direction', () => {
    const { candles } = buildCandleGeometry([kline(10, 12, 9, 11), kline(11, 11, 8, 9)], 200, 100);

    expect(candles).toHaveLength(2);
    expect(candles[0].x).toBe(50);
    expect(candles[1].x).toBe(150);
    expect(candles[0].rising).toBe(true);
    expect(candles[1].rising).toBe(false);
  });

  it('keeps every wick inside the chart height', () => {
    const { candles } = buildCandleGeometry([kline(10, 20, 5, 15), kline(15, 18, 10, 12)], 100, 300);

    for (const c of candles) {
      expect(c.wickTop).toBeGreaterThan(0);
      expect(c.wickBottom).toBeLessThan(300);
      expect(c.wickTop).toBeLessThanOrEqual(c.bodyY);
    }
  });

  it('builds grid lines from top (max) to bottom (min)', () => {
    const { gridLines } = buildCandleGeometry([kline(10, 20, 10, 20)], 100, 100, 4);

    expect(gridLines).toHaveLength(5);
    expect(gridLines[0].y).toBe(0);
    expect(gridLines[4].y).toBe(100);
    expect(gridLines[0].price).toBeGreaterThan(gridLines[4].price);
  });
});

describe('indexAtRatio', () => {
  it('clamps to valid indexes', () => {
    expect(indexAtRatio(-0.2, 10)).toBe(0);
    expect(indexAtRatio(0.55, 10)).toBe(5);
    expect(indexAtRatio(1, 10)).toBe(9);
    expect(indexAtRatio(0.5, 0)).toBe(-1);
  });
});
