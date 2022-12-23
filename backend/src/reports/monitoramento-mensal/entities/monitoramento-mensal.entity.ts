import { IntersectionType, OmitType } from "@nestjs/swagger"
import { IdCodTituloDto } from "src/common/dto/IdCodTitulo.dto"
import { MfAnaliseQualitativaDto } from "src/mf/metas/dto/mf-meta-analise-quali.dto"
import { MfFechamentoDto } from "src/mf/metas/dto/mf-meta-fechamento.dto"
import { MfRiscoDto } from "src/mf/metas/dto/mf-meta-risco.dto"
import { Periodicidade } from "@prisma/client"
import { SimplifiedPainelConteudoSeries, SimplifiedSeries } from "src/painel/dto/detalhe-painel.dto"

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
