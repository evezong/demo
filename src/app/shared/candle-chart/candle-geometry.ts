import { Kline } from '../../core/models/market.models';

export interface CandleShape {
  /** 蠟燭中心 x */
  x: number;
  bodyX: number;
  bodyY: number;
  bodyWidth: number;
  bodyHeight: number;
  wickTop: number;
  wickBottom: number;
  rising: boolean;
}

export interface GridLine {
  y: number;
  price: number;
}

export interface ChartGeometry {
  candles: CandleShape[];
  gridLines: GridLine[];
}

const EMPTY: ChartGeometry = { candles: [], gridLines: [] };

/**
 * 把 K 線資料換算成 SVG 座標（純函式，方便單元測試）。
 * 上下各留 5% 空間，避免最高 / 最低點貼齊邊緣。
 */
export function buildCandleGeometry(
  klines: readonly Kline[],
  width: number,
  height: number,
  gridCount = 4,
): ChartGeometry {
  if (klines.length === 0) return EMPTY;

  let low = Infinity;
  let high = -Infinity;
  for (const k of klines) {
    low = Math.min(low, k.low);
    high = Math.max(high, k.high);
  }
  const pad = (high - low || high || 1) * 0.05;
  const min = low - pad;
  const max = high + pad;
  const range = max - min;
  const toY = (price: number) => ((max - price) / range) * height;

  const slot = width / klines.length;
  const bodyWidth = Math.max(1, slot * 0.65);

  const candles = klines.map((k, i): CandleShape => {
    const x = i * slot + slot / 2;
    const top = toY(Math.max(k.open, k.close));
    const bottom = toY(Math.min(k.open, k.close));
    return {
      x,
      bodyX: x - bodyWidth / 2,
      bodyY: top,
      bodyWidth,
      bodyHeight: Math.max(bottom - top, 1),
      wickTop: toY(k.high),
      wickBottom: toY(k.low),
      rising: k.close >= k.open,
    };
  });

  const gridLines = Array.from({ length: gridCount + 1 }, (_, i): GridLine => {
    const y = (height * i) / gridCount;
    return { y, price: max - (range * i) / gridCount };
  });

  return { candles, gridLines };
}

/** 依 x 比例 (0~1) 找出對應的 K 線索引 */
export function indexAtRatio(ratio: number, count: number): number {
  if (count === 0) return -1;
  return Math.min(count - 1, Math.max(0, Math.floor(ratio * count)));
}
