import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Subscription, switchMap, tap } from 'rxjs';

import { BinanceApiService } from '../../core/api/binance-api.service';
import { MarketStreamService } from '../../core/api/market-stream.service';
import { ApiError } from '../../core/http/http-error.interceptor';
import { DEFAULT_SYMBOLS, QUOTE_ASSET, baseAsset } from '../../core/market.config';
import { Ticker } from '../../core/models/market.models';
import { WatchlistService } from '../../core/watchlist/watchlist.service';
import { CompactNumberPipe } from '../../shared/pipes/compact-number.pipe';
import { PricePipe } from '../../shared/pipes/price.pipe';
import { SignedPercentPipe } from '../../shared/pipes/signed-percent.pipe';

export type SortKey = 'symbol' | 'lastPrice' | 'priceChangePercent' | 'quoteVolume';

export interface SortState {
  key: SortKey;
  dir: 1 | -1;
}

export interface MarketRow extends Ticker {
  base: string;
  watched: boolean;
  tick: 'up' | 'down' | null;
}

@Component({
  selector: 'app-market-list',
  imports: [RouterLink, PricePipe, CompactNumberPipe, SignedPercentPipe],
  templateUrl: './market-list.html',
  styleUrl: './market-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarketList {
  private readonly api = inject(BinanceApiService);
  private readonly stream = inject(MarketStreamService);
  private readonly watchlist = inject(WatchlistService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly quote = QUOTE_ASSET;
  protected readonly columns: { key: SortKey; label: string }[] = [
    { key: 'symbol', label: '交易對' },
    { key: 'lastPrice', label: '最新價' },
    { key: 'priceChangePercent', label: '24h 漲跌' },
    { key: 'quoteVolume', label: '24h 成交額' },
  ];

  readonly query = signal('');
  readonly favoritesOnly = signal(false);
  readonly sort = signal<SortState>({ key: 'quoteVolume', dir: -1 });
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  private readonly tickers = signal<Record<string, Ticker>>({});
  /** 最近一次跳動方向，用來上色 */
  private readonly ticks = signal<Record<string, 'up' | 'down'>>({});
  private subscription?: Subscription;

  readonly rows = computed<MarketRow[]>(() => {
    const q = this.query().trim().toUpperCase();
    const favoritesOnly = this.favoritesOnly();
    const watched = this.watchlist.symbols();
    const ticks = this.ticks();
    const { key, dir } = this.sort();

    return Object.values(this.tickers())
      .filter((t) => !q || t.symbol.includes(q))
      .filter((t) => !favoritesOnly || watched.has(t.symbol))
      .map((t) => ({
        ...t,
        base: baseAsset(t.symbol),
        watched: watched.has(t.symbol),
        tick: ticks[t.symbol] ?? null,
      }))
      .sort((a, b) => {
        const av = a[key];
        const bv = b[key];
        return (typeof av === 'string' ? av.localeCompare(bv as string) : av - (bv as number)) * dir;
      });
  });

  readonly summary = computed(() => {
    const list = Object.values(this.tickers());
    return {
      gainers: list.filter((t) => t.priceChangePercent > 0).length,
      losers: list.filter((t) => t.priceChangePercent < 0).length,
    };
  });

  constructor() {
    this.load();
  }

  /** REST 取得初始快照 → 切換到 WebSocket 即時更新 */
  load(): void {
    this.subscription?.unsubscribe();
    this.loading.set(true);
    this.error.set(null);

    this.subscription = this.api
      .getTickers(DEFAULT_SYMBOLS)
      .pipe(
        tap((list) => {
          this.tickers.set(Object.fromEntries(list.map((t) => [t.symbol, t])));
          this.loading.set(false);
        }),
        switchMap(() => this.stream.miniTickers(DEFAULT_SYMBOLS)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (ticker) => this.applyUpdate(ticker),
        error: (err: unknown) => {
          this.error.set(err instanceof ApiError ? err.message : '載入行情失敗。');
          this.loading.set(false);
        },
      });
  }

  toggleSort(key: SortKey): void {
    this.sort.update((s) =>
      s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: key === 'symbol' ? 1 : -1 },
    );
  }

  ariaSort(key: SortKey): 'ascending' | 'descending' | 'none' {
    const s = this.sort();
    if (s.key !== key) return 'none';
    return s.dir === 1 ? 'ascending' : 'descending';
  }

  toggleWatch(symbol: string): void {
    this.watchlist.toggle(symbol);
  }

  private applyUpdate(ticker: Ticker): void {
    const prev = this.tickers()[ticker.symbol];
    if (prev && prev.lastPrice !== ticker.lastPrice) {
      const dir = ticker.lastPrice > prev.lastPrice ? 'up' : 'down';
      this.ticks.update((t) => ({ ...t, [ticker.symbol]: dir }));
    }
    this.tickers.update((all) => ({ ...all, [ticker.symbol]: ticker }));
  }
}
