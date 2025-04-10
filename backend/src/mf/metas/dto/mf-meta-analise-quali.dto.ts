import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { ArquivoBaseDto } from '../../../upload/dto/create-upload.dto';
import { PickType } from '@nestjs/swagger';

export class AnaliseQualitativaDocumentoDto {
    @IsInt()
    @Transform(({ value }: any) => +value)
    ciclo_fisico_id: number;

    @IsInt()
    @Transform(({ value }: any) => +value)
    meta_id: number;

    @IsOptional()
    @IsString()
    @MaxLength(2048, { message: 'O campo Descrição precisa ter no máximo 2048 caracteres' })
    descricao?: string | null;

    /**
     * Upload do Documento
     */
    @IsString({ message: '$property| upload_token de um arquivo' })
    upload_token: string;
}
export class UpdateAnaliseQualitativaDocumentoDto extends PickType(AnaliseQualitativaDocumentoDto, ['descricao']) {}

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
    arquivo: ArquivoBaseDto;
    id: number;
    criado_em: Date;
    criador: {
        nome_exibicao: string;
    };
    @MaxLength(2048, { message: 'O campo "Descrição" deve ter no máximo 2048 caracteres' })
    descricao: string | null;
}

export class MfListAnaliseQualitativaDto {
    analises: MfAnaliseQualitativaDto[];
    arquivos: ArquivoAnaliseQualitativaDocumentoDto[];
}

export class CreateAnaliseQualitativaDto {
    @IsInt()
    @Transform(({ value }: any) => +value)
    ciclo_fisico_id: number;

    @IsInt()
    @Transform(({ value }: any) => +value)
    meta_id: number;

    @IsString()
    @MaxLength(255, {message: 'O campo "Informações complementares" deve ter no máximo 255 caracteres'})
    informacoes_complementares: string;
}
