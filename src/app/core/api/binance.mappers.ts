import { Kline, Ticker, Trade } from '../models/market.models';

// Binance 回傳的數值多為字串，統一在這一層轉型，元件只拿乾淨的 model。

export interface RawTicker {
  symbol: string;
  lastPrice: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  priceChangePercent: string;
  quoteVolume: string;
}

/** [openTime, open, high, low, close, volume, closeTime, ...] */
export type RawKline = [number, string, string, string, string, string, ...unknown[]];

export interface RawTrade {
  id: number;
  price: string;
  qty: string;
  time: number;
  isBuyerMaker: boolean;
}

export function toTicker(raw: RawTicker): Ticker {
  return {
    symbol: raw.symbol,
    lastPrice: +raw.lastPrice,
    openPrice: +raw.openPrice,
    highPrice: +raw.highPrice,
    lowPrice: +raw.lowPrice,
    priceChangePercent: +raw.priceChangePercent,
    quoteVolume: +raw.quoteVolume,
  };
}

export function toKline([openTime, open, high, low, close, volume]: RawKline): Kline {
  return { openTime, open: +open, high: +high, low: +low, close: +close, volume: +volume };
}

export function toTrade(raw: RawTrade): Trade {
  return {
    id: raw.id,
    price: +raw.price,
    qty: +raw.qty,
    time: raw.time,
    isBuyerMaker: raw.isBuyerMaker,
  };
}
