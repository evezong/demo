import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';

import { Kline } from '../../core/models/market.models';
import { PricePipe } from '../pipes/price.pipe';
import { buildCandleGeometry, indexAtRatio } from './candle-geometry';

/** 以純 SVG 繪製的 K 線圖；viewBox 固定、寬度跟著容器縮放 */
@Component({
  selector: 'app-candle-chart',
  imports: [DatePipe, PricePipe],
  templateUrl: './candle-chart.html',
  styleUrl: './candle-chart.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CandleChart {
  readonly klines = input.required<readonly Kline[]>();

  protected readonly width = 1000;
  protected readonly height = 360;

  protected readonly geometry = computed(() =>
    buildCandleGeometry(this.klines(), this.width, this.height),
  );

  private readonly hoverIndex = signal<number | null>(null);

  /** 圖例：滑鼠 / 手指所在的 K 線，否則顯示最新一根 */
  protected readonly active = computed(() => {
    const list = this.klines();
    const i = this.hoverIndex() ?? list.length - 1;
    const kline = list[i];
    const candle = this.geometry().candles[i];
    return kline && candle ? { kline, candle, hovering: this.hoverIndex() !== null } : null;
  });

  protected onPointerMove(event: PointerEvent): void {
    const rect = (event.currentTarget as Element).getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    this.hoverIndex.set(indexAtRatio(ratio, this.klines().length));
  }

  protected onPointerLeave(): void {
    this.hoverIndex.set(null);
  }
}
