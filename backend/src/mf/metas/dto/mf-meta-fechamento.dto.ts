import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class FilterFechamentoDto {
    @IsInt()
    @Transform(({ value }: any) => +value)
    ciclo_fisico_id: number;

    @IsInt()
    @Transform(({ value }: any) => +value)
    meta_id: number;

    /**
     * trazer apenas a analise mais recente?
     * @example "true"
     */
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }: any) => value === 'true')
    apenas_ultima_revisao?: boolean;
}

export class MfFechamentoDto {
    comentario: string;

    referencia_data: string;
    ultima_revisao: boolean;
    criado_em: Date;
    criador: {
        nome_exibicao: string;
    };
    meta_id: number;

    id: number;
}

// que raiva desse lugar que ficou com uppercase!
export class MfListFechamentoDto {
    Fechamentos: MfFechamentoDto[];
}

export class FechamentoDto {
    @IsInt()
    @Transform(({ value }: any) => +value)
    ciclo_fisico_id: number;

    @IsInt()
    @Transform(({ value }: any) => +value)
    meta_id: number;

    @IsString()
    comentario: string;
}
