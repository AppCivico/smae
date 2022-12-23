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

export class RetMonitoramentoMensal {
    paineis: RelPainelDetalhe[]

    //analise_risco:

}
