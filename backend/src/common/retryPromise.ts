export async function RetryPromise<T>(promiseFn: () => Promise<T>, maxRetries = 100, delay = 25, jitter = 0.2): Promise<T> {
    if (maxRetries <= 1) {
        return await promiseFn();
    }

    try {
        return await promiseFn();
    } catch (error) {
        if (error && error?.code === 'P2034') {
            const jitterDelay = Math.floor(Math.random() * delay * jitter * 2 - delay * jitter + delay);
            await new Promise((resolve) => setTimeout(resolve, jitterDelay));
            return RetryPromise(promiseFn, maxRetries - 1, delay);
        } else {
            throw error;
        }
    }
}
