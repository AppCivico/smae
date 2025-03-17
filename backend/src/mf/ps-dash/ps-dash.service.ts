import { Injectable } from '@nestjs/common';
import { CicloFase } from '@prisma/client';

import {
    PSMFFiltroDashboardQuadroDto,
    PSMFRespostaDashboardDto,
    PSMFQuadroVariaveisDto,
    PSMFEstatisticasMetasDto,
    PSMFListaMetasDto,
    PSMFItemMetaDto,
    PSMFStatusVariaveisMetaDto,
    PSMFSituacaoVariavelDto,
    PSMFCicloDto,
    PSMFSituacaoCicloDto,
    PSMFCountDto,
} from './dto/ps.dto';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';

@Injectable()
export class PSMFDashboardService {
    async getDashboardQuadros(
        filtros: PSMFFiltroDashboardQuadroDto,
        user: PessoaFromJwt
    ): Promise<PSMFRespostaDashboardDto> {
        // Aqui normalmente teríamos uma verificação de permissões
        // Se a visão for pessoal, apenas usuários com acesso a suas variáveis
        // Se for administrativa, apenas admin_cp ou tecnico_cp

        // Gerar dados fictícios com base nos filtros
        return this.gerarDadosFicticios(filtros, user);
    }

    private gerarDadosFicticios(filtros: PSMFFiltroDashboardQuadroDto, user: PessoaFromJwt): PSMFRespostaDashboardDto {
        // Verificar se é visão pessoal ou administrativa
        const ehVisaoPessoal = filtros.visao_pessoal === true;

        return {
            variaveis: this.gerarQuadrosVariaveis(ehVisaoPessoal),
            estatisticas_metas: this.gerarEstatisticasMetas(),
            lista_metas: this.gerarListaMetas(filtros),
        };
    }

    private gerarQuadrosVariaveis(_ehVisaoPessoal: boolean): PSMFQuadroVariaveisDto {
        // Gerar dados fictícios para os quadros de variáveis
        const gerarSituacaoVariavel = (total: number, liberadas: number): PSMFSituacaoVariavelDto => {
            const restante = total - liberadas;
            const metade = Math.floor(restante / 2);

            return {
                a_coletar_atrasadas: Math.floor(metade * 0.3),
                a_coletar_prazo: Math.floor(metade * 0.7),
                coletadas_a_conferir: Math.floor(restante * 0.3),
                conferidas_a_liberar: Math.floor(restante * 0.2),
                liberadas: liberadas,
                total: total,
            };
        };

        return {
            associadas_plano_atual: gerarSituacaoVariavel(120, 80),
            nao_associadas_plano_atual: gerarSituacaoVariavel(50, 20),
            total_por_situacao: gerarSituacaoVariavel(500, 320),
            nao_associadas: gerarSituacaoVariavel(150, 40),
        };
    }

    private gerarEstatisticasMetas(): PSMFEstatisticasMetasDto {
        // Gerar estatísticas fictícias de metas
        return {
            com_pendencia: 15,
            sem_pendencia: 35,
            variaveis_liberadas: 30,
            variaveis_a_liberar: 20,
            cronograma_preenchido: 40,
            cronograma_a_preencher: 10,
            orcamento_preenchido: 35,
            orcamento_a_preencher: 15,
            qualificacao_preenchida: 38,
            qualificacao_a_preencher: 12,
            risco_preenchido: 30,
            risco_a_preencher: 20,
            fechadas: 20,
            a_fechar: 30,
        };
    }

    private gerarListaMetas(filtros: PSMFFiltroDashboardQuadroDto): PSMFListaMetasDto {
        // Gerar uma lista fictícia de metas com base nos filtros
        const metas: PSMFItemMetaDto[] = [];
        const totalItens = 50;
        const itensPorPagina = filtros.ipp || 20;
        const pagina = filtros.pagina || 1;
        const inicio = (pagina - 1) * itensPorPagina;
        const fim = Math.min(inicio + itensPorPagina, totalItens);

        // Filtrar por órgão e equipe se necessário
        let itemFiltrado = totalItens;
        if (filtros.orgao_id && filtros.orgao_id.length > 0) {
            itemFiltrado = Math.floor(totalItens * 0.7); // Simulando filtragem
        }
        if (filtros.equipes && filtros.equipes.length > 0) {
            itemFiltrado = Math.floor(itemFiltrado * 0.8); // Simulando filtragem adicional
        }

        // Apenas itens pendentes se solicitado
        if (filtros.apenas_pendentes) {
            itemFiltrado = Math.floor(itemFiltrado * 0.4);
        }

        for (let i = inicio; i < fim && i < itemFiltrado; i++) {
            const tipo = i % 3 === 0 ? 'meta' : i % 3 === 1 ? 'iniciativa' : 'atividade';
            const id = i + 1;

            metas.push({
                id,
                codigo: `${tipo.charAt(0).toUpperCase()}${id.toString().padStart(3, '0')}`,
                titulo: `${this.capitalizarPrimeira(tipo)} ${id} - Exemplo de ${tipo}`,
                tipo: tipo as 'meta' | 'iniciativa' | 'atividade',
                pendencia_orcamento: this.gerarContador(id % 2 === 0),
                pendencia_cronograma: this.gerarContador(id % 3 === 0),
                monitoramento_ciclo: this.gerarSituacaoCiclo(),
                variaveis: this.gerarStatusVariaveisMeta(),
                meta_id: tipo !== 'meta' ? Math.floor(id / 3) * 3 + 1 : undefined,
                iniciativa_id: tipo === 'atividade' ? Math.floor(id / 3) * 3 + 2 : undefined,
            });
        }

        return {
            itens: metas,
            ciclo_atual: this.gerarCicloAtual(),
            total: itemFiltrado,
            pagina,
        };
    }

    private capitalizarPrimeira(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    private gerarContador(preenchido: boolean): PSMFCountDto {
        return {
            total: 1,
            preenchido: preenchido ? 1 : 0,
        };
    }

    private gerarSituacaoCiclo(): PSMFSituacaoCicloDto[] {
        return [
            { fase: CicloFase.Analise, preenchido: true },
            { fase: CicloFase.Risco, preenchido: Math.random() > 0.5 },
            { fase: CicloFase.Fechamento, preenchido: Math.random() > 0.7 },
        ];
    }

    private gerarStatusVariaveisMeta(): PSMFStatusVariaveisMetaDto {
        const total = Math.floor(Math.random() * 20) + 5;
        const aColetar = Math.floor(total * 0.8);
        const coletadas = Math.floor(aColetar * 0.7);
        const conferidas = Math.floor(coletadas * 0.8);
        const liberadas = Math.floor(conferidas * 0.9);

        return {
            total,
            a_coletar_total: aColetar,
            a_coletar: aColetar - coletadas,
            coletadas_nao_conferidas: coletadas - conferidas,
            conferidas_nao_liberadas: conferidas - liberadas,
            liberadas,
        };
    }

    private gerarCicloAtual(): PSMFCicloDto {
        return {
            id: 1,
            fase: CicloFase.Analise,
            data_ciclo: new Date(),
        };
    }
}
