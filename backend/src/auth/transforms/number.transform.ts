import { TransformFnParams } from 'class-transformer';
import { MAX_DTO_SAFE_NUM, MIN_DTO_SAFE_NUM } from '../../common/dto/consts';
import { BadRequestException } from '@nestjs/common';

export function NumberTransform(a: TransformFnParams): number {
    console.log('NumberTransform', a.value);
    if (a.value === '') {
        const stack = new Error().stack;
        throw new BadRequestException(
            'Número não pode ser vazio em NumberTransform, verificar mudança para NumberTransformOrUndef. Stack: ' +
                stack
        );
    }

    const n = +a.value;
    if (!isNaN(n) && n <= MAX_DTO_SAFE_NUM && n >= MIN_DTO_SAFE_NUM) return n;

    const stack = new Error().stack;
    throw new BadRequestException(`Número inválido ${n}. Stack: ` + stack);
}

export function PositiveNumberTransform(a: TransformFnParams): number {
    if (a.value === '') {
        const stack = new Error().stack;
        throw new BadRequestException(
            'Número não pode ser vazio em PositiveNumberTransform, verificar mudança para PositiveNumberTransformOrUndef. Stack: ' +
                stack
        );
    }

    const n = +a.value;
    if (!isNaN(n) && n <= MAX_DTO_SAFE_NUM && n >= 0) return n;
    const stack = new Error().stack;
    throw new BadRequestException(`Número inválido ${n}. Stack: ` + stack);
}

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
