import { Readable } from 'stream';

/**
 * Converts a readable stream to a buffer.
 * @param stream - The readable stream to convert.
 * @returns A promise that resolves to a buffer containing the data from the stream.
 */
export async function Stream2Buffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
        const _buf = Array<any>();
        stream.on('data', (chunk) => _buf.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(_buf)));
        stream.on('error', (err) => reject(`error converting stream - ${err}`));
    });
}

/**
 * Emits an error event and destroys the stream.
 *
 * @param stream - The stream to emit the error event and destroy.
 * @returns A function that can be used as a callback to emit the error event and destroy the stream.
 */
export function EmitErrorAndDestroyStream(
    stream: Readable
): ((reason: unknown) => void | PromiseLike<void>) | null | undefined {
    return (err) => {
        stream.emit('error', { err });
        stream.destroy();
    };
}

/**
 * Converts a readable stream to a promise that resolves when the stream ends,
 * and populates an output array with the stream chunks.
 *
 * @param queryStream - The readable stream to convert.
 * @param outputArray - The array to populate with the stream chunks.
 * @returns A promise that resolves with a boolean value indicating the success of the operation.
 */
export const Stream2PromiseIntoArray = (queryStream: Readable, outputArray: unknown[]) => {
    return new Promise((resolve, reject) => {
        queryStream
            .on('data', (chunk) => {
                outputArray.push(chunk);
            })
            .on('end', () => {
                resolve(true);
            })
            .on('error', reject);
    });
};
