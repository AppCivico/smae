import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { MAX_LENGTH_DEFAULT } from 'src/common/consts';

export class FilterRiscoDto {
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

export class MfRiscoDto {
    detalhamento: string;
    ponto_de_atencao: string;

    referencia_data: string;
    ultima_revisao: boolean;
    criado_em: Date;
    criador: {
        nome_exibicao: string;
    };
    meta_id: number;

    id: number;
}

export class MfListRiscoDto {
    riscos: MfRiscoDto[];
}

export class RiscoDto {
    @IsInt()
    @Transform(({ value }: any) => +value)
    ciclo_fisico_id: number;

    @IsInt()
    @Transform(({ value }: any) => +value)
    meta_id: number;

    @IsString()
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Detalhamento' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    detalhamento: string;

    @IsString()
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Ponto de atenção' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    ponto_de_atencao: string;
}
