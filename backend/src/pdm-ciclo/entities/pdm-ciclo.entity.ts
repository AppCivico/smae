import { ApiProperty } from '@nestjs/swagger';
import { IsDateYMD } from '../../auth/decorators/date.decorator';
import { DateYMD } from '../../common/date2ymd';
import {
    ArquivoAnaliseQualitativaDocumentoDto,
    MfAnaliseQualitativaDto,
    MfListAnaliseQualitativaDto,
} from '../../mf/metas/dto/mf-meta-analise-quali.dto';
import { MfFechamentoDto, MfListFechamentoDto } from '../../mf/metas/dto/mf-meta-fechamento.dto';
import { MfListRiscoDto, MfRiscoDto } from '../../mf/metas/dto/mf-meta-risco.dto';
import { CicloFisicoDto } from '../../pdm/dto/list-pdm.dto';

export const DocumentoEditavelTipo = {
    analise: 'analise',
    risco: 'risco',
    fechamento: 'fechamento',
} as const;

export type DocumentoEditavelTipo = (typeof DocumentoEditavelTipo)[keyof typeof DocumentoEditavelTipo];

export class ListPdmCicloDto {
    linhas: CicloFisicoDto[];
}

export class CicloFisicoV2Dto {
    id: number;
    @IsDateYMD()
    data_ciclo: DateYMD;
    @IsDateYMD()
    inicio_coleta: DateYMD;
    @IsDateYMD()
    inicio_qualificacao: DateYMD;
    @IsDateYMD()
    inicio_analise_risco: DateYMD;
    @IsDateYMD()
    inicio_fechamento: DateYMD;
    @IsDateYMD()
    fechamento: DateYMD;
    pode_editar: boolean;
    ativo: boolean;
}

export class ListPdmCicloV2Dto {
    linhas: CicloFisicoV2Dto[];
}

export class CicloFisicoPSDto {
    id: number;
    @IsDateYMD()
    data_ciclo: DateYMD;
    ativo: boolean;
}

export class DadosCicloFisicoPSDto {
    id: number;
    @IsDateYMD()
    data_ciclo: DateYMD;
}

export class UltimaRevisao {
    analise: MfAnaliseQualitativaDto | null;
    risco: MfRiscoDto | null;
    fechamento: MfFechamentoDto | null;
}

export class ListPSCicloDto {
    linhas: CicloFisicoPSDto[];
    ultima_revisao: UltimaRevisao | null;

    @ApiProperty({
        enum: DocumentoEditavelTipo,
        isArray: true,
        enumName: 'DocumentoEditavelTipo',
        example: ['analise', 'risco'],
    })
    documentos_editaveis: DocumentoEditavelTipo[];
}

export class CicloRevisaoDto {
    analise: MfAnaliseQualitativaDto | null;
    risco: MfRiscoDto | null;
    fechamento: MfFechamentoDto | null;
    @ApiProperty({
        type: ArquivoAnaliseQualitativaDocumentoDto,
        isArray: true,
    })
    arquivos: ArquivoAnaliseQualitativaDocumentoDto[] | null;
}

export class CiclosRevisaoDto {
    atual: CicloRevisaoDto;
    anterior: CicloRevisaoDto | null;
    @ApiProperty({
        enum: DocumentoEditavelTipo,
        isArray: true,
        enumName: 'DocumentoEditavelTipo',
        example: ['analise', 'risco'],
    })
    documentos_editaveis: DocumentoEditavelTipo[];
}

export class PsListAnaliseQualitativaDto {
    corrente: MfListAnaliseQualitativaDto;
    anterior: MfListAnaliseQualitativaDto | null;
    @ApiProperty({
        type: ArquivoAnaliseQualitativaDocumentoDto,
        isArray: true,
    })
    arquivos: ArquivoAnaliseQualitativaDocumentoDto[] | null;

    @ApiProperty({
        enum: DocumentoEditavelTipo,
        isArray: true,
        enumName: 'DocumentoEditavelTipo',
        example: ['analise'],
    })
    documentos_editaveis: DocumentoEditavelTipo[];
}

export class PsListRiscoDto {
    corrente: MfListRiscoDto;
    anterior: MfListRiscoDto | null;

    @ApiProperty({
        enum: DocumentoEditavelTipo,
        isArray: true,
        enumName: 'DocumentoEditavelTipo',
        example: ['risco'],
    })
    documentos_editaveis: DocumentoEditavelTipo[];
}

export class PsListFechamentoDto {
    corrente: MfListFechamentoDto;
    anterior: MfListFechamentoDto | null;

    @ApiProperty({
        enum: DocumentoEditavelTipo,
        isArray: true,
        enumName: 'DocumentoEditavelTipo',
        example: ['fechamento'],
    })
    documentos_editaveis: DocumentoEditavelTipo[];
}
