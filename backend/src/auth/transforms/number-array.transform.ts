import { TransformFnParams } from 'class-transformer';
import { MAX_DTO_SAFE_NUM, MIN_DTO_SAFE_NUM } from '../../common/dto/consts';

export function NumberArrayTransformOrUndef(a: TransformFnParams): number[] | undefined {
    if (Array.isArray(a.value)) {
        const result: number[] = [];

        for (const currentValue of a.value) {
            if (currentValue === '') continue;

            const n = +currentValue;
            if (!isNaN(n) && n <= MAX_DTO_SAFE_NUM && n >= MIN_DTO_SAFE_NUM) result.push(n);
        }

        return result.length > 0 ? result : undefined;
    } else if (a.value !== '') {
        const n = +a.value;
        return isNaN(n) && n <= MAX_DTO_SAFE_NUM && n >= MIN_DTO_SAFE_NUM ? undefined : [n];
    }

    return undefined;
}

export function NumberArrayTransformOrEmpty(a: TransformFnParams): number[] {
    if (Array.isArray(a.value)) {
        const result: number[] = [];

        for (const currentValue of a.value) {
            if (currentValue === '') continue;

            const n = +currentValue;
            if (!isNaN(n) && n <= MAX_DTO_SAFE_NUM && n >= MIN_DTO_SAFE_NUM) result.push(n);
        }

        return result;
    } else if (a.value !== '') {
        const n = +a.value;
        return isNaN(n) && n <= MAX_DTO_SAFE_NUM && n >= MIN_DTO_SAFE_NUM ? [] : [n];
    }

    return [];
}
