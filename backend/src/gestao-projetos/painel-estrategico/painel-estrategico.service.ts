import { HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PainelEstrategicoFilterDto, PainelEstrategicoListaFilterDto } from './dto/painel-estrategico-filter.dto';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import {
    PainelEstrategicoExecucaoOrcamentariaAno,
    PainelEstrategicoExecucaoOrcamentariaLista,
    PainelEstrategicoGeoLocalizacaoDto,
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
import { Prisma } from '@prisma/client';
import { ProjetoService } from '../../pp/projeto/projeto.service';
import { AnyPageTokenJwtBody, PaginatedWithPagesDto, PAGINATION_TOKEN_TTL } from '../../common/dto/paginated.dto';
import { Object2Hash } from '../../common/object2hash';
import { JwtService } from '@nestjs/jwt';
import { ReferenciasValidasBase } from '../../geo-loc/entities/geo-loc.entity';
import { GeoLocService } from '../../geo-loc/geo-loc.service';
import { Arr } from '../../mf/metas/dash/metas.service';

@Injectable()
export class PainelEstrategicoService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly projetoService: ProjetoService,
        private readonly jwtService: JwtService,
        private readonly geolocService: GeoLocService
    ) {}

    async buildPainel(filtro: PainelEstrategicoFilterDto, user: PessoaFromJwt): Promise<PainelEstrategicoResponseDto> {
        //Já realiza o filtro dos ids dos projetos e adiciona no filtro recebido
        filtro = await this.addPermissaoProjetos(filtro, user);
        const strFilter = this.applyFilter(filtro);
        const response = new PainelEstrategicoResponseDto();
        response.grandes_numeros = await this.buildGrandeNumeros(strFilter);
        response.projeto_status = await this.buildProjetosPorStatus(strFilter);
        response.projeto_etapas = await this.buildProjetosPorEtapas(strFilter);
        response.projetos_concluidos_ano = await this.buildProjetosConcluidosPorAno(strFilter);
        response.projetos_concluidos_mes = await this.buildProjetosConcluidosPorMesAno(strFilter);
        response.projetos_planejados_ano = await this.buildProjetosPlanejadosPorAno(strFilter);
        response.projetos_planejados_mes = await this.buildProjetosPlanejadosPorMesAno(strFilter);
        response.projeto_orgao_responsavel = await this.buildProjetosOrgaoResponsavel(strFilter);
        response.anos_mapa_calor_concluidos = this.buildAnosMapaCalor(new Date().getFullYear(), -3);
        response.anos_mapa_calor_planejados = this.buildAnosMapaCalor(new Date().getFullYear(), +3);
        response.quantidades_projeto = await this.buildQuantidadesProjeto(strFilter);
        response.resumo_orcamentario = await this.buildResumoOrcamentario(filtro);
        response.execucao_orcamentaria_ano = await this.buildExecucaoOrcamentariaAno(filtro);
        return response;
    }

    private async addPermissaoProjetos(filtro: PainelEstrategicoFilterDto, user: PessoaFromJwt) {
        filtro.projeto_id = filtro.projeto_id ?? [];

        const allowed = (await this.projetoService.findAllIds('PP', user)).map((p) => p.id);
        filtro.projeto_id = filtro.projeto_id.length ? Arr.intersection(filtro.projeto_id, allowed) : allowed;

        if (filtro.projeto_id.length == 0) filtro.projeto_id.push(-1);

        return filtro;
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
            strFilter += ' and coalesce(po.portfolio_id,p.portfolio_id) in (+' + filtro.portfolio_id.toString() + ')';
        }
        return strFilter;
    }

    private async buildGrandeNumeros(filtro: string): Promise<PainelEstrategicoGrandesNumeros> {
        const sql = `  select
                           (SELECT
                                count(distinct p.id)::int
                            FROM projeto p
                                full outer JOIN (SELECT
                                                    ppc.projeto_id,
                                                    po_1.id as portfolio_id
                                                FROM portfolio_projeto_compartilhado ppc
                                                JOIN portfolio po_1 ON po_1.id = ppc.portfolio_id
                                                WHERE ppc.removido_em IS NULL) po ON po.projeto_id = p.id
                            ${filtro} ) as total_projetos,
                           (SELECT
                                count(distinct p.orgao_responsavel_id)::int
                            FROM projeto p
                                full outer JOIN (SELECT
                                                    ppc.projeto_id,
                                                    po_1.id as portfolio_id
                                                FROM portfolio_projeto_compartilhado ppc
                                                JOIN portfolio po_1 ON po_1.id = ppc.portfolio_id
                                                WHERE ppc.removido_em IS NULL) po ON po.projeto_id = p.id
                                ${filtro})  as total_orgaos,
                           (SELECT
                                count(distinct p.meta_id)  ::int
                            FROM projeto p
                                     left join meta m on p.meta_id = m.id
                                     inner join pdm pm on pm.id = m.pdm_id
                                full outer JOIN (SELECT
                                                    ppc.projeto_id,
                                                    po_1.id as portfolio_id
                                                FROM portfolio_projeto_compartilhado ppc
                                                JOIN portfolio po_1 ON po_1.id = ppc.portfolio_id
                                                      WHERE ppc.removido_em IS NULL) po ON po.projeto_id = p.id
                                ${filtro}
                                and pm.tipo = 'PDM' ) as total_metas`;

        return ((await this.prisma.$queryRawUnsafe(sql)) as PainelEstrategicoGrandesNumeros[])[0];
    }

    private async buildProjetosPorStatus(filtro: string) {
        const sql = `select
                           t.status,
                           count(distinct t.id) ::int as quantidade
                       from (SELECT
                                    case
                                        when p.status = 'Fechado' then 'Concluído'
                                        when p.status = 'EmAcompanhamento' then 'Em Acompanhamento'
                                        when p.status = 'EmPlanejamento' then 'Em Planejamento'
                                        else 'Outros' end as status,
                                    p.id
                                FROM projeto p
                                    full outer JOIN (SELECT
								ppc.projeto_id,
								po_1.id as portfolio_id
							FROM portfolio_projeto_compartilhado ppc
						 	JOIN portfolio po_1 ON po_1.id = ppc.portfolio_id
						          WHERE ppc.removido_em IS NULL) po ON po.projeto_id = p.id
                                    LEFT JOIN tarefa_cronograma tc ON tc.projeto_id = p.id AND tc.removido_em IS NULL
                                ${filtro}) as t
                       group by t.status
                       order by CASE
                                    WHEN t.status = 'Outros' THEN 1
                                    ELSE 0
                                    END, quantidade desc`;
        return (await this.prisma.$queryRawUnsafe(sql)) as PainelEstrategicoProjetoStatus[];
    }

    private async buildProjetosPorEtapas(filtro: string) {
        const sql = ` select t.etapa, count(distinct t.id) ::int quantidade
                      from (SELECT case
                                       when p.projeto_etapa_id in (1, 2, 3, 4, 5, 6, 7) then pe.descricao
                                       when p.projeto_etapa_id IS NULL THEN 'Sem Informação'
                                       else 'Outros' end as etapa,
                                   case
                                       when p.projeto_etapa_id in (1, 2, 3, 4, 5, 6, 7) then p.projeto_etapa_id
                                       WHEN p.projeto_etapa_id IS NULL THEN -1
                                       else 0 end as ordem,
                                   p.id
                            FROM projeto p
                                     left join projeto_etapa pe on pe.id = p.projeto_etapa_id
                                full outer JOIN (SELECT
								ppc.projeto_id,
								po_1.id as portfolio_id
							FROM portfolio_projeto_compartilhado ppc
						 	JOIN portfolio po_1 ON po_1.id = ppc.portfolio_id
						          WHERE ppc.removido_em IS NULL) po ON po.projeto_id = p.id
                           ${filtro}) as t
                      group by t.etapa, ordem
                      order by ordem desc`;
        return (await this.prisma.$queryRawUnsafe(sql)) as PainelEstrategicoProjetoEtapa[];
    }

    private async buildProjetosConcluidosPorAno(filtro: string) {
        const sql = `select sum(quantidade)::int quantidade, ano
                     from (select count(distinct p.id )                                as quantidade,
                                  date_part('year', tc.realizado_termino) as ano
                           FROM projeto p
                               full outer JOIN (SELECT
									ppc.projeto_id,
									po_1.id as portfolio_id
								FROM portfolio_projeto_compartilhado ppc
							 	JOIN portfolio po_1 ON po_1.id = ppc.portfolio_id
							          WHERE ppc.removido_em IS NULL) po ON po.projeto_id = p.id
                               INNER JOIN tarefa_cronograma tc ON tc.projeto_id = p.id
                               ${filtro}
                             and tc.realizado_termino is not null
                             and tc.removido_em is null
                             and date_part('year', tc.realizado_termino) <= date_part('YEAR', current_date)
                             and date_part('year', tc.realizado_termino) >= date_part('YEAR', current_date) -3
                           group by date_part('year', tc.realizado_termino)
                           union
                           select 0 as quantidade, t.yr as ano_
                           from generate_series(DATE_PART('YEAR', CURRENT_DATE):: INT -3, DATE_PART('YEAR', CURRENT_DATE):: INT) t(yr)) t
                     group by ano
                     order by ano`;
        return (await this.prisma.$queryRawUnsafe(sql)) as PainelEstrategicoProjetosAno[];
    }

    async buildProjetosConcluidosPorMesAno(filtro: string) {
        const sql = ` select sum(quantidade)::int as quantidade,
                             ano,
                             mes,
                             linha,
                             coluna from (
                        select count(distinct p.id)::int as quantidade,
                                date_part('year', tc.realizado_termino) as ano,
                                date_part('month', tc.realizado_termino)                                  as mes,
                                date_part('YEAR', current_date) - date_part('year', tc.realizado_termino) as linha,
                                date_part('month', tc.realizado_termino) - 1                              as coluna
                         FROM projeto p
                             full outer JOIN (SELECT
                                                ppc.projeto_id,
                                                po_1.id as portfolio_id
                                            FROM portfolio_projeto_compartilhado ppc
                                            JOIN portfolio po_1 ON po_1.id = ppc.portfolio_id
                                                  WHERE ppc.removido_em IS NULL) po ON po.projeto_id = p.id
                             inner join tarefa_cronograma tc on tc.projeto_id = p.id
                             ${filtro}
                           and tc.realizado_termino is not null
                           and tc.removido_em is null
                           and date_part('year', tc.realizado_termino) <= date_part('YEAR', current_date)
                           and date_part('year', tc.realizado_termino) >= date_part('YEAR', current_date) -3
                         group by date_part('month', tc.realizado_termino),
                             date_part('year', tc.realizado_termino)
                         union
                            select
                                   0                                                            as quantidade,
                                   date_part('year', t.data_::date)                             as ano,
                                   date_part('month', t.data_::date)                            as mes,
                                   date_part('year', current_date) - date_part('YEAR', t.data_) as linha,
                                   date_part('month', t.data_) - 1                              as coluna
                            from generate_series(TO_DATE(DATE_PART('YEAR', current_date) - 3 || '01' || '01', 'YYYYMMDD')::timestamp,
                                                 TO_DATE(DATE_PART('YEAR', current_date)  || '12' || '01', 'YYYYMMDD')::timestamp,
                                                 '1 month'::interval) t(data_) ) t group by ano,
                                                                                            mes,
                                                                                            linha,
                                                                                            coluna
                                                                                   order by  ano,mes `;
        return (await this.prisma.$queryRawUnsafe(sql)) as PainelEstrategicoProjetosMesAno[];
    }

    private async buildProjetosPlanejadosPorAno(filtro: string) {
        const sql = `select sum(quantidade)::int as quantidade, ano
                     from (select count(distinct p.id )                               as quantidade,
                                  date_part('year', tc.previsao_termino) as ano
                           FROM projeto p full outer JOIN (SELECT
                                                            ppc.projeto_id,
                                                            po_1.id as portfolio_id
                                                            FROM portfolio_projeto_compartilhado ppc
                                                             JOIN portfolio po_1 ON po_1.id = ppc.portfolio_id
                                                            WHERE ppc.removido_em IS NULL) po ON po.projeto_id = p.id
                                    inner join tarefa_cronograma tc on tc.projeto_id = p.id
                               ${filtro}
                             and tc.realizado_termino is null
                             and tc.previsao_termino is not null
                             and tc.removido_em is null
                             and date_part('year', tc.previsao_termino) >= date_part('YEAR', current_date)
                             and date_part('year', tc.previsao_termino) <= date_part('YEAR', current_date) + 3
                           group by date_part('year', tc.previsao_termino)
                           union
                           select 0 as quantidade, t.yr as ano_
                           from generate_series(DATE_PART('YEAR', CURRENT_DATE)::INT,
                                                DATE_PART('YEAR', CURRENT_DATE)::INT+3) t(yr)) as t
                     group by ano
                     order by ano desc`;
        return (await this.prisma.$queryRawUnsafe(sql)) as PainelEstrategicoProjetosAno[];
    }

    private async buildProjetosPlanejadosPorMesAno(filtro: string) {
        const sql = `select sum(quantidade)::int as quantidade, ano,mes,
                            case
                                when ano < date_part('YEAR', current_date) then -1
                                when ano = date_part('YEAR', current_date) then 3
                                when ano = date_part('YEAR', current_date) + 1 then 2
                                when ano = date_part('YEAR', current_date) + 2 then 1
                                when ano = date_part('YEAR', current_date) + 3 then 0
                                end as linha,coluna from (
                        select * from (select date_part('year', tc.previsao_termino)      as ano,
                            date_part('month', tc.previsao_termino)     as mes,
                            count(distinct p.id)::int  as quantidade,
                            date_part('month', tc.previsao_termino) - 1 as coluna
                     FROM projeto p full outer JOIN (SELECT
                                                            ppc.projeto_id,
                                                            po_1.id as portfolio_id
                                                            FROM portfolio_projeto_compartilhado ppc
                                                             JOIN portfolio po_1 ON po_1.id = ppc.portfolio_id
                                                            WHERE ppc.removido_em IS NULL) po ON po.projeto_id = p.id
                              inner join tarefa_cronograma tc on tc.projeto_id = p.id
                      ${filtro}
                       and tc.realizado_termino is null
                       and tc.previsao_termino is not null
                       and tc.removido_em is null
                       and date_part('year', tc.previsao_termino) >= date_part('YEAR', current_date) - 3
                       and date_part('year', tc.previsao_termino) <= date_part('YEAR', current_date) + 3
                     group by date_part('year', tc.previsao_termino),
                              date_part('month', tc.previsao_termino)
                     union
                        select
                            date_part('year', t.data_::date)                             as ano,
                            date_part('month', t.data_::date)                            as mes,
                            0                                                            as quantidade,
                            date_part('month', t.data_) - 1                              as coluna
                        from generate_series(TO_DATE(DATE_PART('YEAR', current_date) - 3 || '01' || '01', 'YYYYMMDD')::timestamp,
                                             TO_DATE(DATE_PART('YEAR', current_date) + 3 || '12' || '01', 'YYYYMMDD')::timestamp,
                                             '1 month'::interval) t(data_) ) t) t
                     group by ano, mes, coluna
                     order by ano,mes`;
        return (await this.prisma.$queryRawUnsafe(sql)) as PainelEstrategicoProjetosMesAno[];
    }

    private async buildProjetosOrgaoResponsavel(filtro: string) {
        return this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<PainelEstrategicoOrgaoResponsavel[]> => {
                await prismaTx.$executeRawUnsafe(`drop table if exists tmp_dash_org_resp`);
                await prismaTx.$executeRawUnsafe(`create temporary table tmp_dash_org_resp as
                select *
                from (select count(distinct p.id)::int as quantidade, org.sigla as orgao_sigla,
                             org.descricao as orgao_descricao
                      FROM projeto p full outer JOIN (SELECT
                                                            ppc.projeto_id,
                                                            po_1.id as portfolio_id
                                                        FROM portfolio_projeto_compartilhado ppc
                                                        JOIN portfolio po_1 ON po_1.id = ppc.portfolio_id
                                                        WHERE ppc.removido_em IS NULL) po ON po.projeto_id = p.id
                          LEFT JOIN tarefa_cronograma tc ON tc.projeto_id = p.id AND tc.removido_em IS NULL
                               inner join orgao org on p.orgao_responsavel_id = org.id
                          ${filtro}
                      group by org.sigla, org.descricao) as t
                order by quantidade desc`);

                const sql = `select quantidade, orgao_descricao, orgao_sigla
                             from (select *
                                   from (select quantidade ::int, orgao_sigla,
                                                orgao_descricao,
                                                1 as indice
                                         from tmp_dash_org_resp
                                         limit 10) t
                                   union
                                   select sum(quantidade)::int as quantidade, 'OUTROS' as orgao_sigla,
                                          'Outros' as orgao_descricao,
                                          0        as indice
                                   from tmp_dash_org_resp
                                   where orgao_sigla not in (select orgao_sigla from tmp_dash_org_resp limit 10)) t
                             order by indice desc, quantidade desc;`;
                return (await prismaTx.$queryRawUnsafe(sql)) as PainelEstrategicoOrgaoResponsavel[];
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

    private async buildQuantidadesProjeto(filtro: string) {
        const sql = `select (select count(distinct p.id)::int as quantidade
                             FROM projeto p full outer JOIN (SELECT
                                                            ppc.projeto_id,
                                                            po_1.id as portfolio_id
                                                            FROM portfolio_projeto_compartilhado ppc
                                                             JOIN portfolio po_1 ON po_1.id = ppc.portfolio_id
                                                                      WHERE ppc.removido_em IS NULL) po ON po.projeto_id = p.id
                            inner join tarefa_cronograma tc on tc.projeto_id = p.id
                             ${filtro}
                               and tc.realizado_termino is null
                               and tc.previsao_termino is not null
                               and tc.removido_em is null
                               and date_part('year', tc.previsao_termino) =
                                   date_part('YEAR', current_date)) as quantidade_planejada,
                            (select count(distinct p.id)::int as quantidade
                             from  projeto p full outer JOIN (SELECT
                                                            ppc.projeto_id,
                                                            po_1.id as portfolio_id
                                                            FROM portfolio_projeto_compartilhado ppc
                                                             JOIN portfolio po_1 ON po_1.id = ppc.portfolio_id
                                                                      WHERE ppc.removido_em IS NULL) po ON po.projeto_id = p.id
                                      inner join tarefa_cronograma tc on tc.projeto_id = p.id
                             ${filtro}
                               and tc.realizado_termino is not null
                               and tc.removido_em is null
                               and date_part('year', tc.realizado_termino) =
                                   date_part('year', CURRENT_DATE)) as quantidade_concluida,
                            date_part('year',current_date)::int as ano`;
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

        const sql = `
            WITH projeto_base AS (
                SELECT pr.id,
                       pr.orgao_responsavel_id
                FROM projeto pr
                WHERE pr.removido_em IS NULL
                  AND pr.arquivado = FALSE
                  AND pr.tipo = 'PP'
                  ${strPortfolio}
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
            LEFT JOIN tarefa_custos tc ON tc.ano_referencia = years.yr
                AND (tc.projeto_id IN (${projectIds}) OR ${hasProjetos} = -1)
            LEFT JOIN projeto_base p ON (p.id IN (${projectIds}) OR ${hasProjetos} = -1)
            LEFT JOIN orcamento_realizado orcr ON orcr.ano_referencia = years.yr
                AND (orcr.projeto_id IN (${projectIds}) OR ${hasProjetos} = -1 )
                AND orcr.removido_em IS NULL

            GROUP BY years.yr
            ORDER BY years.yr`;
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
                               from
                                   (select
                                        pr.id,
                                        pr.orgao_responsavel_id
                                    from projeto pr
                                    where   pr.removido_em is null
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
                                      ${portifolio_filter2}) p
                                       inner join (select vp.nome,
                                                          vp.id                          as projeto_id,
                                                          sum(orcr.soma_valor_empenho)   as soma_valor_empenho,
                                                          sum(orcr.soma_valor_liquidado) as soma_valor_liquidado
                                                   from orcamento_realizado orcr
                                                            left join view_projetos vp on orcr.projeto_id = vp.id
                                                            inner join projeto p on p.id = vp.id
                                                   where p.tipo = 'PP'
                                                     and p.removido_em is null
                                                   group by vp.nome, vp.id) orc on orc.projeto_id = p.id
                                                   ${whereFilter}`)) as any;
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
                            select (select sum(t.custo_estimado)
                             from tarefa_cronograma tc
                                      inner join tarefa t on t.tarefa_cronograma_id = tc.id
                             where not exists(select tarefa_pai_id from tarefa where tarefa_pai_id = t.id and removido_em is null)
                               and tc.projeto_id = p.id
                               and tc.removido_em is null)::float as valor_custo_planejado_total,
                         (select sum(t.custo_estimado)
                            from tarefa_cronograma tc
                             inner join tarefa t on t.tarefa_cronograma_id = tc.id
                            where not exists(select tarefa_pai_id from tarefa where tarefa_pai_id = t.id and removido_em is null)
                            and tc.projeto_id = p.id
                            and tc.removido_em is null
                            and t.termino_planejado <= current_date)::float as valor_custo_planejado_hoje,
                         orc.soma_valor_empenho ::float as valor_empenhado_total,
                         orc.soma_valor_liquidado::float as valor_liquidado_total,
                         p.nome as nome_projeto,
                         p.codigo as codigo_projeto
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
                              inner join (select vp.nome,
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
        const linhas = (await this.prisma.$queryRawUnsafe(sql)) as PainelEstrategicoExecucaoOrcamentariaLista[];
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
}
