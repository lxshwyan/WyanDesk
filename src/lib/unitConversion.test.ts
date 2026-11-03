import { describe, expect, it } from 'vitest';
import { convertUnit } from './unitConversion';

describe('local unit conversions', () => {
  it.each([
    ['1', 'length', 'in', 'cm', 2.54], ['3', 'mass', 'lb', 'kg', 1.36077711],
    ['0', 'temperature', 'C', 'F', 32], ['32', 'temperature', 'F', 'C', 0], ['-273.15', 'temperature', 'C', 'K', 0],
    ['1', 'area', 'mu', 'm2', 2000 / 3], ['1', 'volume', 'galUS', 'L', 3.785411784], ['1', 'volume', 'galUK', 'L', 4.54609],
    ['36', 'speed', 'kmh', 'ms', 10], ['1', 'data', 'GiB', 'MB', 1073.741824], ['1', 'data', 'MB', 'B', 1000000],
    ['1', 'time', 'day', 'h', 24], ['1e-15', 'length', 'm', 'cm', 1e-13],
  ])('%s %s %s to %s', (input, category, from, to, expected) => {
    expect(Number(convertUnit(input, category, from, to).value)).toBeCloseTo(expected, 9);
  });
  it('rejects bad input, overflow and temperatures below absolute zero', () => {
    expect(convertUnit('', 'length', 'm', 'km')).toEqual({});
    for (const input of ['Infinity', '1e999', 'NaN', '1,2', '1+2']) expect(convertUnit(input, 'length', 'm', 'km').error).toBeTruthy();
    expect(convertUnit('-274', 'temperature', 'C', 'F').error).toBeTruthy();
    expect(convertUnit('1e308', 'length', 'km', 'mm').error).toBeTruthy();
  });
  it('supports reverse conversions without changing the measurement', () => {
    const forward = convertUnit('123.45', 'length', 'ft', 'm').value!;
    expect(Number(convertUnit(forward, 'length', 'm', 'ft').value)).toBeCloseTo(123.45, 8);
  });
});
