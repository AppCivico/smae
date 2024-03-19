import { Transform, TransformFnParams } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class DiretorioDto {
    @IsOptional()
    @IsInt()
    @Transform((a: TransformFnParams) => (a.value === '' ? undefined : +a.value))
    projeto_id?: number;

    @IsOptional()
    @IsInt()
    @Transform((a: TransformFnParams) => (a.value === '' ? undefined : +a.value))
    transferencia_id?: number;

    @IsString()
    caminho: string;
}

export class DiretorioItemDto {
    id: number;
    caminho: string;
}

export class PatchDiretorioDto {
    @IsString()
    @MaxLength(2000)
    caminho: string;
}

export class FilterDiretorioDto {
    @IsInt()
    @Transform((a: TransformFnParams) => (a.value === '' ? undefined : +a.value))
    projeto_id: number;

    @IsInt()
    @Transform((a: TransformFnParams) => (a.value === '' ? undefined : +a.value))
    transferencia_id: number;
}

export class ListDiretorioDto {
    linhas: DiretorioItemDto[];
}
