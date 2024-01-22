import { TransformFnParams } from 'class-transformer';

export function NumberArrayTransform(a: TransformFnParams): number[] | undefined {
    if (Array.isArray(a.value))
        return (a.value as string[])
            .map((i) => (i === '' ? undefined : +i))
            .filter((i) => typeof i !== undefined) as number[];
    return a.value === '' ? undefined : [+a.value];
}
