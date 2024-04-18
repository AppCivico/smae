import { TransformFnParams } from 'class-transformer';

export const StringArrayTransform = (a: TransformFnParams): string[] | undefined => {
    if (Array.isArray(a.value)) return a.value;
    return a.value === '' ? undefined : [a.value];
};
