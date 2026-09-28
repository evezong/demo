import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { BINANCE_REST_URL } from '../market.config';
import { Kline, KlineInterval, Ticker, Trade } from '../models/market.models';
import { RawKline, RawTicker, RawTrade, toKline, toTicker, toTrade } from './binance.mappers';

/** 封裝 Binance REST API，負責請求與資料轉換 */
@Injectable({ providedIn: 'root' })
export class BinanceApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(BINANCE_REST_URL);

  getTickers(symbols: readonly string[]): Observable<Ticker[]> {
    const params = new HttpParams().set('symbols', JSON.stringify(symbols));
    return this.http
      .get<RawTicker[]>(`${this.baseUrl}/ticker/24hr`, { params })
      .pipe(map((list) => list.map(toTicker)));
  }

  getTicker(symbol: string): Observable<Ticker> {
    const params = new HttpParams().set('symbol', symbol);
    return this.http
      .get<RawTicker>(`${this.baseUrl}/ticker/24hr`, { params })
      .pipe(map(toTicker));
  }

  getKlines(symbol: string, interval: KlineInterval, limit = 80): Observable<Kline[]> {
    const params = new HttpParams()
      .set('symbol', symbol)
      .set('interval', interval)
      .set('limit', limit);
    return this.http
      .get<RawKline[]>(`${this.baseUrl}/klines`, { params })
      .pipe(map((list) => list.map(toKline)));
  }

  /** 最近成交，新的在前 */
  getRecentTrades(symbol: string, limit = 30): Observable<Trade[]> {
    const params = new HttpParams().set('symbol', symbol).set('limit', limit);
    return this.http
      .get<RawTrade[]>(`${this.baseUrl}/trades`, { params })
      .pipe(map((list) => list.map(toTrade).reverse()));
  }
}
