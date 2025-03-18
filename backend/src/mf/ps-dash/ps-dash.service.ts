import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CicloFase } from '@prisma/client';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { Date2YMD } from '../../common/date2ymd';
import { PdmModoParaTipo, TipoPdmType } from '../../common/decorators/current-tipo-pdm';
import { Object2Hash } from '../../common/object2hash';
import { MetasGetPermissionSet } from '../../meta/meta.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
    PSMFCicloDto,
    PSMFCountDto,
    PSMFFiltroDashboardQuadroDto,
    PSMFItemMetaDto,
    PSMFListaMetasDto,
    PSMFQuadroMetasDto,
    PSMFQuadroVariaveisDto,
    PSMFSituacaoCicloDto,
    PSMFSituacaoVariavelDto,
    PSMFStatusVariaveisMetaDto,
} from './dto/ps.dto';

interface PaginationTokenBody {
    search_hash: string;
    ipp: number;
    issued_at: number;
    total_rows: number;
}

@Injectable()
export class PSMFDashboardService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly prisma: PrismaService
    ) {}

    async getQuadroVariaveis(
        tipo: TipoPdmType,
        filtros: PSMFFiltroDashboardQuadroDto,
        user: PessoaFromJwt
    ): Promise<PSMFQuadroVariaveisDto> {
        // Verificar permissões
        // Se for visão pessoal, apenas usuários com acesso a suas variáveis
        const ehVisaoPessoal = filtros.visao_pessoal === true;

        return this.gerarQuadrosVariaveis(ehVisaoPessoal);
    }

    async getQuadroMetas(
        _tipo: TipoPdmType,
        _filtros: PSMFFiltroDashboardQuadroDto,
        user: PessoaFromJwt
    ): Promise<PSMFQuadroMetasDto> {
        // Verificar permissões
        return this.gerarQuadroMetas();
    }

    async getListaMetas(
        tipo: TipoPdmType,
        filtros: PSMFFiltroDashboardQuadroDto,
        user: PessoaFromJwt
    ): Promise<PSMFListaMetasDto> {
        const permissionsSet = await MetasGetPermissionSet(tipo, user, false, this.prisma);

        // Validar token para paginação
        if (filtros.pagina && filtros.pagina > 1 && !filtros.token_paginacao) {
            throw new BadRequestException('Campo obrigatório para paginação');
        }

        // Remover campos que não devem afetar o hash para paginação
        const filtrosSemPaginacao = { ...filtros };
        delete filtrosSemPaginacao.pagina;
        delete filtrosSemPaginacao.token_paginacao;

        let retToken = filtros.token_paginacao;
        let ipp = filtros.ipp ?? 20;
        const page = filtros.pagina ?? 1;
        let total_registros = 0;
        let now = new Date(Date.now());

        // Se temos um token, validamos e extraímos informações
        if (retToken) {
            try {
                const decoded = this.decodificarTokenPaginacao(retToken, filtrosSemPaginacao);
                total_registros = decoded.total_rows;
                ipp = decoded.ipp;
                now = new Date(decoded.issued_at);
            } catch (error) {
                throw new BadRequestException('Token de paginação inválido');
            }
        }

        const offset = (page - 1) * ipp;

        // Obter contagem total de registros
        const totalCountQuery = this.prisma.meta.count({
            where: {
                AND:
                    permissionsSet.length > 0
                        ? [
                              {
                                  AND: permissionsSet,
                              },
                          ]
                        : undefined,
                pdm_id: filtros.pdm_id,
                pdm: {
                    tipo: PdmModoParaTipo(tipo),
                    id: filtros.pdm_id,
                },
                id: filtros.meta_id ? { in: filtros.meta_id } : undefined,
                // Aqui pode-se adicionar filtros adicionais para o "apenas_pendentes"
                // quando essas colunas existirem no banco
            },
        });

        // Obter os itens paginados
        const metasQuery = this.prisma.meta.findMany({
            where: {
                AND:
                    permissionsSet.length > 0
                        ? [
                              {
                                  AND: permissionsSet,
                              },
                          ]
                        : undefined,
                pdm_id: filtros.pdm_id,
                pdm: {
                    tipo: PdmModoParaTipo(tipo),
                    id: filtros.pdm_id,
                },
                id: filtros.meta_id ? { in: filtros.meta_id } : undefined,
                // Filtros adicionais para "apenas_pendentes" serão adicionados aqui no futuro
            },
            orderBy: [{ codigo: 'asc' }],
            select: {
                id: true,
                titulo: true,
                codigo: true,
                // Quando outros campos estiverem disponíveis no banco, adicionar aqui
            },
            skip: offset,
            take: ipp,
        });

        // Executar as consultas em paralelo para melhorar performance
        const [metasFromDb, totalFiltrado, cicloAtual] = await Promise.all([
            metasQuery,
            totalCountQuery,
            this.obterCicloAtual(filtros.pdm_id),
        ]);

        // Gerar token para próxima página se estamos na primeira página
        if (!filtros.token_paginacao) {
            retToken = this.gerarTokenPaginacao(filtrosSemPaginacao, now, totalFiltrado, ipp);
            total_registros = totalFiltrado;
        }

        // Mapear resultados do banco para o DTO
        const metas: PSMFItemMetaDto[] = metasFromDb.map((meta) => {
            return {
                id: meta.id,
                codigo: meta.codigo,
                titulo: meta.titulo,
                // Campos que precisam ser mockados por enquanto
                tipo: 'meta', // Por enquanto, sempre será 'meta'
                pendencia_orcamento: this.gerarContador(Math.random() > 0.5), // Mock baseado em probabilidade
                pendencia_cronograma: this.gerarContador(Math.random() > 0.5), // Mock baseado em probabilidade
                monitoramento_ciclo: this.gerarSituacaoCiclo(), // Mock com dados gerados
                variaveis: this.gerarStatusVariaveisMeta(), // Mock com dados gerados
                // Campos opcionais que não se aplicam a metas (somente para iniciativas/atividades)
                fase: CicloFase.Coleta, // Mock com dados gerados
                meta_id: undefined,
                iniciativa_id: undefined,
            };
        });

        // Calcular metadados de paginação
        const tem_mais = offset + metas.length < total_registros;
        const paginas = Math.ceil(total_registros / ipp);

        return {
            linhas: metas,
            ciclo_atual: cicloAtual,
            total_registros: total_registros,
            paginas,
            pagina_corrente: page,
            token_paginacao: retToken ?? null,
            token_ttl: 3600, // 1 hora
            tem_mais,
        };
    }

    private async obterCicloAtual(pdmId: number): Promise<PSMFCicloDto | null> {
        const cicloAtual = await this.prisma.cicloFisico.findFirst({
            where: { pdm_id: pdmId, ativo: true },
            orderBy: { data_ciclo: 'desc' },
            take: 1,
        });

        if (cicloAtual) {
            return {
                id: cicloAtual.id,
                data_ciclo: Date2YMD.toString(cicloAtual.data_ciclo),
            };
        }
        return null;
    }

    // Métodos auxiliares para manipulação de tokens
    private decodificarTokenPaginacao(token: string, filtros: any): PaginationTokenBody {
        try {
            const decoded = this.jwtService.verify(token) as PaginationTokenBody;

            // Validar hash de busca
            if (decoded.search_hash !== Object2Hash(filtros)) {
                throw new Error(
                    'Parâmetros da busca não podem ser diferentes da busca inicial para avançar na paginação.'
                );
            }

            return decoded;
        } catch (error) {
            throw new BadRequestException('Token de paginação inválido: ' + error.message);
        }
    }

    private gerarTokenPaginacao(filtros: any, emitidoEm: Date, totalRegistros: number, itensPorPagina: number): string {
        const payload: PaginationTokenBody = {
            search_hash: Object2Hash(filtros),
            ipp: itensPorPagina,
            issued_at: emitidoEm.valueOf(),
            total_rows: totalRegistros,
        };

        return this.jwtService.sign(payload);
    }

    // Métodos auxiliares de geração de dados (mantidos do original)
    private gerarQuadrosVariaveis(_ehVisaoPessoal: boolean): PSMFQuadroVariaveisDto {
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

    private gerarQuadroMetas(): PSMFQuadroMetasDto {
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
}
