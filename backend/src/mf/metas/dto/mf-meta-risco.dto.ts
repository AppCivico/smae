import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

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
    @MaxLength(1024 * 10, { message: 'O texto não pode ter mais de 10KB' })
    detalhamento: string;

    @IsString()
    @MaxLength(1024 * 10, { message: 'O texto não pode ter mais de 10KB' })
    ponto_de_atencao: string;
}
