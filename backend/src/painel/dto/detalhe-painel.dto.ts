import { Periodicidade, Periodo } from '@prisma/client';
import { PainelDto } from '../entities/painel.entity';


export class DetailPainelVisualizacaoDto {
    id: number
    periodicidade: Periodicidade
    periodo: Periodo | null
    periodo_valor: number | null
    periodo_inicio: Date | null
    periodo_fim: Date | null
    mostrar_acumulado: boolean
    mostrar_planejado: boolean
    ordem: number | null
}