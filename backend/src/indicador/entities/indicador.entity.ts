import { IndicadorTipo, Periodicidade, Polaridade } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { FormulaVariaveis } from '../dto/update-indicador.dto';

export class Indicador {
    id: number;
    polaridade: Polaridade;
    periodicidade: Periodicidade;
    codigo: string;
    titulo: string;
    meta_id: number | null;
    iniciativa_id: number | null;
    atividade_id: number | null;
    regionalizavel: boolean;
    inicio_medicao: Date;
    fim_medicao: Date;
    nivel_regionalizacao: number | null;
    contexto: string | null;
    complemento: string | null;
    formula: string | null;
    acumulado_usa_formula: boolean | null;
    acumulado_valor_base: Decimal | null;
    formula_variaveis: FormulaVariaveis[];
    casas_decimais: number | null;
    recalculando: boolean;
    ha_avisos_data_fim: boolean;
    recalculo_erro: string | null;
    recalculo_tempo: Decimal | null;
    variavel_categoria_id: number | null;
    indicador_tipo: IndicadorTipo;
}
