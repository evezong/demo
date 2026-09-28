import { InjectionToken } from '@angular/core';

/** Binance 公開行情 REST API（免金鑰） */
export const BINANCE_REST_URL = new InjectionToken<string>('BINANCE_REST_URL', {
  providedIn: 'root',
  factory: () => 'https://data-api.binance.vision/api/v3',
});

/** Binance 公開行情 WebSocket */
export const BINANCE_WS_URL = new InjectionToken<string>('BINANCE_WS_URL', {
  providedIn: 'root',
  factory: () => 'wss://data-stream.binance.vision',
});

export const DEFAULT_SYMBOLS: readonly string[] = [
  'BTCUSDT',
  'ETHUSDT',
  'BNBUSDT',
  'SOLUSDT',
  'XRPUSDT',
  'DOGEUSDT',
  'ADAUSDT',
  'AVAXUSDT',
  'LINKUSDT',
  'DOTUSDT',
  'TRXUSDT',
  'LTCUSDT',
];

export const QUOTE_ASSET = 'USDT';

export function baseAsset(symbol: string): string {
  return symbol.endsWith(QUOTE_ASSET) ? symbol.slice(0, -QUOTE_ASSET.length) : symbol;
}
