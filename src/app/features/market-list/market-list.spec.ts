import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NEVER, Subject, of, throwError } from 'rxjs';

import { BinanceApiService } from '../../core/api/binance-api.service';
import { MarketStreamService } from '../../core/api/market-stream.service';
import { ApiError } from '../../core/http/http-error.interceptor';
import { Ticker } from '../../core/models/market.models';
import { MarketList } from './market-list';

const ticker = (symbol: string, lastPrice: number, quoteVolume: number, pct = 1): Ticker => ({
  symbol,
  lastPrice,
  openPrice: lastPrice,
  highPrice: lastPrice,
  lowPrice: lastPrice,
  priceChangePercent: pct,
  quoteVolume,
});

describe('MarketList', () => {
  let updates: Subject<Ticker>;

  beforeEach(async () => {
    localStorage.clear();
    updates = new Subject<Ticker>();

    await TestBed.configureTestingModule({
      imports: [MarketList],
      providers: [
        provideRouter([]),
        {
          provide: BinanceApiService,
          useValue: {
            getTickers: () =>
              of([
                ticker('BTCUSDT', 80000, 500, 2),
                ticker('ETHUSDT', 3000, 900, -1),
                ticker('DOGEUSDT', 0.2, 100, 5),
              ]),
          },
        },
        { provide: MarketStreamService, useValue: { miniTickers: () => updates, status: () => 'idle' } },
      ],
    }).compileComponents();
  });

  function setup() {
    const fixture = TestBed.createComponent(MarketList);
    return { fixture, list: fixture.componentInstance };
  }

  it('sorts by volume desc by default', () => {
    const { list } = setup();
    expect(list.rows().map((r) => r.symbol)).toEqual(['ETHUSDT', 'BTCUSDT', 'DOGEUSDT']);
    expect(list.summary()).toEqual({ gainers: 2, losers: 1 });
  });

  it('toggles sort direction on the same column', () => {
    const { list } = setup();
    list.toggleSort('lastPrice');
    expect(list.rows()[0].symbol).toBe('BTCUSDT');
    list.toggleSort('lastPrice');
    expect(list.rows()[0].symbol).toBe('DOGEUSDT');
  });

  it('filters by search query and favorites', () => {
    const { list } = setup();
    list.query.set('eth');
    expect(list.rows().map((r) => r.symbol)).toEqual(['ETHUSDT']);

    list.query.set('');
    list.toggleWatch('DOGEUSDT');
    list.favoritesOnly.set(true);
    expect(list.rows().map((r) => r.symbol)).toEqual(['DOGEUSDT']);
  });

  it('applies realtime updates and records tick direction', () => {
    const { list } = setup();
    updates.next(ticker('BTCUSDT', 81000, 500));

    const btc = list.rows().find((r) => r.symbol === 'BTCUSDT')!;
    expect(btc.lastPrice).toBe(81000);
    expect(btc.tick).toBe('up');
  });

  it('renders one row per ticker', async () => {
    const { fixture } = setup();
    await fixture.whenStable();
    const rows = (fixture.nativeElement as HTMLElement).querySelectorAll('.row:not(.row--head)');
    expect(rows.length).toBe(3);
  });
});

describe('MarketList error state', () => {
  it('shows the error message', async () => {
    await TestBed.configureTestingModule({
      imports: [MarketList],
      providers: [
        provideRouter([]),
        { provide: BinanceApiService, useValue: { getTickers: () => throwError(() => new ApiError('連線失敗', 0)) } },
        { provide: MarketStreamService, useValue: { miniTickers: () => NEVER } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(MarketList);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('[role=alert]')?.textContent).toContain('連線失敗');
  });
});
