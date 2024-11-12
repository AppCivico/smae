import { MathRandom } from './math-random';

export function ArrayShuffle(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(MathRandom() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

export function SeriesArrayShuffle(array: any[]) {
    if (process.env.DISABLE_SHUFFLE) return;

    ArrayShuffle(array);
}
