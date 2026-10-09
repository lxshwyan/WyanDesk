import { describe, expect, it } from 'vitest';
import { calculateValues } from './CalculatorCard';

describe('calculator arithmetic', () => {
  it('handles the four local operations without evaluating code', () => {
    expect(calculateValues(8, 2, '+')).toBe(10);
    expect(calculateValues(8, 2, '−')).toBe(6);
    expect(calculateValues(8, 2, '×')).toBe(16);
    expect(calculateValues(8, 2, '÷')).toBe(4);
    expect(calculateValues(8, 0, '÷')).toBeNaN();
  });
});
