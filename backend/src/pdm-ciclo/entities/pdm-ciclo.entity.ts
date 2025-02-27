import { IsDateYMD } from '../../auth/decorators/date.decorator';
import { DateYMD } from '../../common/date2ymd';
import { MfAnaliseQualitativaDto } from '../../mf/metas/dto/mf-meta-analise-quali.dto';
import { MfFechamentoDto } from '../../mf/metas/dto/mf-meta-fechamento.dto';
import { MfRiscoDto } from '../../mf/metas/dto/mf-meta-risco.dto';
import { CicloFisicoDto } from '../../pdm/dto/list-pdm.dto';

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
}

export class CicloRevisaoDto {
    analise: MfAnaliseQualitativaDto | null;
    risco: MfRiscoDto | null;
    fechamento: MfFechamentoDto | null;
}

export class CiclosRevisaoDto {
    atual: CicloRevisaoDto;
    anterior: CicloRevisaoDto | null;
}
