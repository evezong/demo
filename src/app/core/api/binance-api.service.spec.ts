import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { ApiError, httpErrorInterceptor } from '../http/http-error.interceptor';
import { BINANCE_REST_URL } from '../market.config';
import { BinanceApiService } from './binance-api.service';

const BASE = 'https://test.local/api';

describe('BinanceApiService', () => {
  let service: BinanceApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([httpErrorInterceptor])),
        provideHttpClientTesting(),
        { provide: BINANCE_REST_URL, useValue: BASE },
      ],
    });
    service = TestBed.inject(BinanceApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('fetches tickers and converts strings to numbers', async () => {
    const result = firstValueFrom(service.getTickers(['BTCUSDT']));

    const req = http.expectOne((r) => r.url === `${BASE}/ticker/24hr`);
    expect(req.request.params.get('symbols')).toBe('["BTCUSDT"]');
    req.flush([
      {
        symbol: 'BTCUSDT',
        lastPrice: '83700.00',
        openPrice: '84432.00',
        highPrice: '85000.00',
        lowPrice: '83000.00',
        priceChangePercent: '-0.867',
        quoteVolume: '1234567.89',
      },
    ]);

    expect(await result).toEqual([
      {
        symbol: 'BTCUSDT',
        lastPrice: 83700,
        openPrice: 84432,
        highPrice: 85000,
        lowPrice: 83000,
        priceChangePercent: -0.867,
        quoteVolume: 1234567.89,
      },
    ]);
  });

  it('maps kline tuples to objects', async () => {
    const result = firstValueFrom(service.getKlines('ETHUSDT', '1h', 2));

    const req = http.expectOne((r) => r.url === `${BASE}/klines`);
    expect(req.request.params.get('interval')).toBe('1h');
    expect(req.request.params.get('limit')).toBe('2');
    req.flush([[1000, '1', '3', '0.5', '2', '10', 1999, '20', 5, '1', '2', '0']]);

    expect(await result).toEqual([
      { openTime: 1000, open: 1, high: 3, low: 0.5, close: 2, volume: 10 },
    ]);
  });

  it('returns recent trades newest first', async () => {
    const result = firstValueFrom(service.getRecentTrades('BTCUSDT', 2));

    http.expectOne((r) => r.url === `${BASE}/trades`).flush([
      { id: 1, price: '100', qty: '1', time: 1, isBuyerMaker: false },
      { id: 2, price: '101', qty: '2', time: 2, isBuyerMaker: true },
    ]);

    expect((await result).map((t) => t.id)).toEqual([2, 1]);
  });

  it('turns HTTP errors into user-friendly ApiError', async () => {
    const result = firstValueFrom(service.getTicker('NOPE'));

    http
      .expectOne((r) => r.url === `${BASE}/ticker/24hr`)
      .flush({ code: -1121, msg: 'Invalid symbol.' }, { status: 400, statusText: 'Bad Request' });

    await expect(result).rejects.toBeInstanceOf(ApiError);
    await expect(result).rejects.toMatchObject({ status: 400, message: '查無此交易對或參數錯誤。' });
  });
});
