import { DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { Coin } from '../../models/coin';
import { CoinService } from '../../services/coin.service';

@Component({
  selector: 'app-coin-detail',
  imports: [RouterLink, DecimalPipe],
  templateUrl: './coin-detail.html',
  styleUrl: './coin-detail.scss',
})
export class CoinDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private coinService = inject(CoinService);

  coin = signal<Coin | null>(null);
  loading = signal(false);
  error = signal('');

  ngOnInit(): void {
    // 從網址 /coin/:symbol 取得幣種代號
    const symbol = this.route.snapshot.paramMap.get('symbol') ?? '';

    this.loading.set(true);
    this.coinService.getCoin(symbol).subscribe({
      next: (coin) => {
        this.coin.set(coin);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('找不到這個幣種，或資料載入失敗。');
        this.loading.set(false);
      },
    });
  }
}
