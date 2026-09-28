import { Pipe, PipeTransform } from '@angular/core';

const compact = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 2,
});

/** 1234567 -> 1.23M */
@Pipe({ name: 'compactNumber' })
export class CompactNumberPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value == null || Number.isNaN(value)) return '--';
    return compact.format(value);
  }
}
