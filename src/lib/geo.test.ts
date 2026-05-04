import { describe, expect, it } from 'vitest';
import { formatDistance, hasCoords, haversineKm } from './geo';

const helsinki = { latitude: 60.1699, longitude: 24.9384 };
const kokkola = { latitude: 63.8378, longitude: 23.1314 };

describe('haversineKm', () => {
  it('returns 0 for the same point', () => {
    expect(haversineKm(helsinki, helsinki)).toBeCloseTo(0, 5);
  });

  it('Helsinki to Kokkola is ~410 km (sanity check)', () => {
    const km = haversineKm(helsinki, kokkola);
    expect(km).toBeGreaterThan(400);
    expect(km).toBeLessThan(425);
  });

  it('is symmetric', () => {
    expect(haversineKm(helsinki, kokkola)).toBeCloseTo(
      haversineKm(kokkola, helsinki),
      9,
    );
  });
});

describe('formatDistance', () => {
  it('renders meters under 1 km', () => {
    expect(formatDistance(0.85)).toBe('850 m');
  });

  it('renders one decimal between 1 and 10 km', () => {
    expect(formatDistance(3.42)).toBe('3.4 km');
  });

  it('rounds to integer km above 10', () => {
    expect(formatDistance(412.7)).toBe('413 km');
  });

  it('handles invalid input', () => {
    expect(formatDistance(Number.NaN)).toBe('');
    expect(formatDistance(-1)).toBe('');
  });
});

describe('hasCoords', () => {
  it('accepts valid coordinates', () => {
    expect(hasCoords({ latitude: 1, longitude: 2 })).toBe(true);
  });

  it('rejects nulls and missing fields', () => {
    expect(hasCoords(null)).toBe(false);
    expect(hasCoords(undefined)).toBe(false);
    expect(hasCoords({ latitude: null, longitude: 2 })).toBe(false);
    expect(hasCoords({ latitude: 1, longitude: null })).toBe(false);
  });
});
