import { TransformFnParams } from 'class-transformer';

export function NumberTransform(a: TransformFnParams): number | undefined {
    const n = a.value === '' ? undefined : +a.value;

    // geralmente queremos números menores que 32 bits
    if (n && !isNaN(n) && n <= 2147483647) return n;
    return n;
}

export function PositiveNumberTransform(a: TransformFnParams): number | undefined {
    const n = a.value === '' ? undefined : +a.value;

    // geralmente queremos números menores que 32 bits
    if (n && !isNaN(n) && n <= 2147483647 && n >= 0) return n;
    return n;
}
