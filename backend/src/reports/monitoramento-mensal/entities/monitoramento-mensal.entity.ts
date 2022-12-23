import { IntersectionType, OmitType } from "@nestjs/swagger"
import { SimplifiedPainelConteudoSeries, SimplifiedSeries } from "src/painel/dto/detalhe-painel.dto"

export class RelVarlSimplifiedSeries extends IntersectionType(
    OmitType(SimplifiedPainelConteudoSeries, ['series'] as const),
    SimplifiedSeries
) { }

export class IdTituloPeriodicidade {
    id: number
    titulo: string
    periodicidade: string
}

export class RelPainelDetalhe {
    painel: IdTituloPeriodicidade
    linhas: RelVarlSimplifiedSeries[]
}

export class RelMfMetas {

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
