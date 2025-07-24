import { HttpException, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Cron } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { AnyPageTokenJwtBody, PaginatedWithPagesDto, PAGINATION_TOKEN_TTL } from '../../common/dto/paginated.dto';
import { Object2Hash } from '../../common/object2hash';
import { ReferenciasValidasBase } from '../../geo-loc/entities/geo-loc.entity';
import { GeoLocService } from '../../geo-loc/geo-loc.service';
import { Arr } from '../../mf/metas/dash/metas.service';
import { ProjetoService } from '../../pp/projeto/projeto.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PainelEstrategicoFilterDto, PainelEstrategicoListaFilterDto } from './dto/painel-estrategico-filter.dto';
import {
    PainelEstrategicoExecucaoOrcamentariaAno,
    PainelEstrategicoExecucaoOrcamentariaLista,
    PainelEstrategicoGeoLocalizacaoDto,
    PainelEstrategicoGeoLocalizacaoDtoV2,
    PainelEstrategicoGeoLocalizacaoV2,
    PainelEstrategicoGrandesNumeros,
    PainelEstrategicoOrgaoResponsavel,
    PainelEstrategicoProjeto,
    PainelEstrategicoProjetoEtapa,
    PainelEstrategicoProjetosAno,
    PainelEstrategicoProjetosMesAno,
    PainelEstrategicoProjetoStatus,
    PainelEstrategicoQuantidadesAnoCorrente,
    PainelEstrategicoResponseDto,
    PainelEstrategicoResumoOrcamentario,
} from './entities/painel-estrategico-responses.dto';
import { IsCrontabDisabled } from '../../common/crontab-utils';

@Injectable()
export class PainelEstrategicoService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly projetoService: ProjetoService,
        private readonly jwtService: JwtService,
        private readonly geolocService: GeoLocService
    ) {}

    async buildPainel(filtro: PainelEstrategicoFilterDto, user: PessoaFromJwt): Promise<PainelEstrategicoResponseDto> {
        const projetoIds = (
            await this.projetoService.findAllIds(
                'PP',
                user,
                filtro.portfolio_id,
                true,
                filtro.orgao_responsavel_id,
                filtro.projeto_id
            )
        ).map((p) => p.id);
        if (projetoIds.length == 0) projetoIds.push(-1);

        const response = new PainelEstrategicoResponseDto();
        response.grandes_numeros = await this.buildGrandeNumeros(projetoIds);
        response.projeto_status = await this.buildProjetosPorStatus(projetoIds);
        response.projeto_etapas = await this.buildProjetosPorEtapas(projetoIds);
        response.projetos_concluidos_ano = await this.buildProjetosConcluidosPorAno(projetoIds);
        response.projetos_concluidos_mes = await this.buildProjetosConcluidosPorMesAno(projetoIds);
        response.projetos_planejados_ano = await this.buildProjetosPlanejadosPorAno(projetoIds);
        response.projetos_planejados_mes = await this.buildProjetosPlanejadosPorMesAno(projetoIds);
        response.projeto_orgao_responsavel = await this.buildProjetosOrgaoResponsavel(projetoIds);
        response.anos_mapa_calor_concluidos = this.buildAnosMapaCalor(new Date().getFullYear(), -3);
        response.anos_mapa_calor_planejados = this.buildAnosMapaCalor(new Date().getFullYear(), +3);

        filtro = await this.addPermissaoProjetos(filtro, user);
        response.quantidades_projeto = await this.buildQuantidadesProjeto(projetoIds);
        response.resumo_orcamentario = await this.buildResumoOrcamentario(filtro);
        response.execucao_orcamentaria_ano = await this.buildExecucaoOrcamentariaAno(filtro);
        return response;
    }

    private applyFilter(filtro: PainelEstrategicoFilterDto): string {
        let strFilter = '';
        strFilter = " WHERE p.removido_em is null and p.tipo ='PP' and arquivado = false ";
        if (filtro.projeto_id.length > 0) {
            strFilter += ' and p.id in (' + filtro.projeto_id.toString() + ')';
        }
        if (filtro.orgao_responsavel_id && filtro.orgao_responsavel_id.length > 0) {
            strFilter += ' and p.orgao_responsavel_id in (+' + filtro.orgao_responsavel_id.toString() + ')';
        }
        if (filtro.portfolio_id && filtro.portfolio_id.length > 0) {
            strFilter +=
                ' AND (po.portfolio_id IN (' +
                filtro.portfolio_id.toString() +
                ') OR p.portfolio_id IN (' +
                filtro.portfolio_id.toString() +
                ')) ';
        }
        return strFilter;
    }

    private async addPermissaoProjetos(filtro: PainelEstrategicoFilterDto, user: PessoaFromJwt) {
        filtro.projeto_id = filtro.projeto_id ?? [];

        const allowed = (await this.projetoService.findAllIds('PP', user)).map((p) => p.id);
        filtro.projeto_id = filtro.projeto_id.length ? Arr.intersection(filtro.projeto_id, allowed) : allowed;

        if (filtro.projeto_id.length == 0) filtro.projeto_id.push(-1);

        return filtro;
    }

    private async buildGrandeNumeros(projetoIds: number[]): Promise<PainelEstrategicoGrandesNumeros> {
        const sql = `
            SELECT
                COUNT(DISTINCT projeto_id) AS total_projetos,
                COUNT(DISTINCT orgao_responsavel_id) AS total_orgaos,
                COUNT(DISTINCT meta_id) AS total_metas
            FROM view_painel_estrategico_projeto
            WHERE projeto_id IN (${projetoIds})
        `;

        return ((await this.prisma.$queryRawUnsafe(sql)) as PainelEstrategicoGrandesNumeros[])[0];
    }

    private async buildProjetosPorStatus(projetoIds: number[]): Promise<PainelEstrategicoProjetoStatus[]> {
        const sql = `
            WITH status_counts AS (
                SELECT
                    CASE
                        WHEN status = 'Fechado' THEN 'Concluído'
                        WHEN status = 'EmAcompanhamento' THEN 'Em Acompanhamento'
                        WHEN status = 'EmPlanejamento' THEN 'Em Planejamento'
                        ELSE 'Outros'
                    END as status,
                    COUNT(DISTINCT projeto_id)::int as quantidade
                FROM view_painel_estrategico_projeto
                WHERE projeto_id IN (${projetoIds})
                GROUP BY 1
            ),
            all_status AS (
                SELECT status, COALESCE(quantidade, 0) as quantidade
                FROM (
                    VALUES
                        ('Concluído'),
                        ('Em Acompanhamento'),
                        ('Em Planejamento'),
                        ('Outros')
                ) as s(status)
                LEFT JOIN status_counts USING (status)
            )
            SELECT
                status,
                quantidade
            FROM all_status
            ORDER BY
                CASE WHEN status = 'Outros' THEN 1 ELSE 0 END,
                quantidade DESC`;

        const results = (await this.prisma.$queryRawUnsafe(sql)) as PainelEstrategicoProjetoStatus[];
        return results.filter((r) => !(r.status === 'Outros' && r.quantidade === 0));
    }

    private async buildProjetosPorEtapas(projetoIds: number[]): Promise<PainelEstrategicoProjetoEtapa[]> {
        const sql = `
            WITH projeto_counts AS (
                SELECT
                    CASE
                        WHEN pe.ordem_painel IS NOT NULL THEN pe.descricao
                        WHEN vpe.projeto_etapa_id IS NULL THEN 'Sem Informação'
                        ELSE 'Outros'
                    END as etapa,
                    CASE
                        WHEN pe.ordem_painel IS NOT NULL THEN pe.ordem_painel
                        WHEN vpe.projeto_etapa_id IS NULL THEN 999999999
                        ELSE 999999998
                    END as ordem,
                    COUNT(DISTINCT vpe.projeto_id)::int as quantidade
                FROM view_painel_estrategico_projeto vpe
                LEFT JOIN projeto_etapa pe ON pe.id = vpe.projeto_etapa_id
                WHERE vpe.projeto_id IN (${projetoIds})
                GROUP BY 1, 2
            ),
            all_stages AS (
                SELECT
                    DISTINCT
                    descricao as etapa,
                    ordem_painel as ordem,
                    0 as quantidade
                FROM projeto_etapa
                WHERE ordem_painel IS NOT NULL AND tipo_projeto = 'PP'

                UNION ALL

                SELECT etapa, ordem, quantidade
                FROM (
                    VALUES
                        ('Sem Informação', 999999999, 0),
                        ('Outros', 999999998, 0)
                ) as v(etapa, ordem, quantidade)
            )
            SELECT
                COALESCE(pc.etapa, a.etapa) as etapa,
                COALESCE(pc.ordem, a.ordem) as ordem,
                COALESCE(SUM(pc.quantidade), 0)::int as quantidade
            FROM all_stages a
            LEFT JOIN projeto_counts pc ON pc.etapa = a.etapa
            GROUP BY 1, 2
            ORDER BY 2;
        ;
        `;

        const results = (await this.prisma.$queryRawUnsafe(sql)) as PainelEstrategicoProjetoEtapa[];
        return results.filter((r) => !(r.etapa === 'Outros' && r.quantidade === 0));
    }

    private async buildProjetosConcluidosPorAno(projetoIds: number[]): Promise<PainelEstrategicoProjetosAno[]> {
        const sql = `
            WITH year_range AS (
                SELECT generate_series(
                    DATE_PART('YEAR', CURRENT_DATE)::INT - 3,
                    DATE_PART('YEAR', CURRENT_DATE)::INT
                ) AS ano
            ),
            project_counts AS (
                SELECT
                    COUNT(DISTINCT projeto_id) as quantidade,
                    DATE_PART('year', realizado_termino) as ano
                FROM view_painel_estrategico_projeto
                WHERE realizado_termino IS NOT NULL
                    AND DATE_PART('year', realizado_termino) <= DATE_PART('YEAR', CURRENT_DATE)
                    AND DATE_PART('year', realizado_termino) >= DATE_PART('YEAR', CURRENT_DATE) - 3
                    AND projeto_id IN (${projetoIds})
                GROUP BY DATE_PART('year', realizado_termino)
            )
            SELECT
                COALESCE(SUM(pc.quantidade), 0)::int as quantidade,
                yr.ano
            FROM year_range yr
            LEFT JOIN project_counts pc ON pc.ano = yr.ano
            GROUP BY yr.ano
            ORDER BY yr.ano;
        `;
        return (await this.prisma.$queryRawUnsafe(sql)) as PainelEstrategicoProjetosAno[];
    }

    async buildProjetosConcluidosPorMesAno(projetoIds: number[]): Promise<PainelEstrategicoProjetosMesAno[]> {
        const sql = `
            WITH RECURSIVE date_series AS (
                SELECT
                    date_trunc('month',
                        make_date(
                            EXTRACT(YEAR FROM CURRENT_DATE)::int - 3,
                            1,
                            1
                        )
                    )::date as data_
                UNION ALL
                SELECT
                    (data_ + interval '1 month')::date
                FROM date_series
                WHERE data_ < make_date(
                    EXTRACT(YEAR FROM CURRENT_DATE)::int,
                    12,
                    1
                )
            ),
            project_counts AS (
                SELECT
                    COUNT(DISTINCT projeto_id) as quantidade,
                    ano_termino as ano,
                    mes_termino as mes,
                    EXTRACT(YEAR FROM CURRENT_DATE) - ano_termino as linha,
                    mes_termino - 1 as coluna
                FROM view_painel_estrategico_projeto
                WHERE realizado_termino IS NOT NULL
                    AND ano_termino <= EXTRACT(YEAR FROM CURRENT_DATE)
                    AND ano_termino >= EXTRACT(YEAR FROM CURRENT_DATE) - 3
                    AND projeto_id IN (${projetoIds})
                GROUP BY ano_termino, mes_termino
            ),
            all_dates AS (
                SELECT
                    EXTRACT(YEAR FROM data_) as ano,
                    EXTRACT(MONTH FROM data_) as mes,
                    EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM data_) as linha,
                    EXTRACT(MONTH FROM data_) - 1 as coluna
                FROM date_series
            )
            SELECT
                COALESCE(SUM(pc.quantidade), 0)::int as quantidade,
                ad.ano::int,
                ad.mes::int,
                ad.linha::int,
                ad.coluna::int
            FROM all_dates ad
            LEFT JOIN project_counts pc
                ON pc.ano = ad.ano
                AND pc.mes = ad.mes
            GROUP BY
                ad.ano,
                ad.mes,
                ad.linha,
                ad.coluna
            ORDER BY
                ad.ano,
                ad.mes;
        `;
        return (await this.prisma.$queryRawUnsafe(sql)) as PainelEstrategicoProjetosMesAno[];
    }

    private async buildProjetosPlanejadosPorAno(projetoIds: number[]): Promise<PainelEstrategicoProjetosAno[]> {
        const sql = `
            WITH year_range AS (
                SELECT generate_series(
                    EXTRACT(YEAR FROM CURRENT_DATE)::INT,
                    EXTRACT(YEAR FROM CURRENT_DATE)::INT + 3
                ) AS ano
            ),
            project_counts AS (
                SELECT
                    COUNT(DISTINCT projeto_id) as quantidade,
                    ano_previsao as ano
                FROM view_painel_estrategico_projeto
                WHERE realizado_termino IS NULL
                    AND previsao_termino IS NOT NULL
                    AND ano_previsao >= EXTRACT(YEAR FROM CURRENT_DATE)
                    AND ano_previsao <= EXTRACT(YEAR FROM CURRENT_DATE) + 3
                    AND projeto_id IN (${projetoIds})
                GROUP BY ano_previsao
            )
            SELECT
                COALESCE(SUM(pc.quantidade), 0)::int as quantidade,
                yr.ano
            FROM year_range yr
            LEFT JOIN project_counts pc ON pc.ano = yr.ano
            GROUP BY yr.ano
            ORDER BY yr.ano DESC
        `;
        return (await this.prisma.$queryRawUnsafe(sql)) as PainelEstrategicoProjetosAno[];
    }

    private async buildProjetosPlanejadosPorMesAno(projetoIds: number[]): Promise<PainelEstrategicoProjetosMesAno[]> {
        const sql = `
            WITH RECURSIVE date_series AS (
                SELECT
                    date_trunc('month',
                        make_date(
                            EXTRACT(YEAR FROM CURRENT_DATE)::int - 3,
                            1,
                            1
                        )
                    )::date as data_
                UNION ALL
                SELECT
                    (data_ + interval '1 month')::date
                FROM date_series
                WHERE data_ < date_trunc('month', make_date(
                    EXTRACT(YEAR FROM CURRENT_DATE)::int + 3,
                    12,
                    1
                ))
            ),
            project_counts AS (
                SELECT
                    COUNT(DISTINCT projeto_id) as quantidade,
                    ano_previsao as ano,
                    EXTRACT(MONTH FROM previsao_termino) as mes,  -- Changed this line
                    EXTRACT(MONTH FROM previsao_termino) - 1 as coluna  -- And this line
                FROM view_painel_estrategico_projeto
                WHERE realizado_termino IS NULL
                    AND previsao_termino IS NOT NULL
                    AND ano_previsao >= EXTRACT(YEAR FROM CURRENT_DATE) - 3
                    AND ano_previsao <= EXTRACT(YEAR FROM CURRENT_DATE) + 3
                    AND projeto_id IN (${projetoIds})
                GROUP BY ano_previsao, previsao_termino  -- Changed this line
            ),
            all_dates AS (
                SELECT
                    EXTRACT(YEAR FROM data_) as ano,
                    EXTRACT(MONTH FROM data_) as mes,
                    EXTRACT(MONTH FROM data_) - 1 as coluna
                FROM date_series
            )
            SELECT
                COALESCE(SUM(pc.quantidade), 0)::int as quantidade,
                ad.ano::int,
                ad.mes::int,
                CASE
                    WHEN ad.ano < EXTRACT(YEAR FROM CURRENT_DATE) THEN -1
                    WHEN ad.ano = EXTRACT(YEAR FROM CURRENT_DATE) THEN 3
                    WHEN ad.ano = EXTRACT(YEAR FROM CURRENT_DATE) + 1 THEN 2
                    WHEN ad.ano = EXTRACT(YEAR FROM CURRENT_DATE) + 2 THEN 1
                    WHEN ad.ano = EXTRACT(YEAR FROM CURRENT_DATE) + 3 THEN 0
                END as linha,
                ad.coluna::int
            FROM all_dates ad
            LEFT JOIN project_counts pc
                ON pc.ano = ad.ano
                AND pc.mes = ad.mes
            GROUP BY
                ad.ano,
                ad.mes,
                ad.coluna
            ORDER BY
                ad.ano,
                ad.mes;
        `;
        return (await this.prisma.$queryRawUnsafe(sql)) as PainelEstrategicoProjetosMesAno[];
    }

    private async buildProjetosOrgaoResponsavel(projetoIds: number[]): Promise<PainelEstrategicoOrgaoResponsavel[]> {
        return this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<PainelEstrategicoOrgaoResponsavel[]> => {
                const result = await prismaTx.$queryRaw<PainelEstrategicoOrgaoResponsavel[]>`
                    WITH orgao_counts AS (
                        SELECT
                            COUNT(DISTINCT projeto_id)::int as quantidade,
                            orgao_sigla,
                            orgao_descricao,
                            ROW_NUMBER() OVER (ORDER BY COUNT(DISTINCT projeto_id) DESC) as ranking
                        FROM view_painel_estrategico_projeto
                        WHERE projeto_id = ANY(${projetoIds}::bigint[]) AND orgao_sigla IS NOT NULL
                        GROUP BY orgao_sigla, orgao_descricao
                    )
                    SELECT
                        quantidade,
                        orgao_sigla,
                        orgao_descricao,
                        CASE WHEN ranking <= 10 THEN 1 ELSE 0 END as indice
                    FROM orgao_counts
                    WHERE ranking <= 10
                    UNION ALL
                    SELECT
                        SUM(quantidade)::int,
                        'OUTROS',
                        'Outros',
                        0
                    FROM orgao_counts
                    WHERE ranking > 10
                    HAVING SUM(quantidade) > 0
                    ORDER BY indice DESC, quantidade DESC
                `;

                return result;
            }
        );
    }

    buildAnosMapaCalor(anoBase: number, quantidadeAnos: number): number[] {
        const resultado = [];
        resultado.push(anoBase);
        if (quantidadeAnos > 0) {
            for (let i = 0; i < quantidadeAnos; i++) {
                anoBase = anoBase + 1;
                resultado.push(anoBase);
            }
            resultado.sort((a, b) => {
                if (a > b) {
                    return -1;
                }
                if (a < b) {
                    return 1;
                }
                return 0;
            });
        } else {
            for (let i = 0; i > quantidadeAnos; i--) {
                anoBase = anoBase - 1;
                resultado.push(anoBase);
            }
        }
        return resultado;
    }

    private async buildQuantidadesProjeto(projetoIds: number[]): Promise<PainelEstrategicoQuantidadesAnoCorrente> {
        const sql = `
            WITH ano_corrente AS (
                SELECT EXTRACT(YEAR FROM CURRENT_DATE) as ano
            ),
            contagens AS (
                SELECT
                    COUNT(DISTINCT CASE
                        WHEN realizado_termino IS NULL
                            AND previsao_termino IS NOT NULL
                            AND ano_previsao = (SELECT ano FROM ano_corrente)
                        THEN projeto_id END)::int as quantidade_planejada,
                    COUNT(DISTINCT CASE
                        WHEN realizado_termino IS NOT NULL
                            AND ano_termino = (SELECT ano FROM ano_corrente)
                        THEN projeto_id END)::int as quantidade_concluida
                FROM view_painel_estrategico_projeto
                WHERE projeto_id IN (${projetoIds})
            )
            SELECT
                quantidade_planejada,
                quantidade_concluida,
                (SELECT ano FROM ano_corrente)::int as ano
            FROM contagens;
        `;

        return ((await this.prisma.$queryRawUnsafe(sql)) as PainelEstrategicoQuantidadesAnoCorrente[])[0];
    }

    async listaProjetosPaginado(
        filtro: PainelEstrategicoListaFilterDto,
        user: PessoaFromJwt
    ): Promise<PaginatedWithPagesDto<PainelEstrategicoProjeto>> {
        let retToken = filtro.token_paginacao;
        const filterToken = filtro.token_paginacao;
        let ipp = filtro.ipp ?? 25;
        const page = filtro.pagina ?? 1;
        let total_registros = 0;
        let tem_mais = false;

        if (page > 1 && !filtro.token_paginacao) throw new HttpException('Campo obrigatório para paginação', 400);

        // para não atrapalhar no hash, remove o campo pagina
        delete filtro.pagina;
        delete filtro.token_paginacao;
        let now = new Date(Date.now());
        filtro = await this.addPermissaoProjetos(filtro, user);
        const whereFilter = this.applyFilter(filtro);
        if (filterToken) {
            const decoded = this.decodeNextPageToken(filterToken, filtro);
            total_registros = decoded.total_rows;
            ipp = decoded.ipp;
            now = new Date(decoded.issued_at);
        }
        const offset = (page - 1) * ipp;
        const sql = `select distinct
                            p.nome,
                            p.id,
                            coalesce(org.sigla,'') as secretaria_sigla,
                            coalesce(org.descricao,'') as secretaria_descricao,
                            org.id as secretaria_id,
                            coalesce(m.codigo,'') as meta_codigo,
                            coalesce(m.titulo,'') as meta_titulo,
                            m.id as meta_id,
                            p.status,
                            pe.descricao as etapa,
                            TO_CHAR(tc.projecao_termino, 'yyyy/mm/dd') as termino_projetado,
                            tc.percentual_atraso,
                            (select count(*)
                             from projeto_risco pr
                             where pr.projeto_id = p.id
                               and pr.status_risco <> 'Fechado') ::int as riscos_abertos,
                            coalesce(p.codigo,'') as codigo
                     FROM projeto p
                     full outer JOIN (SELECT
                                            ppc.projeto_id,
                                            po_1.id as portfolio_id
                                            FROM portfolio_projeto_compartilhado ppc
                                             JOIN portfolio po_1 ON po_1.id = ppc.portfolio_id
                                            WHERE ppc.removido_em IS NULL) po ON po.projeto_id = p.id
                      left join tarefa_cronograma tc ON tc.projeto_id = p.id AND tc.removido_em IS NULL
                      left join projeto_etapa pe on pe.id = p.projeto_etapa_id
                      left join orgao org on org.id = p.orgao_responsavel_id
                      left join meta m on m.id = p.meta_id
                     ${whereFilter}
                     order by etapa
                     limit ${ipp} offset ${offset}`;
        const linhas = (await this.prisma.$queryRawUnsafe(sql)) as any[];

        const retorno: PainelEstrategicoProjeto[] = [];
        linhas.forEach((linha) => {
            retorno.push({
                id: linha.id,
                etapa_atual: linha.etapa,
                meta: {
                    nome: linha.meta_titulo,
                    codigo: linha.meta_codigo,
                    id: linha.meta_id,
                },
                nome_projeto: linha.nome,
                percentual_atraso: linha.percentual_atraso,
                riscos_abertos: linha.riscos_abertos,
                secretaria: {
                    nome: linha.secretaria_descricao,
                    codigo: linha.secretaria_sigla,
                    id: linha.secretaria_id,
                },
                status: linha.status,
                termino_projetado: linha.termino_projetado,
                projeto_codigo: linha.codigo,
            });
        });
        if (filterToken) {
            retToken = filterToken;
        } else {
            const info = await this.encodeNextPageTokenListaProjetos(whereFilter, now, filtro, filtro.ipp);
            retToken = info.jwt;
            total_registros = info.body.total_rows;
        }
        tem_mais = offset + linhas.length < total_registros;
        const paginas = total_registros > ipp ? Math.ceil(total_registros / ipp) : 1;
        return {
            tem_mais: tem_mais,
            total_registros: total_registros,
            token_paginacao: retToken,
            paginas: paginas,
            pagina_corrente: page,
            linhas: retorno,
            token_ttl: PAGINATION_TOKEN_TTL,
        };
    }

    private async encodeNextPageTokenListaProjetos(
        whereFilter: string,
        issued_at: Date,
        filter: PainelEstrategicoListaFilterDto,
        ipp?: number
    ): Promise<{
        jwt: string;
        body: AnyPageTokenJwtBody;
    }> {
        const quantidade_rows = (await this.prisma.$queryRawUnsafe(`select count(distinct p.id) ::int
                                                                   FROM projeto p
                                                                   full outer JOIN (SELECT
                                                                                        ppc.projeto_id,
                                                                                        po_1.id as portfolio_id
                                                                                    FROM portfolio_projeto_compartilhado ppc
                                                                                    JOIN portfolio po_1 ON po_1.id = ppc.portfolio_id
                                                                                    WHERE ppc.removido_em IS NULL) po
                                                                   ON po.projeto_id = p.id
                                                                            left join projeto_etapa pe on pe.id = p.projeto_etapa_id
                                                                            left join orgao org on org.id = p.orgao_responsavel_id
                                                                            left join meta m on m.id = p.meta_id
                                                                       ${whereFilter} `)) as any;

        const body = {
            search_hash: Object2Hash(filter),
            ipp: ipp!,
            issued_at: issued_at.valueOf(),
            total_rows: quantidade_rows[0].count,
        } satisfies AnyPageTokenJwtBody;
        return {
            jwt: this.jwtService.sign(body),
            body,
        };
    }

    private decodeNextPageToken(
        jwt: string | undefined,
        filters: PainelEstrategicoListaFilterDto
    ): AnyPageTokenJwtBody {
        let tmp: AnyPageTokenJwtBody | null = null;

        try {
            if (jwt) tmp = this.jwtService.verify(jwt) as AnyPageTokenJwtBody;
        } catch {
            throw new HttpException('token_paginacao invalido', 400);
        }
        if (!tmp) throw new HttpException('token_paginacao invalido ou faltando', 400);
        if (tmp.search_hash != Object2Hash(filters))
            throw new HttpException(
                'Parâmetros da busca não podem ser diferente da busca inicial para avançar na paginação.',
                400
            );
        return tmp;
    }
    private async buildResumoOrcamentario(filtro: PainelEstrategicoFilterDto) {
        //Constroi o filter
        let strFilterGeral = " where p.removido_em is null and p.tipo ='PP' and arquivado = false ";
        //Cria apenas os projetos e orgãos responsáveis
        strFilterGeral = ' WHERE 1 = 1 ';
        if (filtro.projeto_id.length > 0) {
            strFilterGeral += ' and bp.id in (' + filtro.projeto_id.toString() + ')';
        }
        if (filtro.orgao_responsavel_id && filtro.orgao_responsavel_id.length > 0) {
            strFilterGeral += ' and bp.orgao_responsavel_id in (+' + filtro.orgao_responsavel_id.toString() + ')';
        }
        //Cria o filtro de portfolio
        let strPortfolio = '';
        let strPortfolio2 = '';
        if (filtro.portfolio_id && filtro.portfolio_id.length > 0) {
            strPortfolio = ' and pr.portfolio_id in (' + filtro.portfolio_id.toString() + ')';
            strPortfolio2 = ' and pp.portfolio_id in (' + filtro.portfolio_id.toString() + ')';
        }
        const sql = `select
                         sum((select previsao_custo total_custo from tarefa_cronograma tc where tc.projeto_id = bp.id and tc.removido_em is null)) custo_planejado_total,
                         sum((select sum(orc.soma_valor_empenho) from orcamento_realizado orc where orc.projeto_id = bp.id and orc.removido_em is null)) valor_empenhado_total,
                         sum((select sum(orc.soma_valor_liquidado) from orcamento_realizado orc where orc.projeto_id = bp.id and orc.removido_em is null)) valor_liquidado_total
                     from
                         (select pr.id,
                                 pr.nome,
                                 pr.codigo,
                                 (select m.id from meta m, pdm where pdm.tipo= 'PDM' and m.pdm_id = pdm.id and m.id = pr.meta_id) meta_id,
                                 pr.orgao_responsavel_id
                          from projeto pr
                          where   pr.removido_em is null
                            and pr.arquivado = false
                            and pr.tipo = 'PP'
                            ${strPortfolio}
                          union
                          select p.id,
                                 p.nome,
                                 p.codigo,
                                 (select m.id from meta m, pdm where pdm.tipo= 'PDM' and m.pdm_id = pdm.id and m.id = p.meta_id) meta_id,
                                 p.orgao_responsavel_id
                          from projeto p, portfolio_projeto_compartilhado pp
                          where pp.projeto_id = p.id
                            and pp.removido_em is null
                            and p.removido_em is null
                            and p.arquivado = false
                            and p.tipo = 'PP'
                            ${strPortfolio2}) bp
                            ${strFilterGeral} `;
        return ((await await this.prisma.$queryRawUnsafe(sql)) as PainelEstrategicoResumoOrcamentario[])[0];
    }

    private async buildExecucaoOrcamentariaAno(filtro: PainelEstrategicoFilterDto) {
        let projectIds = '';
        let hasProjetos = '-1';
        if (filtro.projeto_id.length > 0) {
            hasProjetos = '0';
            projectIds = filtro.projeto_id.join(',');
        }

        //Cria o filtro de portfolio
        let strPortfolio = '';
        let strPortfolio2 = '';
        if (filtro.portfolio_id && filtro.portfolio_id.length > 0) {
            strPortfolio += ' and pr.portfolio_id in (' + filtro.portfolio_id.toString() + ')';
            strPortfolio2 = ' and pp.portfolio_id in (' + filtro.portfolio_id.toString() + ')';
        }

        // Filtro de órgão responsável
        let strOrgao = '';
        let strOrgao2 = '';
        if (filtro.orgao_responsavel_id && filtro.orgao_responsavel_id.length > 0) {
            strOrgao = ' and pr.orgao_responsavel_id in (' + filtro.orgao_responsavel_id.toString() + ')';
            strOrgao2 = ' and p.orgao_responsavel_id in (' + filtro.orgao_responsavel_id.toString() + ')';
        }

        const sql = `
            WITH projeto_base AS (
                SELECT pr.id,
                       pr.orgao_responsavel_id
                FROM projeto pr
                WHERE pr.removido_em IS NULL
                  AND pr.arquivado = FALSE
                  AND pr.tipo = 'PP'
                  ${strPortfolio}
                  ${strOrgao}
                UNION
                SELECT p.id,
                       p.orgao_responsavel_id
                FROM projeto p,
                     portfolio_projeto_compartilhado pp
                WHERE pp.projeto_id = p.id
                  AND pp.removido_em IS NULL
                  AND p.removido_em IS NULL
                  AND p.arquivado = FALSE
                  AND p.tipo = 'PP'
                  ${strPortfolio2}
                  ${strOrgao2}
            ),
            tarefa_custos AS (
                SELECT sum(t.custo_estimado) AS previsao_custo,
                       date_part('year', t.termino_planejado) AS ano_referencia,
                       tc.projeto_id
                FROM tarefa_cronograma tc
                JOIN tarefa t ON t.tarefa_cronograma_id = tc.id
                WHERE tc.removido_em IS NULL
                  AND t.n_filhos_imediatos = 0
                  AND t.removido_em IS NULL
              GROUP BY date_part('year', t.termino_planejado), tc.projeto_id
            ),
            orc_realizado as (
                SELECT sum(orcr.soma_valor_empenho) AS soma_valor_empenho,
                         sum(orcr.soma_valor_liquidado) AS soma_valor_liquidado,
                         ano_referencia,
                         orcr.projeto_id
                FROM orcamento_realizado orcr
                WHERE orcr.removido_em IS NULL
                GROUP BY ano_referencia, orcr.projeto_id
           )
            SELECT
                sum(COALESCE(tc.previsao_custo, 0))::float AS custo_planejado_total,
                sum(COALESCE(orcr.soma_valor_empenho, 0))::float AS valor_empenhado_total,
                sum(COALESCE(orcr.soma_valor_liquidado, 0))::float AS valor_liquidado_total,
                years.yr AS ano_referencia
            FROM generate_series(
                DATE_PART('YEAR', CURRENT_DATE)::INT - 3,
                DATE_PART('YEAR', CURRENT_DATE)::INT + 3
            ) years(yr)
            JOIN projeto_base p ON (p.id IN (${projectIds}) OR ${hasProjetos} = -1)
            LEFT JOIN tarefa_custos tc ON tc.ano_referencia = years.yr AND tc.projeto_id = p.id
                AND (tc.projeto_id IN (${projectIds}) OR ${hasProjetos} = -1)
            LEFT JOIN orc_realizado orcr ON orcr.ano_referencia = years.yr AND orcr.projeto_id = p.id
                AND (orcr.projeto_id IN (${projectIds}) OR ${hasProjetos} = -1 )

            GROUP BY years.yr
            ORDER BY years.yr`;

        console.log(sql);

        return (await this.prisma.$queryRawUnsafe(sql)) as PainelEstrategicoExecucaoOrcamentariaAno[];
    }

    private async encodeNextPageTokenListaExecucaoOrcamentaria(
        whereFilter: string,
        portifolio_filter: string,
        portifolio_filter2: string,
        issued_at: Date,
        filter: PainelEstrategicoListaFilterDto,
        ipp?: number
    ): Promise<{
        jwt: string;
        body: AnyPageTokenJwtBody;
    }> {
        const quantidade_rows = (await this.prisma.$queryRawUnsafe(`select
            count(*)::int
        from (
            select
                pr.id,
                pr.orgao_responsavel_id
            from projeto pr
            where pr.removido_em is null
              and pr.arquivado = false
              and pr.tipo = 'PP'
              ${portifolio_filter}
            union
            select
                p.id,
                p.orgao_responsavel_id
            from projeto p,
                 portfolio_projeto_compartilhado pp
            where pp.projeto_id = p.id
              and pp.removido_em is null
              and p.removido_em is null
              and p.arquivado = false
              and p.tipo = 'PP'
              ${portifolio_filter2}
        ) p
        where 1 = 1 ${whereFilter}`)) as any;

        const body = {
            search_hash: Object2Hash(filter),
            ipp: ipp!,
            issued_at: issued_at.valueOf(),
            total_rows: quantidade_rows[0].count,
        } satisfies AnyPageTokenJwtBody;

        return {
            jwt: this.jwtService.sign(body),
            body,
        };
    }

    async listaExecucaoOrcamentaria(filtro: PainelEstrategicoListaFilterDto, user: PessoaFromJwt) {
        let retToken = filtro.token_paginacao;
        const filterToken = filtro.token_paginacao;
        let ipp = filtro.ipp ?? 25;
        const page = filtro.pagina ?? 1;
        let total_registros = 3;
        let tem_mais = false;

        if (page > 1 && !filtro.token_paginacao) throw new HttpException('Campo obrigatório para paginação', 400);

        // para não atrapalhar no hash, remove o campo pagina
        delete filtro.pagina;
        delete filtro.token_paginacao;
        let now = new Date(Date.now());

        //Cria apenas os projetos e orgãos responsáveis
        filtro = await this.addPermissaoProjetos(filtro, user);
        let strFilterGeral = '';
        if (filtro.projeto_id.length > 0) {
            strFilterGeral += ' and p.id in (' + filtro.projeto_id.toString() + ')';
        }
        if (filtro.orgao_responsavel_id && filtro.orgao_responsavel_id.length > 0) {
            strFilterGeral += ' and p.orgao_responsavel_id in (+' + filtro.orgao_responsavel_id.toString() + ')';
        }

        //Cria o filtro de portfoliio
        let strPortfolio = '';
        let strPortfolio2 = '';
        if (filtro.portfolio_id && filtro.portfolio_id.length > 0) {
            strPortfolio = ' and pr.portfolio_id in (' + filtro.portfolio_id.toString() + ')';
            strPortfolio2 = ' and pp.portfolio_id in (' + filtro.portfolio_id.toString() + ')';
        }

        if (filterToken) {
            const decoded = this.decodeNextPageToken(filterToken, filtro);
            total_registros = decoded.total_rows;
            ipp = decoded.ipp;
            now = new Date(decoded.issued_at);
        }
        const offset = (page - 1) * ipp;
        //ordernar pelo custo planejado total decrescente
        const sql = `select * from (
                        select (
                             select tc.previsao_custo
                             from tarefa_cronograma tc
                             where tc.projeto_id = p.id
                               and tc.removido_em is null
                         )::float AS valor_custo_planejado_total,
                         (
                            select sum(t.custo_estimado)
                            from tarefa_cronograma tc
                             inner join tarefa t on t.tarefa_cronograma_id = tc.id and t.removido_em is null
                            where not exists(select tarefa_pai_id from tarefa where tarefa_pai_id = t.id and removido_em is null)
                            and tc.projeto_id = p.id
                            and tc.removido_em is null
                            and t.termino_planejado <= current_date
                         )::float AS valor_custo_planejado_hoje,
                         orc.soma_valor_empenho ::float as valor_empenhado_total,
                         orc.soma_valor_liquidado::float as valor_liquidado_total,
                         p.nome as nome_projeto,
                         p.codigo as codigo_projeto,
                         p.id as id,
                        (
                            exists(
                                SELECT 1
                                FROM tarefa_cronograma tc
                                JOIN tarefa t ON t.tarefa_cronograma_id = tc.id
                                WHERE tc.removido_em IS NULL
                                  AND t.n_filhos_imediatos = 0
                                  AND t.removido_em IS NULL
                                  AND t.termino_planejado is null
                                  AND tc.projeto_id = p.id
                                  AND t.custo_estimado IS NOT NULL
                            )
                        ) AS ha_anos_nulos
                     from (select pr.id,
                                  pr.nome,
                                  pr.orgao_responsavel_id,
                                  pr.codigo
                           from projeto pr
                           where pr.removido_em is null
                             and pr.arquivado = false
                             and pr.tipo = 'PP'
                               ${strPortfolio}
                           union
                           select p.id,
                                  p.nome,
                                  p.orgao_responsavel_id,
                                  p.codigo
                           from projeto p,
                                portfolio_projeto_compartilhado pp
                           where pp.projeto_id = p.id
                             and pp.removido_em is null
                             and p.removido_em is null
                             and p.arquivado = false
                             and p.tipo = 'PP'
                               ${strPortfolio2}) p
                              left join (select vp.nome,
                                                 vp.id                          as projeto_id,
                                                 sum(orcr.soma_valor_empenho)   as soma_valor_empenho,
                                                 sum(orcr.soma_valor_liquidado) as soma_valor_liquidado
                                          from orcamento_realizado orcr
                                                   left join view_projetos vp on orcr.projeto_id = vp.id
                                                   inner join projeto p on p.id = vp.id
                                          where p.tipo = 'PP'
                                            and p.removido_em is null
                                            and orcr.removido_em is null
                                          group by vp.nome, vp.id) orc on orc.projeto_id = p.id
                     where 1 = 1 ${strFilterGeral} ) t order by valor_custo_planejado_total desc
                     limit ${ipp} offset ${offset}`;
        console.log('the query', sql);
        const linhas = (await this.prisma.$queryRawUnsafe(sql)) as PainelEstrategicoExecucaoOrcamentariaLista[];
        console.log('linhas', linhas);
        // executar depois da query
        if (filterToken) {
            retToken = filterToken;
        } else {
            const info = await this.encodeNextPageTokenListaExecucaoOrcamentaria(
                strFilterGeral,
                strPortfolio,
                strPortfolio2,
                now,
                filtro,
                filtro.ipp
            );
            retToken = info.jwt;
            total_registros = info.body.total_rows;
        }
        tem_mais = offset + linhas.length < total_registros;
        const paginas = total_registros > ipp ? Math.ceil(total_registros / ipp) : 1;
        return {
            tem_mais: tem_mais,
            pagina_corrente: 1,
            total_registros: total_registros,
            token_paginacao: retToken,
            paginas: paginas,
            linhas: linhas,
            token_ttl: PAGINATION_TOKEN_TTL,
        } satisfies PaginatedWithPagesDto<PainelEstrategicoExecucaoOrcamentariaLista>;
    }

    async buildGeoLocalizacao(
        filtro: PainelEstrategicoFilterDto,
        user: PessoaFromJwt
    ): Promise<PainelEstrategicoGeoLocalizacaoDto> {
        //Cria apenas os projetos e orgãos responsáveis
        filtro = await this.addPermissaoProjetos(filtro, user);
        const whereFilter = this.applyFilter(filtro);
        const sql = `select distinct p.nome       as nome_projeto,
                                     p.id         as projeto_id,
                                     p.codigo     as projeto_codigo,
                                     pe.descricao as projeto_etapa,
                                     CASE
                                         WHEN p.status = 'Registrado'::"ProjetoStatus" THEN 'Registrado'::text
                                         WHEN p.status = 'Selecionado'::"ProjetoStatus" THEN 'Selecionado'::text
                                         WHEN p.status = 'EmPlanejamento'::"ProjetoStatus" THEN 'Em Planejamento'::text
                                         WHEN p.status = 'Planejado'::"ProjetoStatus" THEN 'Planejado'::text
                                         WHEN p.status = 'Validado'::"ProjetoStatus" THEN 'Validado'::text
                                         WHEN p.status = 'EmAcompanhamento'::"ProjetoStatus" THEN 'Em Acompanhamento'::text
                                         WHEN p.status = 'Suspenso'::"ProjetoStatus" THEN 'Suspenso'::text
                                         WHEN p.status = 'Fechado'::"ProjetoStatus" THEN 'Concluído'::text
                                         ELSE NULL::text
                                         END      AS status
                     FROM projeto p full outer JOIN (SELECT
                                                        ppc.projeto_id,
                                                        po_1.id as portfolio_id
                                                    FROM portfolio_projeto_compartilhado ppc
                                                    JOIN portfolio po_1 ON po_1.id = ppc.portfolio_id
                                                    WHERE ppc.removido_em IS NULL) po ON po.projeto_id = p.id
                                                    left join projeto_etapa pe on pe.id = p.projeto_etapa_id
                                                    JOIN geo_localizacao_referencia glr ON glr.projeto_id = p.id AND glr.removido_em IS NULL
                    ${whereFilter}`;
        const linhas = (await this.prisma.$queryRawUnsafe(sql)) as any[];

        const geoDto = new ReferenciasValidasBase();
        geoDto.projeto_id = linhas.map((r) => r.projeto_id);
        const geolocalizacao = await this.geolocService.carregaReferencias(geoDto);

        const retorno: PainelEstrategicoGeoLocalizacaoDto = new PainelEstrategicoGeoLocalizacaoDto();
        retorno.linhas = [];
        linhas.forEach((linha) => {
            retorno.linhas.push({
                projeto_nome: linha.nome_projeto,
                projeto_id: linha.projeto_id,
                projeto_codigo: linha.projeto_codigo,
                projeto_etapa: linha.projeto_etapa,
                projeto_status: linha.status,
                geolocalizacao: geolocalizacao.get(linha.projeto_id) || [],
            });
        });
        return retorno;
    }

    async buildGeoLocalizacaoV2(
        filtro: PainelEstrategicoFilterDto,
        user: PessoaFromJwt
    ): Promise<PainelEstrategicoGeoLocalizacaoDtoV2> {
        //Cria apenas os projetos e orgãos responsáveis
        filtro = await this.addPermissaoProjetos(filtro, user);
        const whereFilter = this.applyFilter(filtro);
        const sql = `
            SELECT
                p.id as projeto_id,
                p.codigo as projeto_codigo,
                p.nome as projeto_nome,
                gl.tipo,
                gl.endereco_exibicao,
                gl.lat as endereco_lat,
                gl.lon as endereco_lon,
                gl.geom_geojson as endereco_geom_geojson,
                array_agg(glc.geo_camada_id) as camadas,
                COALESCE(org.sigla, '') as orgao_resp_sigla,
                COALESCE(pe.descricao, '') as projeto_etapa,
                CASE
                    WHEN p.status = 'Registrado'::"ProjetoStatus" THEN 'Registrado'::text
                    WHEN p.status = 'Selecionado'::"ProjetoStatus" THEN 'Selecionado'::text
                    WHEN p.status = 'EmPlanejamento'::"ProjetoStatus" THEN 'EmPlanejamento'::text
                    WHEN p.status = 'Planejado'::"ProjetoStatus" THEN 'Planejado'::text
                    WHEN p.status = 'Validado'::"ProjetoStatus" THEN 'Validado'::text
                    WHEN p.status = 'EmAcompanhamento'::"ProjetoStatus" THEN 'EmAcompanhamento'::text
                    WHEN p.status = 'Suspenso'::"ProjetoStatus" THEN 'Suspenso'::text
                    WHEN p.status = 'Fechado'::"ProjetoStatus" THEN 'Fechado'::text
                    ELSE NULL::text
                END as projeto_status
            FROM projeto p
            FULL OUTER JOIN (
                SELECT
                    ppc.projeto_id,
                    po_1.id as portfolio_id
                FROM portfolio_projeto_compartilhado ppc
                JOIN portfolio po_1 ON po_1.id = ppc.portfolio_id
                WHERE ppc.removido_em IS NULL
            ) po ON po.projeto_id = p.id
            JOIN geo_localizacao_referencia glr ON glr.projeto_id = p.id AND glr.removido_em IS NULL
            JOIN geo_localizacao gl ON gl.id = glr.geo_localizacao_id
            LEFT JOIN geo_localizacao_camada glc ON glc.geo_localizacao_id = gl.id
            LEFT JOIN orgao org ON org.id = p.orgao_responsavel_id
            LEFT JOIN projeto_etapa pe ON pe.id = p.projeto_etapa_id
            ${whereFilter}
            GROUP BY 1,2,3,4,5,6,7,8,org.sigla,pe.descricao
            `;

        const linhas = (await this.prisma.$queryRawUnsafe(sql)) as any[];

        const retorno: PainelEstrategicoGeoLocalizacaoDtoV2 = {
            linhas: linhas.map(
                (linha) =>
                    ({
                        projeto_id: linha.projeto_id,
                        projeto_status: linha.projeto_status,
                        projeto_etapa: linha.projeto_etapa,
                        orgao_resp_sigla: linha.orgao_resp_sigla,
                        projeto_nome: linha.projeto_nome,
                        geolocalizacao_sumario: {
                            tipo: linha.tipo,
                            endereco_exibicao: linha.endereco_exibicao,
                            camadas: linha.camadas,
                            endereco_lat: linha.endereco_lat,
                            endereco_long: linha.endereco_lon,
                            endereco_geom_geojson: linha.endereco_geom_geojson,
                        },
                    }) satisfies PainelEstrategicoGeoLocalizacaoV2
            ),
        };
        return retorno;
    }

    @Cron('*/2 * * * *')
    async refreshMaterializedView() {
        if (IsCrontabDisabled('task')) return;
        try {
            Logger.log('Atualizando view painel estrategico projeto');
            await this.prisma.$queryRaw`refresh materialized view view_painel_estrategico_projeto;`;
        } catch (error) {
            Logger.error(error);
        }
    }
}
