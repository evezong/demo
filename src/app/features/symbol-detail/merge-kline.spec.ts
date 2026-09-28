import { Kline } from '../../core/models/market.models';
import { mergeKline } from './symbol-detail';

const k = (openTime: number, close = 1): Kline => ({
  openTime,
  open: 1,
  high: 1,
  low: 1,
  close,
  volume: 1,
});

describe('mergeKline', () => {
  it('replaces the last candle when openTime matches', () => {
    const result = mergeKline([k(1), k(2, 10)], k(2, 20));
    expect(result.map((x) => x.close)).toEqual([1, 20]);
  });

  it('appends a new candle and keeps the max length', () => {
    const result = mergeKline([k(1), k(2)], k(3), 2);
    expect(result.map((x) => x.openTime)).toEqual([2, 3]);
  });

  it('ignores out-of-order candles', () => {
    expect(mergeKline([k(5)], k(3)).map((x) => x.openTime)).toEqual([5]);
  });
});
