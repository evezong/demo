import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { EMPTY, catchError, forkJoin, switchMap, tap } from 'rxjs';

import { BinanceApiService } from '../../core/api/binance-api.service';
import { MarketStreamService } from '../../core/api/market-stream.service';
import { ApiError } from '../../core/http/http-error.interceptor';
import { QUOTE_ASSET, baseAsset } from '../../core/market.config';
import {
  KLINE_INTERVALS,
  Kline,
  KlineInterval,
  SymbolEvent,
  Ticker,
  Trade,
} from '../../core/models/market.models';
import { WatchlistService } from '../../core/watchlist/watchlist.service';
import { CandleChart } from '../../shared/candle-chart/candle-chart';
import { CompactNumberPipe } from '../../shared/pipes/compact-number.pipe';
import { PricePipe } from '../../shared/pipes/price.pipe';
import { SignedPercentPipe } from '../../shared/pipes/signed-percent.pipe';

const MAX_TRADES = 30;
const MAX_KLINES = 80;

/** 合併即時 K 線：同一根就覆蓋，新的一根就推入並移除最舊的 */
export function mergeKline(list: readonly Kline[], next: Kline, max = MAX_KLINES): Kline[] {
  const last = list.at(-1);
  if (last?.openTime === next.openTime) return [...list.slice(0, -1), next];
  if (last && next.openTime < last.openTime) return [...list];
  return [...list, next].slice(-max);
}

@Component({
  selector: 'app-symbol-detail',
  imports: [RouterLink, DatePipe, CandleChart, PricePipe, CompactNumberPipe, SignedPercentPipe],
  templateUrl: './symbol-detail.html',
  styleUrl: './symbol-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SymbolDetail {
  private readonly api = inject(BinanceApiService);
  private readonly stream = inject(MarketStreamService);
  private readonly watchlist = inject(WatchlistService);
  private readonly title = inject(Title);

  /** 由路由參數 :symbol 綁定（withComponentInputBinding） */
  readonly symbol = input.required<string>();

  protected readonly intervals = KLINE_INTERVALS;
  protected readonly quote = QUOTE_ASSET;
  protected readonly interval = signal<KlineInterval>('1h');
  protected readonly ticker = signal<Ticker | null>(null);
  protected readonly klines = signal<Kline[]>([]);
  protected readonly trades = signal<Trade[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  private readonly reloadCount = signal(0);

  protected readonly pair = computed(() => this.symbol().toUpperCase());
  protected readonly base = computed(() => baseAsset(this.pair()));
  protected readonly watched = computed(() => this.watchlist.symbols().has(this.pair()));

  protected readonly lastPrice = computed(
    () => this.trades()[0]?.price ?? this.ticker()?.lastPrice ?? null,
  );

  protected readonly changePercent = computed(() => {
    const open = this.ticker()?.openPrice;
    const last = this.lastPrice();
    return open && last != null ? ((last - open) / open) * 100 : null;
  });

  /** 最近成交的買賣力道（主動買入佔比） */
  protected readonly buyRatio = computed(() => {
    const list = this.trades();
    const total = list.reduce((sum, t) => sum + t.qty, 0);
    if (!total) return 50;
    const buys = list.filter((t) => !t.isBuyerMaker).reduce((sum, t) => sum + t.qty, 0);
    return Math.round((buys / total) * 100);
  });

  constructor() {
    const params$ = toObservable(
      computed(() => ({
        symbol: this.pair(),
        interval: this.interval(),
        reload: this.reloadCount(),
      })),
    );

    // 參數改變時 switchMap 會自動取消前一次的 HTTP 請求與 WebSocket 連線
    params$
      .pipe(
        switchMap(({ symbol, interval }) => {
          this.loading.set(true);
          this.error.set(null);

          return forkJoin({
            ticker: this.api.getTicker(symbol),
            klines: this.api.getKlines(symbol, interval, MAX_KLINES),
            trades: this.api.getRecentTrades(symbol, MAX_TRADES),
          }).pipe(
            tap(({ ticker, klines, trades }) => {
              this.ticker.set(ticker);
              this.klines.set(klines);
              this.trades.set(trades);
              this.loading.set(false);
            }),
            switchMap(() => this.stream.symbolEvents(symbol, interval)),
            catchError((err: unknown) => {
              this.error.set(err instanceof ApiError ? err.message : '載入資料失敗。');
              this.loading.set(false);
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((event) => this.apply(event));

    // 分頁標題顯示即時價格
    effect(() => {
      const price = this.lastPrice();
      const label = `${this.base()}/${QUOTE_ASSET}`;
      this.title.setTitle(price != null ? `${new PricePipe().transform(price)} | ${label}` : label);
    });
  }

  protected selectInterval(interval: KlineInterval): void {
    this.interval.set(interval);
  }

  protected reload(): void {
    this.reloadCount.update((n) => n + 1);
  }

  protected toggleWatch(): void {
    this.watchlist.toggle(this.pair());
  }

  private apply(event: SymbolEvent): void {
    switch (event.type) {
      case 'trades':
        this.trades.update((list) => [...event.trades, ...list].slice(0, MAX_TRADES));
        break;
      case 'kline':
        this.klines.update((list) => mergeKline(list, event.kline));
        break;
    }
  }
}
