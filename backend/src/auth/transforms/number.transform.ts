import { TransformFnParams } from 'class-transformer';
import { MAX_DTO_SAFE_NUM, MIN_DTO_SAFE_NUM } from '../../common/dto/consts';

export function NumberTransform(a: TransformFnParams): number | undefined {
    const n = a.value === '' ? undefined : +a.value;

    // geralmente queremos números menores que 32 bits
    if (n && !isNaN(n) && n <= MAX_DTO_SAFE_NUM && n >= MIN_DTO_SAFE_NUM) return n;
    return n;
}

export function PositiveNumberTransform(a: TransformFnParams): number | undefined {
    const n = a.value === '' ? undefined : +a.value;

    // geralmente queremos números menores que 32 bits
    if (n && !isNaN(n) && n <= MAX_DTO_SAFE_NUM && n >= 0) return n;
    return n;
}
