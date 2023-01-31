import { TipoDocumento } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class AnaliseQualitativaDocumentoDto {
    @IsInt()
    @Transform(({ value }: any) => +value)
    ciclo_fisico_id: number;

    @IsInt()
    @Transform(({ value }: any) => +value)
    meta_id: number;

    /**
     * Upload do Documento
     */
    @IsString({ message: '$property| upload_token de um arquivo' })
    upload_token: string;
}

export class FilterAnaliseQualitativaDto {
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

export class MfAnaliseQualitativaDto {
    informacoes_complementares: string;
    referencia_data: string;
    ultima_revisao: boolean;
    criado_em: Date;
    criador: {
        nome_exibicao: string;
    };
    meta_id: number;

    id: number;
}

export class ArquivoAnaliseQualitativaDocumentoDto {
    arquivo: {
        id: number;
        descricao: string | null;
        tamanho_bytes: number;
        TipoDocumento: TipoDocumento | null;
        nome_original: string;
        download_token?: string;
    };
    id: number;
    criado_em: Date;
    criador: {
        nome_exibicao: string;
    };
}

export class MfListAnaliseQualitativaDto {
    analises: MfAnaliseQualitativaDto[];
    arquivos: ArquivoAnaliseQualitativaDocumentoDto[];
}

export class AnaliseQualitativaDto {
    @IsInt()
    @Transform(({ value }: any) => +value)
    ciclo_fisico_id: number;

    @IsInt()
    @Transform(({ value }: any) => +value)
    meta_id: number;

    @IsString()
    informacoes_complementares: string;
}
