import { describe, expect, it } from 'vitest';
import { deskConversionAllowed } from './usageAnalytics';

describe('desk usage analytics', () => {
  it('accepts only preset conversion stages', () => {
    expect(deskConversionAllowed('capture_saved')).toBe(true);
    expect(deskConversionAllowed('capture.user-01JZ4W1K4Y7K8R9S')).toBe(false);
  });
});
