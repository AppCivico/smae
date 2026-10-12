import { HttpException, HttpStatus } from '@nestjs/common';
import { Response as ExpressResponse } from 'express';
import { Readable } from 'stream';
import { JsonStringifyTransformStream } from '../../auth/pipe/JsonStringifyTransformStream.pipe';

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

/** O 200 só sai com o primeiro chunk, então erro antes de qualquer dado responde com o status da HttpException. */
export function PipeJsonLinesToResponse(stream: Readable, res: ExpressResponse): void {
    const transformStream = JsonStringifyTransformStream();

    stream.on('error', (reason: unknown) => {
        // EmitErrorAndDestroyStream emite { err }
        const err = reason && typeof reason === 'object' && 'err' in reason ? (reason as { err: unknown }).err : reason;
        console.log(err);
        if (res.writableEnded) return;

        if (!res.headersSent) {
            stream.unpipe(transformStream);
            transformStream.unpipe(res);

            const status = err instanceof HttpException ? err.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
            let body = err instanceof HttpException ? err.getResponse() : {};
            if (typeof body === 'string') body = { message: body };

            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.status(status).send(
                JSON.stringify({
                    statusCode: status,
                    message: 'Erro interno/não esperado... Contate um administrador do sistema ou tente novamente.',
                    ...body,
                })
            );
            return;
        }

        res.write(JSON.stringify({ error: 'error occurred during stream processing' }));
        res.end();
    });

    res.setHeader('Content-Type', 'application/jsonlines+json');
    stream.pipe(transformStream).pipe(res);
}
