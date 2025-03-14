import { TransformFnParams } from 'class-transformer';
import { MAX_DTO_SAFE_NUM, MIN_DTO_SAFE_NUM } from '../../common/dto/consts';

export function NumberTransformOrUndef(a: TransformFnParams): number | undefined {
    if (a.value === '') return undefined;

    const n = +a.value;
    if (!isNaN(n) && n <= MAX_DTO_SAFE_NUM && n >= MIN_DTO_SAFE_NUM) return n;
    return undefined;
}

export function PositiveNumberTransformOrUndef(a: TransformFnParams): number | undefined {
    if (a.value === '') return undefined;

    const n = +a.value;
    if (!isNaN(n) && n <= MAX_DTO_SAFE_NUM && n >= 0) return n;
    return undefined;
}

export function NumberTransform(a: TransformFnParams): number {
    if (a.value === '') return 0;

    const n = +a.value;
    if (!isNaN(n) && n <= MAX_DTO_SAFE_NUM && n >= MIN_DTO_SAFE_NUM) return n;
    return 0;
}

export function PositiveNumberTransform(a: TransformFnParams): number {
    if (a.value === '') return 0;

    const n = +a.value;
    if (!isNaN(n) && n <= MAX_DTO_SAFE_NUM && n >= 0) return n;
    return 0;
}
