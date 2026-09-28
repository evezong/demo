import { Pipe, PipeTransform } from '@angular/core';

/** 1.234 -> +1.23% */
@Pipe({ name: 'signedPercent' })
export class SignedPercentPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value == null || Number.isNaN(value)) return '--';
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  }
}
