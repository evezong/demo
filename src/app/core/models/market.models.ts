/** 24 小時行情統計（已由 API 字串轉成 number） */
export interface Ticker {
  symbol: string;
  lastPrice: number;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  priceChangePercent: number;
  quoteVolume: number;
}

/** K 線（OHLCV） */
export interface Kline {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/** 單筆成交 */
export interface Trade {
  id: number;
  price: number;
  qty: number;
  time: number;
  /** true 代表買方為 maker，也就是主動賣出 */
  isBuyerMaker: boolean;
}

export const KLINE_INTERVALS = ['15m', '1h', '4h', '1d'] as const;
export type KlineInterval = (typeof KLINE_INTERVALS)[number];

/** 個別交易對 WebSocket 推播事件（discriminated union） */
export type SymbolEvent =
  | { type: 'trades'; trades: Trade[] }
  | { type: 'kline'; kline: Kline };

export type ConnectionStatus = 'idle' | 'connecting' | 'open' | 'reconnecting';
