import { ListApenasTarefaListDto } from 'src/pp/tarefa/entities/tarefa.entity';

export class ListTarefaTransferenciaDto extends ListApenasTarefaListDto {
    cabecalho: CabecalhoTarefaTransferenciaDto;
}

export class CabecalhoTarefaTransferenciaDto {
    previsao_inicio: Date | null;
    previsao_custo: number | null;
    previsao_duracao: number | null;
    previsao_termino: Date | null;

    atraso: number | null;
    em_atraso: boolean;
    projecao_termino: Date | null;
    realizado_duracao: number | null;
    percentual_concluido: number | null;

    realizado_inicio: Date | null;
    realizado_termino: Date | null;
    realizado_custo: number | null;
    tolerancia_atraso: number | null;
    percentual_atraso: number | null;
    status_cronograma: string | null;

    nivel_maximo_tarefa: number;
}
