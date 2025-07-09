import { IntersectionType, OmitType } from '@nestjs/swagger';
import { Periodicidade, Serie } from 'src/generated/prisma/client';
import { IdCodTituloDto } from '../../../common/dto/IdCodTitulo.dto';
import { IdNomeExibicaoDto } from '../../../common/dto/IdNomeExibicao.dto';
import { MfAnaliseQualitativaDto } from '../../../mf/metas/dto/mf-meta-analise-quali.dto';
import { MfFechamentoDto } from '../../../mf/metas/dto/mf-meta-fechamento.dto';
import { MfRiscoDto } from '../../../mf/metas/dto/mf-meta-risco.dto';
import { SimplifiedPainelConteudoSeries, SimplifiedSeries } from '../../../painel/dto/detalhe-painel.dto';

export class RelVarlSimplifiedSeries extends IntersectionType(
    OmitType(SimplifiedPainelConteudoSeries, ['series'] as const),
    SimplifiedSeries
) {}

export class IdTituloPeriodicidade {
    id: number;
    nome: string;
    periodicidade: Periodicidade;
}

export class RelPainelDetalhe {
    painel: IdTituloPeriodicidade;
    linhas: RelVarlSimplifiedSeries[];
}

export class RelMfMetas {
    meta: IdCodTituloDto;
    analiseRisco: MfRiscoDto | null;
    analiseQuali: MfAnaliseQualitativaDto | null;
    fechamento: MfFechamentoDto | null;
}

export class RelSerieVariavelDto {
    serie: Serie;
    variavel_id: number;
    titulo: string;
    codigo: string;
    data_valor: string;
    valor_nominal: string;

    atualizado_por: IdNomeExibicaoDto | null;
    atualizado_em: string;

    conferida_por: IdNomeExibicaoDto | null;
    conferida_em: string | null;

    conferida: boolean;
    aguarda_cp: boolean;
    aguarda_complementacao: boolean;

    meta_id: number;
    iniciativa_id: number | null;
    atividade_id: number | null;

    codigo_meta: string;
    codigo_iniciativa: string | null;
    codigo_atividade: string | null;

    titulo_meta: string;
    titulo_iniciativa: string | null;
    titulo_atividade: string | null;
    analise_qualitativa: string | null;
}

export class RetMonitoramentoFisico {
    ano: number;
    mes: number;
    ciclo_fisico_id: number;
    metas: RelMfMetas[];
    seriesVariaveis: RelSerieVariavelDto[];
}

export class RetMonitoramentoMensal {
    paineis: RelPainelDetalhe[];

    monitoramento_fisico: RetMonitoramentoFisico | null;
}
