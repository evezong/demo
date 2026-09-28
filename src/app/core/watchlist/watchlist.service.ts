import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'rw.watchlist';

/** 自選清單，保存在 localStorage */
@Injectable({ providedIn: 'root' })
export class WatchlistService {
  private readonly _symbols = signal<ReadonlySet<string>>(this.load());
  readonly symbols = this._symbols.asReadonly();

  has(symbol: string): boolean {
    return this._symbols().has(symbol);
  }

  toggle(symbol: string): void {
    const next = new Set(this._symbols());
    if (next.has(symbol)) {
      next.delete(symbol);
    } else {
      next.add(symbol);
    }
    this._symbols.set(next);
    this.save(next);
  }

  private load(): Set<string> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(parsed) ? parsed.filter((s) => typeof s === 'string') : []);
    } catch {
      return new Set();
    }
  }

  private save(symbols: ReadonlySet<string>): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...symbols]));
    } catch {
      // 無痕模式等情況無法寫入，忽略即可
    }
  }
}
