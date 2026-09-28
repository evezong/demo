import { Pipe, PipeTransform } from '@angular/core';

const formatters = new Map<number, Intl.NumberFormat>();

function formatter(digits: number): Intl.NumberFormat {
  let f = formatters.get(digits);
  if (!f) {
    f = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
    formatters.set(digits, f);
  }
  return f;
}

/** 依價格量級決定小數位數：BTC 顯示 2 位、DOGE 顯示 5 位 */
export function priceDigits(value: number): number {
  const abs = Math.abs(value);
  if (abs >= 1000) return 2;
  if (abs >= 1) return 4;
  return 5;
}

@Pipe({ name: 'price' })
export class PricePipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value == null || Number.isNaN(value)) return '--';
    return formatter(priceDigits(value)).format(value);
  }
}
