export { ML_CATEGORIES, ML_TOPICS, ALL_ML_LESSONS, TOTAL_ML_LESSONS } from './ml-data';
export function avg(arr: number[]): number {
  return arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;
}
