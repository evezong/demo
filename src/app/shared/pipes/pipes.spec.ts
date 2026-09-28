import { CompactNumberPipe } from './compact-number.pipe';
import { PricePipe, priceDigits } from './price.pipe';
import { SignedPercentPipe } from './signed-percent.pipe';

describe('PricePipe', () => {
  const pipe = new PricePipe();

  it('adjusts decimals by magnitude', () => {
    expect(priceDigits(83700)).toBe(2);
    expect(priceDigits(2.5)).toBe(4);
    expect(priceDigits(0.1234)).toBe(5);
  });

  it('formats with thousands separator', () => {
    expect(pipe.transform(83700.5)).toBe('83,700.50');
    expect(pipe.transform(0.12345)).toBe('0.12345');
  });

  it('returns placeholder for empty values', () => {
    expect(pipe.transform(null)).toBe('--');
    expect(pipe.transform(NaN)).toBe('--');
  });
});

describe('CompactNumberPipe', () => {
  it('formats large numbers', () => {
    expect(new CompactNumberPipe().transform(1_234_567_890)).toBe('1.23B');
  });
});

describe('SignedPercentPipe', () => {
  const pipe = new SignedPercentPipe();

  it('adds a plus sign to positive values', () => {
    expect(pipe.transform(1.234)).toBe('+1.23%');
    expect(pipe.transform(-0.5)).toBe('-0.50%');
    expect(pipe.transform(0)).toBe('0.00%');
  });
});
