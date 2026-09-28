import { Injectable, inject, signal } from '@angular/core';
import {
  Observable,
  bufferTime,
  defer,
  filter,
  finalize,
  map,
  merge,
  repeat,
  retry,
  share,
  timer,
} from 'rxjs';
import { webSocket } from 'rxjs/webSocket';

import { BINANCE_WS_URL } from '../market.config';
import { ConnectionStatus, KlineInterval, SymbolEvent, Ticker, Trade } from '../models/market.models';

interface StreamEnvelope {
  stream: string;
  data: unknown;
}

interface RawMiniTicker {
  s: string;
  c: string;
  o: string;
  h: string;
  l: string;
  q: string;
}

interface RawTradeEvent {
  t: number;
  p: string;
  q: string;
  T: number;
  m: boolean;
}

interface RawKlineEvent {
  k: { t: number; o: string; h: string; l: string; c: string; v: string };
}

const MAX_BACKOFF_MS = 30_000;
const TRADE_BUFFER_MS = 300;

/**
 * Binance WebSocket 即時行情。
 * - 斷線自動重連（指數退避）
 * - 以 signal 對外暴露連線狀態
 * - 高頻成交資料以 bufferTime 批次輸出，降低重繪次數
 */
@Injectable({ providedIn: 'root' })
export class MarketStreamService {
  private readonly baseUrl = inject(BINANCE_WS_URL);
  private readonly _status = signal<ConnectionStatus>('idle');
  readonly status = this._status.asReadonly();

  miniTickers(symbols: readonly string[]): Observable<Ticker> {
    const streams = symbols.map((s) => `${s.toLowerCase()}@miniTicker`);
    return this.connect(streams).pipe(
      map(({ data }) => {
        const t = data as RawMiniTicker;
        const open = +t.o;
        const last = +t.c;
        return {
          symbol: t.s,
          lastPrice: last,
          openPrice: open,
          highPrice: +t.h,
          lowPrice: +t.l,
          priceChangePercent: open ? ((last - open) / open) * 100 : 0,
          quoteVolume: +t.q,
        };
      }),
    );
  }

  /** 單一交易對：成交 + K 線共用同一條連線，再依 stream 名稱分流 */
  symbolEvents(symbol: string, interval: KlineInterval): Observable<SymbolEvent> {
    const s = symbol.toLowerCase();
    const messages$ = this.connect([`${s}@trade`, `${s}@kline_${interval}`]).pipe(share());

    const trades$ = messages$.pipe(
      filter((m) => m.stream.endsWith('@trade')),
      map(({ data }): Trade => {
        const t = data as RawTradeEvent;
        return { id: t.t, price: +t.p, qty: +t.q, time: t.T, isBuyerMaker: t.m };
      }),
      bufferTime(TRADE_BUFFER_MS),
      filter((batch) => batch.length > 0),
      map((batch): SymbolEvent => ({ type: 'trades', trades: batch.reverse() })),
    );

    const kline$ = messages$.pipe(
      filter((m) => m.stream.includes('@kline_')),
      map(({ data }): SymbolEvent => {
        const { k } = data as RawKlineEvent;
        return {
          type: 'kline',
          kline: { openTime: k.t, open: +k.o, high: +k.h, low: +k.l, close: +k.c, volume: +k.v },
        };
      }),
    );

    return merge(trades$, kline$);
  }

  private connect(streams: string[]): Observable<StreamEnvelope> {
    const url = `${this.baseUrl}/stream?streams=${streams.join('/')}`;

    return defer(() => {
      if (this._status() !== 'reconnecting') this._status.set('connecting');
      return webSocket<StreamEnvelope>({
        url,
        openObserver: { next: () => this._status.set('open') },
      });
    }).pipe(
      // 連線錯誤：指數退避重試；收到資料後重置次數
      retry({ delay: (_err, attempt) => this.backoff(attempt), resetOnSuccess: true }),
      // 伺服器正常關閉（Binance 每 24h 會斷線）：同樣重連
      repeat({ delay: () => this.backoff(1) }),
      finalize(() => this._status.set('idle')),
    );
  }

  private backoff(attempt: number): Observable<0> {
    this._status.set('reconnecting');
    return timer(Math.min(1000 * 2 ** (attempt - 1), MAX_BACKOFF_MS));
  }
}
