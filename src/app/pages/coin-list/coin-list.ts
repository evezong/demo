import { DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Coin } from '../../models/coin';
import { CoinService } from '../../services/coin.service';

@Component({
  selector: 'app-coin-list',
  imports: [RouterLink, DecimalPipe],
  templateUrl: './coin-list.html',
  styleUrl: './coin-list.scss',
})
export class CoinList implements OnInit {
  private coinService = inject(CoinService);

  coins = signal<Coin[]>([]);
  loading = signal(false);
  error = signal('');
  keyword = signal('');

  // 依搜尋關鍵字過濾
  filteredCoins = computed(() => {
    const keyword = this.keyword().trim().toUpperCase();
    return this.coins().filter((coin) => coin.name.includes(keyword));
  });

  ngOnInit(): void {
    this.loadCoins();
  }

  loadCoins(): void {
    this.loading.set(true);
    this.error.set('');

    this.coinService.getCoins().subscribe({
      next: (coins) => {
        this.coins.set(coins);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('資料載入失敗，請稍後再試。');
        this.loading.set(false);
      },
    });
  }

  onSearch(event: Event): void {
    this.keyword.set((event.target as HTMLInputElement).value);
  }
}
