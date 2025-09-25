export interface ScoreOptions {
  now?: number; // ms epoch
  freshnessHalfLifeHours?: number; // how fast freshness decays
}

export function score(likeCount: number, createdAt: Date, opts: ScoreOptions = {}): number {
  const now = opts.now ?? Date.now();
  const ageHours = Math.max(0, (now - createdAt.getTime()) / (1000 * 60 * 60));
  const base = Math.log10((likeCount ?? 0) + 1);
  const halfLife = opts.freshnessHalfLifeHours ?? 24; // 1 day half-life by default
  const decay = Math.pow(0.5, ageHours / halfLife);
  return base * decay;
}


