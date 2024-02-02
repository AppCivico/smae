import { Transform } from 'stream';

export function JsonStringifyTransformStream() {
    return new Transform({
        writableObjectMode: true,
        readableObjectMode: false,

        transform(chunk: any, encoding: string, callback: (err?: any) => void) {
            try {
                const jsonLine = JSON.stringify(chunk) + '\n';
                this.push(jsonLine);
                callback();
            } catch (err) {
                callback(err);
            }
        },
    });
}
