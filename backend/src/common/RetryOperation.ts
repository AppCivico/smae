import { sleepFor } from './sleepFor';

export async function RetryOperation<T>(
    maxTries: number,
    callback: () => Promise<T>,
    onError: (error: any) => Promise<void>
) {
    let tries = 0;
    let error: any;

    do {
        try {
            return await callback(); // return the result of the callback
        } catch (err) {
            error = err;
            console.error(err);
            await sleepFor(1000); // wait for 1 second
        }
    } while (++tries < maxTries);

    // if we reach this point, the max retries has been exceeded
    // call the error handler callback
    await onError(error);
    throw error;
}
