import { TestBed } from '@angular/core/testing';

import { WatchlistService } from './watchlist.service';

describe('WatchlistService', () => {
  beforeEach(() => localStorage.clear());

  it('toggles a symbol and persists to localStorage', () => {
    const service = TestBed.inject(WatchlistService);

    service.toggle('BTCUSDT');
    expect(service.has('BTCUSDT')).toBe(true);
    expect(JSON.parse(localStorage.getItem('rw.watchlist')!)).toEqual(['BTCUSDT']);

    service.toggle('BTCUSDT');
    expect(service.has('BTCUSDT')).toBe(false);
  });

  it('restores saved symbols and ignores corrupted data', () => {
    localStorage.setItem('rw.watchlist', '["ETHUSDT", 42]');
    expect([...new WatchlistService().symbols()]).toEqual(['ETHUSDT']);

    localStorage.setItem('rw.watchlist', '{not json');
    expect(new WatchlistService().symbols().size).toBe(0);
  });
});
