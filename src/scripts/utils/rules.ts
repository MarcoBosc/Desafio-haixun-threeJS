export interface HoleRule {
    min: number;
    max: number;
    count: number;
  }
  
const rules: HoleRule[] = Array.from({ length: 10 }, (_, i) => ({
    min: i * 500,
    max: (i + 1) * 500,
    count: i + 2,
}));
  
  export function getHoleCount(length: number): number {
    for (const r of rules) {
      if (length >= r.min && length < r.max) return r.count;
    }
    return 2;
  }
  