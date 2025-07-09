import { StatusRisco } from 'src/generated/prisma/client';
import { PlanoAcao } from 'src/pp/plano-de-acao/entities/plano-acao.entity';

export const ProjetoRiscoStatus: Record<StatusRisco | string, string> = {
    SemInformacao: 'Sem informação',
    Aumentando: 'Aumentando',
    Estatico: 'Estático',
    Diminuindo: 'Diminuindo',
    SobControle: 'Sob controle',
    ConcluiHdo: 'Concluído',
    Fechado: 'Concluído', // versão que está no banco de dados
} as const;

export class ProjetoRisco {
    id: number;
    codigo: number;
    titulo: string;
    registrado_em: Date;
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
    risco_tarefa_outros: string | null;
    /**
     * ids dos plano de ação que estão sem data de terminimo
     */
    planos_de_acao_sem_dt_term: number[] | null;
    status_risco: StatusRisco;
    edicao_limitada?: boolean;
}

export class ListProjetoRiscoDto {
    linhas: ProjetoRisco[];
}

export class ProjetoRiscoDetailDto extends ProjetoRisco {
    tarefas_afetadas: ProjetoRiscoTarefa[];
    planos_de_acao: PlanoAcao[];
}

export class ProjetoRiscoTarefa {
    tarefa_id: number;
    tarefa: string;
}
