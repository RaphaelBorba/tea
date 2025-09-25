import { score } from './score.util';

describe('score.util', () => {
  const now = new Date('2025-09-25T00:00:00.000Z').getTime();

  it('returns 0 when likeCount is 0', () => {
    const s = score(0, new Date('2025-09-24T00:00:00.000Z'), { now });
    expect(s).toBe(0);
  });

  it('increases with likeCount (log scale)', () => {
    const s1 = score(1, new Date('2025-09-24T00:00:00.000Z'), { now });
    const s10 = score(10, new Date('2025-09-24T00:00:00.000Z'), { now });
    const s100 = score(100, new Date('2025-09-24T00:00:00.000Z'), { now });
    expect(s10).toBeGreaterThan(s1);
    expect(s100).toBeGreaterThan(s10);
  });

  it('decays with age using half-life', () => {
    const fresh = score(10, new Date('2025-09-25T00:00:00.000Z'), { now, freshnessHalfLifeHours: 24 });
    const oneDayOld = score(10, new Date('2025-09-24T00:00:00.000Z'), { now, freshnessHalfLifeHours: 24 });
    // after one half-life, score ~ half
    expect(oneDayOld).toBeCloseTo(fresh / 2, 5);
  });

  it('effectively disables decay with huge half-life', () => {
    const recent = score(10, new Date('2025-09-24T00:00:00.000Z'), { now, freshnessHalfLifeHours: 1e9 });
    const older = score(10, new Date('2025-08-24T00:00:00.000Z'), { now, freshnessHalfLifeHours: 1e9 });
    expect(older).toBeCloseTo(recent, 5);
  });
});
