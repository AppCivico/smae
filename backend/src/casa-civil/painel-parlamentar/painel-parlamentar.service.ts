import { HttpException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MunicipioTipo, Prisma } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { AnyPageTokenJwtBody, PaginatedWithPagesDto, PAGINATION_TOKEN_TTL } from 'src/common/dto/paginated.dto';
import { Object2Hash } from 'src/common/object2hash';
import { ParlamentarService } from 'src/parlamentar/parlamentar.service';
import { PrismaService } from 'src/prisma/prisma.service';
import {
    distribuicaoContabilizada,
    SqlDistribuicaoContabilizada,
    StatusAtualDistribuicaoSelect,
} from '../distribuicao-recurso/distribuicao-contabilizada';
import {
    FilterPainelParlamentarDto,
    FilterPainelParlamentarTransferenciasDto,
} from './dto/filter-painel-parlamentar.dto';
import {
    PainelParlamentarDistribuicaoDto,
    PainelParlamentarDto,
    PainelParlamentarMandatoDto,
    PainelParlamentarPerfilDto,
    PainelParlamentarTransferenciaDto,
} from './entities/painel-parlamentar.entity';
import {
    agruparTopN,
    calcFaseStatus,
    calcPct,
    calcPctParlamentarDistribuicao,
    ordenaDistribuicoesPorOrgao,
    PAINEL_TOP_N,
} from './painel-parlamentar.util';

// Valores numéricos saem do SQL como texto para não perder precisão no caminho do jsonb.
type ResultadoPainelSql = {
    total: number;
    em_andamento: number;
    valor_disponibilizado: string;
    valor_utilizado: string;
    valor_parlamentar_andamento: string;
    valor_total_andamento: string;
    por_secretaria: { id: number; sigla: string; descricao: string; valor: string }[];
    por_partido: { id: number | null; sigla: string | null; nome: string | null; valor: string }[];
};

const dec = (v: { toString(): string } | null | undefined): Decimal => new Decimal(v ? v.toString() : 0);

@Injectable()
export class PainelParlamentarService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly parlamentarService: ParlamentarService,
        private readonly jwtService: JwtService
    ) {}

    async painel(id: number, filtro: FilterPainelParlamentarDto, user: PessoaFromJwt): Promise<PainelParlamentarDto> {
        this.validaPeriodo(filtro);

        const orgaoRestrito = this.orgaoRestrito(user);
        const condicoes = this.condicoesTransferencia(filtro, orgaoRestrito);
        const distContabilizada = SqlDistribuicaoContabilizada(Prisma.sql`dr`);
        // Gestor de Distribuição só enxerga as distribuições do próprio órgão (mesma regra do módulo de distribuição).
        const distOrgao = orgaoRestrito ? Prisma.sql`AND dr.orgao_gestor_id = ${orgaoRestrito}` : Prisma.empty;

        const [perfil, [sql]] = await Promise.all([
            this.parlamentarService.findOne(id, user),
            this.prisma.$queryRaw<{ resultado: ResultadoPainelSql }[]>`
                WITH base AS MATERIALIZED (
                    SELECT t.id AS transferencia_id, t.workflow_finalizado, tp.partido_id, tp.valor
                    FROM transferencia t
                    JOIN transferencia_parlamentar tp ON tp.transferencia_id = t.id
                        AND tp.parlamentar_id = ${id} AND tp.removido_em IS NULL
                    WHERE ${condicoes}
                ),
                total_andamento AS MATERIALIZED (
                    SELECT COALESCE(SUM(tp.valor), 0) AS valor
                    FROM transferencia t
                    JOIN transferencia_parlamentar tp ON tp.transferencia_id = t.id AND tp.removido_em IS NULL
                    WHERE ${condicoes} AND NOT t.workflow_finalizado
                ),
                dist AS MATERIALIZED (
                    SELECT dr.orgao_gestor_id, dp.valor
                    FROM (SELECT DISTINCT transferencia_id FROM base) b
                    JOIN distribuicao_recurso dr ON dr.transferencia_id = b.transferencia_id AND dr.removido_em IS NULL
                        ${distOrgao}
                    JOIN distribuicao_parlamentar dp ON dp.distribuicao_recurso_id = dr.id
                        AND dp.parlamentar_id = ${id} AND dp.removido_em IS NULL
                    WHERE ${distContabilizada}
                )
                SELECT jsonb_build_object(
                    'total', (SELECT COUNT(DISTINCT transferencia_id)::int FROM base),
                    'em_andamento', (SELECT COUNT(DISTINCT transferencia_id)::int FROM base WHERE NOT workflow_finalizado),
                    'valor_disponibilizado', (SELECT COALESCE(SUM(valor), 0)::text FROM base),
                    'valor_utilizado', (SELECT COALESCE(SUM(valor), 0)::text FROM dist),
                    'valor_parlamentar_andamento', (SELECT COALESCE(SUM(valor), 0)::text FROM base WHERE NOT workflow_finalizado),
                    'valor_total_andamento', (SELECT valor::text FROM total_andamento),
                    -- jsonb_agg: driver adapter (Prisma 7) devolve array_agg de $queryRaw como string; JSON volta como array JS
                    'por_secretaria', (
                        SELECT COALESCE(jsonb_agg(jsonb_build_object(
                            'id', x.id, 'sigla', x.sigla, 'descricao', x.descricao, 'valor', x.valor
                        )), '[]'::jsonb)
                        FROM (
                            SELECT o.id, o.sigla, o.descricao, COALESCE(SUM(d.valor), 0)::text AS valor
                            FROM dist d
                            JOIN orgao o ON o.id = d.orgao_gestor_id
                            GROUP BY o.id, o.sigla, o.descricao
                            HAVING COALESCE(SUM(d.valor), 0) > 0
                        ) x
                    ),
                    'por_partido', (
                        SELECT COALESCE(jsonb_agg(jsonb_build_object(
                            'id', x.id, 'sigla', x.sigla, 'nome', x.nome, 'valor', x.valor
                        )), '[]'::jsonb)
                        FROM (
                            SELECT p.id, p.sigla, p.nome, COALESCE(SUM(b.valor), 0)::text AS valor
                            FROM base b
                            LEFT JOIN partido p ON p.id = b.partido_id
                            GROUP BY p.id, p.sigla, p.nome
                            HAVING COALESCE(SUM(b.valor), 0) > 0
                        ) x
                    )
                ) AS resultado
            `,
        ]);

        const r = sql.resultado;
        const valorDisponibilizado = dec(r.valor_disponibilizado);
        const valorUtilizado = dec(r.valor_utilizado);
        const valorParlamentarAndamento = dec(r.valor_parlamentar_andamento);
        const valorTotalAndamento = dec(r.valor_total_andamento);

        const porSecretaria = agruparTopN(
            r.por_secretaria.map((o) => ({
                item: { id: o.id, sigla: o.sigla, descricao: o.descricao },
                rotulo: o.sigla,
                valor: dec(o.valor),
            })),
            PAINEL_TOP_N
        );
        const porPartido = agruparTopN(
            r.por_partido.map((p) => ({
                item: p.id !== null ? { id: p.id, sigla: p.sigla!, nome: p.nome! } : null,
                rotulo: p.sigla ?? 'Sem partido',
                valor: dec(p.valor),
            })),
            PAINEL_TOP_N
        );

        return {
            parlamentar: this.mapPerfil(perfil),
            transferencias: { total: r.total, em_andamento: r.em_andamento },
            recurso: {
                valor_disponibilizado: valorDisponibilizado.toNumber(),
                valor_utilizado: valorUtilizado.toNumber(),
                pct_utilizado: calcPct(valorUtilizado, valorDisponibilizado),
            },
            participacao_municipio: {
                valor_parlamentar: valorParlamentarAndamento.toNumber(),
                valor_total: valorTotalAndamento.toNumber(),
                pct: calcPct(valorParlamentarAndamento, valorTotalAndamento),
            },
            por_secretaria: porSecretaria.map((l) => ({
                orgao: l.item,
                rotulo: l.rotulo,
                outros: l.outros,
                valor: l.valor.toNumber(),
                pct: calcPct(l.valor, valorUtilizado),
            })),
            por_partido: porPartido.map((l) => ({
                partido: l.item,
                rotulo: l.rotulo,
                outros: l.outros,
                valor: l.valor.toNumber(),
                pct: calcPct(l.valor, valorDisponibilizado),
            })),
        };
    }

    async transferencias(
        id: number,
        filtro: FilterPainelParlamentarTransferenciasDto,
        user: PessoaFromJwt
    ): Promise<PaginatedWithPagesDto<PainelParlamentarTransferenciaDto>> {
        this.validaPeriodo(filtro);

        const pagina = filtro.pagina ?? 1;
        let ipp = filtro.ipp ?? 25;
        const ordem = filtro.ordem_valor ?? 'desc';

        if (pagina > 1 && !filtro.token_paginacao) throw new HttpException('Campo obrigatório para paginação', 400);

        // Mesmo comportamento do painel (findOne): parlamentar inexistente ou removido é 404, não lista vazia.
        const parlamentar = await this.prisma.parlamentar.findFirst({
            where: { id, removido_em: null },
            select: { id: true },
        });
        if (!parlamentar) throw new HttpException('Parlamentar não encontrado', 404);

        const searchHash = Object2Hash({
            parlamentar_id: id,
            ano_inicio: filtro.ano_inicio,
            ano_fim: filtro.ano_fim,
            orgao_gestor_id: filtro.orgao_gestor_id,
            ordem_orgao_id: filtro.ordem_orgao_id,
            ordem_valor: ordem,
            ipp,
        });

        let totalRegistros = 0;
        let tokenPaginacao = filtro.token_paginacao;
        if (tokenPaginacao) {
            const decoded = this.decodeToken(tokenPaginacao, searchHash);
            totalRegistros = decoded.total_rows;
            ipp = decoded.ipp;
        }
        const offset = (pagina - 1) * ipp;

        const orgaoRestrito = this.orgaoRestrito(user);
        const condicoes = this.condicoesTransferencia(filtro, orgaoRestrito);
        const filtroOrgao = filtro.orgao_gestor_id
            ? Prisma.sql`AND EXISTS (
                SELECT 1 FROM distribuicao_recurso dr
                WHERE dr.transferencia_id = t.id AND dr.removido_em IS NULL
                    AND dr.orgao_gestor_id = ${filtro.orgao_gestor_id})`
            : Prisma.empty;
        const direcao = ordem === 'asc' ? Prisma.sql`ASC` : Prisma.sql`DESC`;
        // "Ordenar por secretaria": quem tem distribuição do órgão escolhido sobe; o valor desempata.
        const ordemOrgao = filtro.ordem_orgao_id
            ? Prisma.sql`EXISTS (
                SELECT 1 FROM distribuicao_recurso dr
                WHERE dr.transferencia_id = t.id AND dr.removido_em IS NULL
                    AND dr.orgao_gestor_id = ${filtro.ordem_orgao_id}) DESC,`
            : Prisma.empty;

        const idsPagina = await this.prisma.$queryRaw<{ id: number; total: number }[]>`
            SELECT t.id, (COUNT(*) OVER())::int AS total
            FROM transferencia t
            WHERE ${condicoes}
                AND EXISTS (
                    SELECT 1 FROM transferencia_parlamentar tp
                    WHERE tp.transferencia_id = t.id AND tp.parlamentar_id = ${id} AND tp.removido_em IS NULL)
                ${filtroOrgao}
            ORDER BY ${ordemOrgao} t.valor ${direcao} NULLS LAST, t.id
            LIMIT ${ipp} OFFSET ${offset}
        `;

        if (!tokenPaginacao) {
            totalRegistros = idsPagina[0]?.total ?? 0;
            tokenPaginacao = this.jwtService.sign({
                search_hash: searchHash,
                total_rows: totalRegistros,
                issued_at: Date.now(),
                ipp,
            } satisfies AnyPageTokenJwtBody);
        }

        const ids = idsPagina.map((r) => r.id);
        const linhas = ids.length
            ? await this.carregaTransferencias(id, ids, orgaoRestrito, filtro.ordem_orgao_id ?? null)
            : [];

        return {
            tem_mais: offset + linhas.length < totalRegistros,
            total_registros: totalRegistros,
            token_paginacao: tokenPaginacao,
            paginas: totalRegistros > ipp ? Math.ceil(totalRegistros / ipp) : 1,
            pagina_corrente: pagina,
            linhas,
            token_ttl: PAGINATION_TOKEN_TTL,
        };
    }

    private async carregaTransferencias(
        parlamentarId: number,
        ids: number[],
        orgaoRestrito: number | null,
        ordemOrgaoId: number | null
    ): Promise<PainelParlamentarTransferenciaDto[]> {
        const rows = await this.prisma.transferencia.findMany({
            where: { id: { in: ids } },
            select: {
                id: true,
                identificador: true,
                objeto: true,
                valor: true,
                workflow_etapa_atual: { select: { etapa_fluxo: true } },
                workflow_fase_atual: { select: { id: true, fase: true } },
                andamentoWorkflow: {
                    where: { removido_em: null },
                    select: {
                        workflow_fase_id: true,
                        workflow_situacao: { select: { situacao: true } },
                    },
                },
                parlamentar: {
                    where: { removido_em: null, parlamentar_id: parlamentarId },
                    select: { valor: true },
                },
                distribuicao_recursos: {
                    // Gestor de Distribuição só vê as distribuições do próprio órgão.
                    where: { removido_em: null, ...(orgaoRestrito ? { orgao_gestor_id: orgaoRestrito } : {}) },
                    orderBy: { id: 'asc' },
                    select: {
                        id: true,
                        nome: true,
                        objeto: true,
                        valor: true,
                        orgao_gestor: { select: { id: true, sigla: true, descricao: true } },
                        status: {
                            ...StatusAtualDistribuicaoSelect,
                            select: {
                                status: { select: { nome: true, valor_distribuicao_contabilizado: true } },
                                status_base: { select: { nome: true, valor_distribuicao_contabilizado: true } },
                            },
                        },
                        parlamentares: {
                            where: { removido_em: null, parlamentar_id: parlamentarId },
                            select: { valor: true },
                        },
                    },
                },
            },
        });

        // O banco não garante a ordem do IN (...): reaplica a ordem da página.
        const porId = new Map(rows.map((r) => [r.id, r]));

        return ids
            .map((id) => porId.get(id))
            .filter((r): r is NonNullable<typeof r> => !!r)
            .map((r) => {
                let valorDistribuido = new Decimal(0);

                const distribuicoes = r.distribuicao_recursos.map((dr): PainelParlamentarDistribuicaoDto => {
                    const contabilizada = distribuicaoContabilizada(dr.status);
                    const valor = dec(dr.valor);
                    const valorParlamentar = dr.parlamentares.reduce(
                        (acc, p) => acc.plus(dec(p.valor)),
                        new Decimal(0)
                    );
                    const statusAtual = dr.status[0];

                    if (contabilizada) valorDistribuido = valorDistribuido.plus(valor);

                    return {
                        id: dr.id,
                        nome: dr.nome,
                        objeto: dr.objeto,
                        orgao: dr.orgao_gestor,
                        situacao: (statusAtual?.status ?? statusAtual?.status_base)?.nome ?? null,
                        contabilizada,
                        valor: valor.toNumber(),
                        valor_parlamentar: valorParlamentar.toNumber(),
                        pct_parlamentar: calcPctParlamentarDistribuicao(valorParlamentar, valor),
                    };
                });

                return {
                    id: r.id,
                    identificador: r.identificador,
                    objeto: r.objeto,
                    valor_repasse: dec(r.valor).toNumber(),
                    valor_distribuido: valorDistribuido.toNumber(),
                    valor_parlamentar: r.parlamentar
                        .reduce((acc, p) => acc.plus(dec(p.valor)), new Decimal(0))
                        .toNumber(),
                    etapa: r.workflow_etapa_atual?.etapa_fluxo ?? null,
                    fase: r.workflow_fase_atual?.fase ?? null,
                    fase_status: calcFaseStatus(r.workflow_fase_atual, r.andamentoWorkflow),
                    distribuicoes: ordenaDistribuicoesPorOrgao(distribuicoes, ordemOrgaoId),
                };
            });
    }

    private mapPerfil(p: Awaited<ReturnType<ParlamentarService['findOne']>>): PainelParlamentarPerfilDto {
        const m = p.ultimo_mandato;
        const toNumber = (v: bigint | null) => (v === null ? null : Number(v));

        const mandatoAtual: PainelParlamentarMandatoDto | null = m
            ? {
                  cargo: m.cargo,
                  eleicao: m.eleicao,
                  partido_candidatura: m.partido_candidatura,
                  partido_atual: m.partido_atual,
                  votos_estado: toNumber(m.votos_estado),
                  votos_capital: toNumber(m.votos_capital),
                  votos_interior: toNumber(m.votos_interior),
                  atuacao: m.atuacao,
                  biografia: m.biografia,
              }
            : null;

        return {
            id: p.id,
            nome: p.nome,
            nome_popular: p.nome_popular,
            nascimento: p.nascimento,
            telefone: p.telefone,
            email: p.email,
            foto: p.foto,
            mandato_atual: mandatoAtual,
            representatividade_capital: (m?.representatividade ?? []).filter(
                (r) => r.municipio_tipo === MunicipioTipo.Capital
            ),
            representatividade_interior: (m?.representatividade ?? []).filter(
                (r) => r.municipio_tipo === MunicipioTipo.Interior
            ),
        };
    }

    /**
     * Órgão ao qual o usuário fica restrito, ou null quando vê tudo. Mesmo recorte de
     * TransferenciaService.permissionSet: só vale para o Gestor de Distribuição sem ser administrador.
     */
    private orgaoRestrito(user: PessoaFromJwt): number | null {
        const restringeOrgao =
            user.hasSomeRoles(['SMAE.PerfilGestorDistribuicaoRecurso']) &&
            !user.hasSomeRoles(['CadastroTransferencia.administrador']);
        if (!restringeOrgao) return null;

        if (!user.orgao_id) throw new HttpException('Usuário sem órgão associado.', 400);
        return user.orgao_id;
    }

    /** Conjunto base (alias `t` = transferencia): período, sem canceladas e o recorte de órgão. */
    private condicoesTransferencia(filtro: FilterPainelParlamentarDto, orgaoRestrito: number | null): Prisma.Sql {
        const anoInicio = filtro.ano_inicio ?? null;
        const anoFim = filtro.ano_fim ?? null;

        return Prisma.sql`t.removido_em IS NULL AND t.cancelada = false
            AND (${anoInicio}::int IS NULL OR t.ano >= ${anoInicio}::int)
            AND (${anoFim}::int IS NULL OR t.ano <= ${anoFim}::int)
            ${
                orgaoRestrito
                    ? Prisma.sql`AND EXISTS (
                        SELECT 1 FROM distribuicao_recurso dr
                        WHERE dr.transferencia_id = t.id AND dr.removido_em IS NULL
                            AND dr.orgao_gestor_id = ${orgaoRestrito})`
                    : Prisma.empty
            }`;
    }

    private validaPeriodo(filtro: FilterPainelParlamentarDto): void {
        if (filtro.ano_inicio !== undefined && filtro.ano_fim !== undefined && filtro.ano_inicio > filtro.ano_fim)
            throw new HttpException('ano_inicio não pode ser maior que ano_fim', 400);
    }

    private decodeToken(jwt: string, searchHash: string): AnyPageTokenJwtBody {
        let tmp: AnyPageTokenJwtBody;
        try {
            tmp = this.jwtService.verify(jwt) as AnyPageTokenJwtBody;
        } catch {
            throw new HttpException('token_paginacao invalido', 400);
        }
        if (tmp.search_hash != searchHash)
            throw new HttpException(
                'Parâmetros da busca não podem ser diferente da busca inicial para avançar na paginação.',
                400
            );
        return tmp;
    }
}
