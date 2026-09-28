import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

import { MarketStreamService } from './core/api/market-stream.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly stream = inject(MarketStreamService);

  protected readonly status = this.stream.status;
  protected readonly statusLabel = computed(() => {
    switch (this.status()) {
      case 'open':
        return '即時連線中';
      case 'connecting':
        return '連線中…';
      case 'reconnecting':
        return '重新連線中…';
      default:
        return '未連線';
    }
  });
}
