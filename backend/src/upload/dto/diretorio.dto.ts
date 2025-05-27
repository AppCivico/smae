import { Transform, TransformFnParams } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class DiretorioDto {
    @IsOptional()
    @IsInt()
    @Transform((a: TransformFnParams) => (a.value === '' ? undefined : +a.value))
    projeto_id?: number;

    @IsOptional()
    @IsInt()
    @Transform((a: TransformFnParams) => (a.value === '' ? undefined : +a.value))
    transferencia_id?: number;

    @IsOptional()
    @IsInt()
    @Transform((a: TransformFnParams) => (a.value === '' ? undefined : +a.value))
    pdm_id?: number;

    @IsString()
    caminho: string;
}

export class DiretorioItemDto {
    id: number;
    caminho: string;
}

export class PatchDiretorioDto {
    @IsString()
    caminho: string;
}

export class FilterDiretorioDto {
    @IsOptional()
    @IsInt()
    @Transform((a: TransformFnParams) => (a.value === '' ? undefined : +a.value))
    projeto_id?: number;

    @IsOptional()
    @IsInt()
    @Transform((a: TransformFnParams) => (a.value === '' ? undefined : +a.value))
    transferencia_id?: number;

    @IsOptional()
    @IsInt()
    @Transform((a: TransformFnParams) => (a.value === '' ? undefined : +a.value))
    pdm_id?: number;
}

export class ListDiretorioDto {
    linhas: DiretorioItemDto[];
}
