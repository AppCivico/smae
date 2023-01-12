import { IntersectionType, OmitType } from "@nestjs/swagger"
import { Periodicidade } from "@prisma/client"
import { IdCodTituloDto } from "../../../common/dto/IdCodTitulo.dto"
import { MfAnaliseQualitativaDto } from "../../../mf/metas/dto/mf-meta-analise-quali.dto"
import { MfFechamentoDto } from "../../../mf/metas/dto/mf-meta-fechamento.dto"
import { MfRiscoDto } from "../../../mf/metas/dto/mf-meta-risco.dto"
import { SimplifiedPainelConteudoSeries, SimplifiedSeries } from "../../../painel/dto/detalhe-painel.dto"


export class RelVarlSimplifiedSeries extends IntersectionType(
    OmitType(SimplifiedPainelConteudoSeries, ['series'] as const),
    SimplifiedSeries
) { }

export class IdTituloPeriodicidade {
    id: number
    nome: string
    periodicidade: Periodicidade
}

export class RelPainelDetalhe {
    painel: IdTituloPeriodicidade
    linhas: RelVarlSimplifiedSeries[]
}

export class RelMfMetas {
    meta: IdCodTituloDto
    analiseRisco: MfRiscoDto | null
    analiseQuali: MfAnaliseQualitativaDto | null
    fechamento: MfFechamentoDto | null
}

export class RetMonitoramentoFisico {
    ano: number
    mes: number
    ciclo_fisico_id: number
    metas: RelMfMetas[]
}

export class RetMonitoramentoMensal {
    paineis: RelPainelDetalhe[]

    monitoramento_fisico: RetMonitoramentoFisico | null
}
