import { MathRandom } from './math-random';

export async function RetryPromise<T>(
    promiseFn: () => Promise<T>,
    maxRetries = 100,
    delay = 25,
    jitter = 0.2
): Promise<T> {
    if (maxRetries <= 1) {
        return await promiseFn();
    }

    try {
        return await promiseFn();
    } catch (error) {
        // https://www.prisma.io/docs/reference/api-reference/error-reference
        if (
            error?.code &&
            ['P2028', 'P2034', 'P2024', 'P1017', 'P1001', 'P1002', 'P1008', 'P1011', 'P2002'].includes(error.code)
        ) {
            const jitterDelay = Math.floor(MathRandom() * delay * jitter * 2 - delay * jitter + delay);
            await new Promise((resolve) => setTimeout(resolve, jitterDelay));
            return RetryPromise(promiseFn, maxRetries - 1, delay);
        } else {
            throw error;
        }
    }
}
