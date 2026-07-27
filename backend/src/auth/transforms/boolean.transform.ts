import { TransformFnParams } from 'class-transformer';

export function OptionalBooleanTransform(a: TransformFnParams): boolean | undefined {
    if (a.value === true || a.value === 'true') return true;
    if (a.value === false || a.value === 'false') return false;
    return a.value;
}
