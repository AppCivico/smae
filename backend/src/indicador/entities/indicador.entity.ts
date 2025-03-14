import { IndicadorTipo, Periodicidade, Polaridade } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { FormulaVariaveis } from '../dto/update-indicador.dto';
import { IsDateYMD } from '../../auth/decorators/date.decorator';

export class IndicadorDto {
    id: number;
    polaridade: Polaridade;
    periodicidade: Periodicidade;
    codigo: string;
    titulo: string;
    meta_id: number | null;
    iniciativa_id: number | null;
    atividade_id: number | null;
    regionalizavel: boolean;

    @IsDateYMD()
    inicio_medicao: string;
    @IsDateYMD()
    fim_medicao: string;

    nivel_regionalizacao: number | null;
    contexto: string | null;
    complemento: string | null;
    formula: string | null;
    acumulado_usa_formula: boolean | null;
    acumulado_valor_base: Decimal | null;
    meta_valor_nominal: Decimal | null;
    formula_variaveis: FormulaVariaveis[];
    casas_decimais: number | null;
    recalculando: boolean;
    ha_avisos_data_fim: boolean;
    recalculo_erro: string | null;
    recalculo_tempo: Decimal | null;
    variavel_categoria_id: number | null;
    indicador_tipo: IndicadorTipo;
}
