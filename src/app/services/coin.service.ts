import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { Coin, TickerResponse } from '../models/coin';

const API_URL = 'https://data-api.binance.vision/api/v3/ticker/24hr';

const SYMBOLS = [
  'BTCUSDT',
  'ETHUSDT',
  'BNBUSDT',
  'SOLUSDT',
  'XRPUSDT',
  'DOGEUSDT',
  'ADAUSDT',
  'AVAXUSDT',
];

@Injectable({ providedIn: 'root' })
export class CoinService {
  private http = inject(HttpClient);

  /** 取得多個幣種的 24 小時行情 */
  getCoins(): Observable<Coin[]> {
    return this.http
      .get<TickerResponse[]>(API_URL, { params: { symbols: JSON.stringify(SYMBOLS) } })
      .pipe(map((list) => list.map(toCoin)));
  }

  /** 取得單一幣種的 24 小時行情 */
  getCoin(symbol: string): Observable<Coin> {
    return this.http
      .get<TickerResponse>(API_URL, { params: { symbol } })
      .pipe(map(toCoin));
  }
}

function toCoin(data: TickerResponse): Coin {
  return {
    symbol: data.symbol,
    name: data.symbol.replace('USDT', ''),
    price: Number(data.lastPrice),
    changePercent: Number(data.priceChangePercent),
    high: Number(data.highPrice),
    low: Number(data.lowPrice),
    volume: Number(data.quoteVolume),
  };
}
