import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class DiretorioDto {
    @IsInt()
    @Transform((a: any) => (a.value === '' ? undefined : +a.value))
    projeto_id: number;

    @IsString()
    caminho: string;
}

export class DiretorioItemDto  {
    id: number;
    caminho: string;
}

export class PatchDiretorioDto  {
    caminho: string;
}

export class FilterDiretorioDto {
    @IsInt()
    @Transform((a: any) => (a.value === '' ? undefined : +a.value))
    projeto_id: number;
}

export class ListDiretorioDto {
    linhas: DiretorioItemDto[];
}
