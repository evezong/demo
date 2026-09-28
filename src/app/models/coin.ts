// API 回傳的原始資料（Binance 的數字都是字串）
export interface TickerResponse {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  highPrice: string;
  lowPrice: string;
  quoteVolume: string;
}

// 畫面上使用的資料
export interface Coin {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  high: number;
  low: number;
  volume: number;
}
