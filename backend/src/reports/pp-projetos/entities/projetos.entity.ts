import { ApiProperty } from '@nestjs/swagger';
import { ProjetoStatus } from '@prisma/client';
import { IdSiglaDescricao } from 'src/common/dto/IdSigla.dto';
import { ProjetoPremissa, ProjetoRecursos, ProjetoRestricoes } from 'src/pp/projeto/entities/projeto.entity';
import { IdNomeExibicao } from 'src/variavel/entities/variavel.entity';

export class RelProjetosDto {
    id: number;
    meta_id: number | null;
    iniciativa_id: number | null;
    atividade_id: number | null;
    nome: string;
    /**
     * @example "EmAcompanhamento"
     */
    @ApiProperty({ enum: ProjetoStatus, enumName: 'ProjetoStatus' })
    status: ProjetoStatus;
    portfolio_id: number;
    portfolio_titulo: string;
    codigo: string | null;
    objeto: string;
    objetivo: string;
    publico_alvo: string | null;
    previsao_inicio: string | null;
    previsao_custo: number | null;
    previsao_duracao: number | null;
    previsao_termino: string | null;
    escopo: string | null;
    nao_escopo: string | null;

    orgao_participante: IdSiglaDescricao;
    orgao_gestor: IdSiglaDescricao;
    orgao_responsavel: IdSiglaDescricao | null;
    responsavel: IdNomeExibicao | null;
    premissa: ProjetoPremissa | null;
    restricao: ProjetoRestricoes | null;
    fonte_recurso: ProjetoRecursos | null;

    versao: string | null;
}

export class RelProjetosCronogramaDto {
    projeto_id: number;
    projeto_codigo: string;
    tarefa_id: number;
    numero: number;
    nivel: number;
    tarefa: string;
    inicio_planejado: string | null;
    termino_planejado: string | null;
    custo_estimado: number | null;
    inicio_real: string | null;
    termino_real: string | null;
    duracao_real: number | null;
    percentual_concluido: number | null;
    custo_real: number | null;
    dependencias: string | null;

    responsavel: IdNomeExibicao | null;
    atraso: number | null;
}

export class RelProjetosRiscosDto {
    projeto_id: number;
    projeto_codigo: string;
    codigo: string;
    titulo: string;
    data_registro: string;
    status_risco: string;
    descricao: string | null;
    causa: string | null;
    consequencia: string | null;
    probabilidade: number | null;
    probabilidade_descricao: string | null;
    impacto: number | null;
    impacto_descricao: string | null;
    nivel: number | null;
    grau: number | null;
    grau_descricao: string | null;
    resposta: string | null;
    tarefas_afetadas: string | null;
}

export class RelProjetosPlanoAcaoDto {
    projeto_id: number;
    projeto_codigo: string;
    risco_codigo: string;
    contramedida: string;
    medidas_de_contingencia: string;
    prazo_contramedida: string | null;
    custo: number | null;
    custo_percentual: number | null;
    responsavel: string | null;
    data_termino: string | null;
}

export class RelProjetosPlanoAcaoMonitoramentosDto {
    projeto_id: number;
    projeto_codigo: string;
    risco_codigo: string;
    plano_acao_id: number;
    data_afericao: string;
    descricao: string;
}

export class RelProjetosLicoesAprendidasDto {
    projeto_id: number;
    projeto_codigo: string;
    sequencial: number;
    data_registro: string;
    responsavel: string;
    descricao: string;
    observacao: string | null;
    contexto: string | null;
    resultado: string | null;
}

export class RelProjetosAcompanhamentosDto {
    projeto_id: number;
    projeto_codigo: string;
    data_registro: string;
    participantes: string;
    cronograma_paralizado: boolean;
    prazo_encaminhamento: string | null;
    prazo_realizado: string | null;
    pauta: string | null;
    detalhamento: string | null;
    encaminhamento: string | null;
    responsavel: string | null;
    observacao: string | null;
    detalhamento_status: string | null;
    pontos_atencao: string | null;
    riscos: string | null;
}

export class PPProjetosRelatorioDto {
    linhas: RelProjetosDto[];
    cronograma: RelProjetosCronogramaDto[];
    riscos: RelProjetosRiscosDto[];
    planos_de_acao: RelProjetosPlanoAcaoDto[];
    monitoramento_planos_de_acao: RelProjetosPlanoAcaoMonitoramentosDto[];
    licoes_aprendidas: RelProjetosLicoesAprendidasDto[];
    acompanhamentos: RelProjetosAcompanhamentosDto[];
}
