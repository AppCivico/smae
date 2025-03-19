import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CicloFase, Prisma } from '@prisma/client';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { Date2YMD } from '../../common/date2ymd';
import { TipoPdmType } from '../../common/decorators/current-tipo-pdm';
import { IdCodTituloDto } from '../../common/dto/IdCodTitulo.dto';
import { Object2Hash } from '../../common/object2hash';
import { MetasGetPermissionSet } from '../../meta/meta.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
    PSMFCicloDto,
    PSMFFiltroDashboardQuadroDto,
    PSMFItemMetaDto,
    PSMFListaMetasDto,
    PSMFQuadroMetasDto,
    PSMFQuadroVariaveisDto,
    PSMFSituacaoCicloDto,
    PSMFSituacaoVariavelDto,
    StrMIA,
} from './dto/ps.dto';

interface PaginationTokenBody {
    search_hash: string;
    ipp: number;
    issued_at: number;
    total_rows: number;
}

interface IdCodTituloTipoDto {
    atividade_id?: number | null;
    iniciativa_id?: number | null;
    atividade?: IdCodTituloDto | null;
    iniciativa?: IdCodTituloDto | null;
    meta: IdCodTituloDto;
}

function geraDetalheMetaIniAtv(item: IdCodTituloTipoDto) {
    if (item.atividade_id && item.atividade) {
        return {
            id: item.atividade.id,
            codigo: item.atividade.codigo,
            titulo: item.atividade.titulo,
            tipo: 'atividade' as StrMIA,
        };
    } else if (item.iniciativa_id && item.iniciativa) {
        return {
            id: item.iniciativa.id,
            codigo: item.iniciativa.codigo,
            titulo: item.iniciativa.titulo,
            tipo: 'iniciativa' as StrMIA,
        };
    } else {
        return {
            id: item.meta.id,
            codigo: item.meta.codigo,
            titulo: item.meta.titulo,
            tipo: 'meta' as StrMIA,
        };
    }
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

    async getListaMetasIniAtv(
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

        // Obter ciclo atual
        const cicloAtual = await this.obterCicloAtual(filtros.pdm_id);

        // Filtro principal a partir do dashboard
        const dashPermissionsSet: Prisma.Enumerable<Prisma.PsDashboardConsolidadoWhereInput> = [
            {
                meta: {
                    AND: permissionsSet.length > 0 ? { AND: permissionsSet } : undefined,
                    pdm_id: filtros.pdm_id,
                    id: filtros.meta_id ? { in: filtros.meta_id } : undefined,
                },
                pendente: filtros.apenas_pendentes !== undefined ? filtros.apenas_pendentes : undefined,
            },
        ];

        // Obter contagem total de registros
        const totalCountQuery = this.prisma.psDashboardConsolidado.count({
            where: {
                AND: dashPermissionsSet,
            },
        });

        // Obter os itens paginados
        const dashboardQuery = this.prisma.psDashboardConsolidado.findMany({
            where: {
                AND: dashPermissionsSet,
            },
            include: {
                meta: {
                    select: { id: true, titulo: true, codigo: true },
                },
                iniciativa: {
                    select: { id: true, titulo: true, codigo: true },
                },
                atividade: {
                    select: { id: true, titulo: true, codigo: true },
                },
            },
            orderBy: [{ meta: { codigo: 'asc' } }],
            skip: offset,
            take: ipp,
        });

        // Executar as consultas em paralelo para melhorar performance
        const [dashboardItems, totalFiltrado] = await Promise.all([dashboardQuery, totalCountQuery]);

        // Gerar token para próxima página se estamos na primeira página
        if (!filtros.token_paginacao) {
            retToken = this.gerarTokenPaginacao(filtrosSemPaginacao, now, totalFiltrado, ipp);
            total_registros = totalFiltrado;
        }

        // Mapear resultados do dashboard para o DTO
        const metas: PSMFItemMetaDto[] = dashboardItems.map((item) => {
            const situacaoCiclo: PSMFSituacaoCicloDto[] = [];

            if (item.tipo == 'meta' && item.ciclo_fisico_id) {
                situacaoCiclo.push({ fase: CicloFase.Analise, preenchido: item.fase_analise_preenchida });
                situacaoCiclo.push({ fase: CicloFase.Risco, preenchido: item.fase_risco_preenchida });
                situacaoCiclo.push({ fase: CicloFase.Fechamento, preenchido: item.fase_fechamento_preenchida });
            }

            return {
                fase: item.fase_atual,
                pendencia_orcamento: {
                    preenchido: item.orcamento_preenchido,
                    total: item.orcamento_total,
                },
                pendencia_cronograma: {
                    total: item.cronograma_total,
                    preenchido: item.cronograma_atraso_inicio + item.cronograma_atraso_fim == 0 ? 1 : 0, // hehe, gambiarra
                },
                monitoramento_ciclo: situacaoCiclo,

                variaveis: {
                    total: -1, // só ta contando variáveis do ciclo no momento
                    a_coletar: item.variaveis_a_coletar,
                    coletadas_nao_conferidas: item.variaveis_coletadas_nao_conferidas,
                    conferidas_nao_liberadas: item.variaveis_conferidas_nao_liberadas,
                    liberadas: item.variaveis_liberadas,
                    a_coletar_total: item.variaveis_total,
                },
                atividade_id: item.atividade_id ?? undefined,
                iniciativa_id: item.iniciativa_id ?? undefined,
                ...geraDetalheMetaIniAtv(item),
            } satisfies PSMFItemMetaDto;
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
}
