import { HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
    PainelEstrategicoFilterDto,
    PainelEstrategicoListaFilterDto,
} from './dto/painel-estrategico-filter.dto';
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
import { AnyPageTokenJwtBody, PaginatedWithPagesDto } from '../../common/dto/paginated.dto';
import { Object2Hash } from '../../common/object2hash';
import { JwtService } from '@nestjs/jwt';
import { ReferenciasValidasBase } from '../../geo-loc/entities/geo-loc.entity';
import { GeoLocService } from '../../geo-loc/geo-loc.service';

@Injectable()
export class PainelEstrategicoService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly projetoService: ProjetoService,
        private readonly jwtService: JwtService,
        private readonly geolocService: GeoLocService,
    ) {
    }

    async buildPainel(filtro: PainelEstrategicoFilterDto, user: PessoaFromJwt): Promise<PainelEstrategicoResponseDto> {
        const strFilter = await this.applyFilter(filtro, user);
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
        response.resumo_orcamentario = await this.buildResumoOrcamentario(strFilter);
        response.execucao_orcamentaria_ano = await this.buildExecucaoOrcamentariaAno(strFilter);
        return response;
    }

    private async applyFilter(filtro: PainelEstrategicoFilterDto, user: PessoaFromJwt): Promise<string> {
        let strFilter = '';
        if (!filtro.projeto_id) {
            filtro.projeto_id = [];
        }
        await this.projetoService.findAllIds('PP', user).then(ids => {
            ids.forEach(n => filtro.projeto_id.push(n.id));
        });
        strFilter = ' and p.arquivado = false and p.removido_em is null ';
        if (filtro.projeto_id.length > 0) {
            strFilter += ' and p.id in (' + filtro.projeto_id.toString() + ')';
        }
        if (filtro.orgao_responsavel_id && filtro.orgao_responsavel_id.length>0) {
            strFilter += ' and p.orgao_responsavel_id in (+' + filtro.orgao_responsavel_id.toString() + ')';
        }
        if (filtro.portfolio_id && filtro.portfolio_id.length>0) {
            strFilter += ' and p.portfolio_id in (+' + filtro.portfolio_id.toString() + ')';
        }
        return strFilter;
    }

    private async buildGrandeNumeros(filtro: string): Promise<PainelEstrategicoGrandesNumeros> {
        const sql = `select (select count(*) ::int
                             from view_projetos vp
                                      inner join projeto p on p.id = vp.id
                             where p.tipo = 'PP' ${filtro}) as total_projetos,
                            (select count(*) ::int
                             from (select distinct vp.orgao_responsavel_id
                                   from view_projetos vp
                                            inner join projeto p on p.id = vp.id
                                   where p.tipo = 'PP'
                                       ${filtro}) as t)     as total_orgaos,
                            (select count(*) ::int
                             from (select distinct po.meta_id
                                   from view_projetos vp
                                            inner join projeto p on p.id = vp.id
                                            inner join projeto_origem po on po.projeto_id = p.id
                                   where p.tipo = 'PP'
                                       ${filtro}) as t)     as total_metas`;

        return (await this.prisma.$queryRawUnsafe(sql) as PainelEstrategicoGrandesNumeros[])[0];
    }

    private async buildProjetosPorStatus(filtro: string) {
        const sql = `select t.status, count(t.id) ::int as quantidade
                     from (SELECT case
                                      when p.status = 'Fechado' then 'Concluído'
                                      when p.status = 'EmAcompanhamento' then 'Em Acompanhamento'
                                      when p.status = 'EmPlanejamento' then 'Em Planejamento'
                                      else 'Outros' end as status,
                                  p.id
                           FROM projeto p
                           where p.tipo = 'PP'
                               ${filtro}) as t
                     group by t.status
                     order by CASE
                                  WHEN t.status = 'Outros' THEN 1
                                  ELSE 0
                                  END, quantidade desc`;
        return await this.prisma.$queryRawUnsafe(sql) as PainelEstrategicoProjetoStatus[];
    }

    private async buildProjetosPorEtapas(filtro: string) {
        const sql = `select t.etapa, count(t.id) ::int quantidade
                     from (SELECT case
                                      when p.projeto_etapa_id in (1, 2, 3, 4, 5, 6, 7) then pe.descricao
                                      else 'Outros' end as etapa,
                                  case
                                      when p.projeto_etapa_id in (1, 2, 3, 4, 5, 6, 7) then p.projeto_etapa_id
                                      else 0 end as ordem,
                                  p.id
                           FROM projeto p
                                    inner join projeto_etapa pe on pe.id = p.projeto_etapa_id
                           where p.tipo = 'PP'
                           ${filtro} ) as t
                     group by t.etapa, ordem
                     order by ordem desc`;
        return await this.prisma.$queryRawUnsafe(sql) as PainelEstrategicoProjetoEtapa[];
    }

    private async buildProjetosConcluidosPorAno(filtro: string) {
        const sql = `select sum(quantidade)::int quantidade, ano
                     from (select count(*)                                as quantidade,
                                  date_part('year', tc.realizado_termino) as ano
                           from view_projetos vp
                                    inner join projeto p on vp.id = p.id
                                    inner join tarefa_cronograma tc on tc.projeto_id = p.id
                           where p.tipo = 'PP'
                             and tc.realizado_termino is not null
                             and tc.removido_em is null
                             and date_part('year', tc.realizado_termino) >= date_part('year', CURRENT_DATE) - 4
                             and date_part('year', tc.realizado_termino) <= date_part('year', CURRENT_DATE)
                               ${filtro}
                           group by date_part('year', tc.realizado_termino)
                           union
                           select 0 as quantidade, t.yr as ano_
                           from generate_series(DATE_PART('YEAR', CURRENT_DATE):: INT -4, DATE_PART('YEAR', CURRENT_DATE):: INT) t(yr)) t
                     group by ano`;
        return await this.prisma.$queryRawUnsafe(sql) as PainelEstrategicoProjetosAno[];
    }

    async buildProjetosConcluidosPorMesAno(filtro: string) {
        const sql = `select count(*)::int as quantidade, date_part('year', tc.realizado_termino) as ano,
                            date_part('month', tc.realizado_termino)                                  as mes,
                            date_part('YEAR', current_date) - date_part('year', tc.realizado_termino) as linha,
                            date_part('month', tc.realizado_termino) - 1                              as coluna
                     from view_projetos vp
                              inner join projeto p on vp.id = p.id
                              inner join tarefa_cronograma tc on tc.projeto_id = p.id
                     where tc.realizado_termino is not null
                       and tc.removido_em is null
                       and date_part('year', tc.realizado_termino) <= date_part('YEAR', current_date)
                       and date_part('year', tc.realizado_termino) >= (date_part('YEAR', current_date) - 3)
                         ${filtro}
                     group by date_part('month', tc.realizado_termino),
                         date_part('year', tc.realizado_termino)`;
        return await this.prisma.$queryRawUnsafe(sql) as PainelEstrategicoProjetosMesAno[];
    }

    private async buildProjetosPlanejadosPorAno(filtro: string) {
        const sql = `select sum(quantidade)::int as quantidade, ano
                     from (select count(*)                               as quantidade,
                                  date_part('year', tc.previsao_termino) as ano
                           from view_projetos vp
                                    inner join projeto p on vp.id = p.id
                                    inner join tarefa_cronograma tc on tc.projeto_id = p.id
                           where tc.realizado_termino is null
                             and tc.previsao_termino is not null
                             and tc.removido_em is null
                             and p.tipo = 'PP'
                               ${filtro}
                             and date_part('year', tc.previsao_termino) >= date_part('YEAR', current_date)
                             and date_part('year', tc.previsao_termino) <= date_part('YEAR', current_date) + 3
                           group by date_part('year', tc.previsao_termino)
                           union
                           select 0 as quantidade, t.yr as ano_
                           from generate_series(DATE_PART('YEAR', CURRENT_DATE)::INT+3,
                                                DATE_PART('YEAR', CURRENT_DATE)::INT) t(yr)) as t
                     group by ano
                     order by ano desc`;
        return await this.prisma.$queryRawUnsafe(sql) as PainelEstrategicoProjetosAno[];
    }

    private async buildProjetosPlanejadosPorMesAno(filtro: string) {
        const sql = `select date_part('year', tc.previsao_termino)      as ano,
                            date_part('month', tc.previsao_termino)     as mes,
                            count(*)::int                                                                 as quantidade,
                             date_part('year', tc.previsao_termino) - date_part('YEAR', current_date) as linha,
                            date_part('month', tc.previsao_termino) - 1 as coluna
                     from view_projetos vp
                              inner join projeto p on vp.id = p.id
                              inner join tarefa_cronograma tc on tc.projeto_id = p.id
                     where tc.realizado_termino is null
                       and tc.previsao_termino is not null
                       and tc.removido_em is null
                       and p.tipo = 'PP'
                         ${filtro}
                       and date_part('year', tc.previsao_termino) >= date_part('YEAR', current_date) - 3
                       and date_part('year', tc.previsao_termino) <= date_part('YEAR', current_date) + 3
                     group by date_part('year', tc.previsao_termino),
                              date_part('month', tc.previsao_termino)`;
        return await this.prisma.$queryRawUnsafe(sql) as PainelEstrategicoProjetosMesAno[];
    }

    private async buildProjetosOrgaoResponsavel(filtro: string) {
        return this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<PainelEstrategicoOrgaoResponsavel[]> => {
                await prismaTx.$executeRawUnsafe(`drop table if exists tmp_dash_org_resp`);
                await prismaTx.$executeRawUnsafe(`create temporary table tmp_dash_org_resp as
                select *
                from (select count(*)::int as quantidade, org.sigla as orgao_sigla,
                             org.descricao as orgao_descricao
                      from view_projetos vp
                               inner join projeto p on vp.id = p.id
                               inner join orgao org on vp.orgao_responsavel_id = org.id
                      where p.removido_em is null
                        and p.tipo = 'PP'
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
                return await prismaTx.$queryRawUnsafe(sql) as PainelEstrategicoOrgaoResponsavel[];
            });
    }

    buildAnosMapaCalor(anoBase: number, quantidadeAnos: number): number[] {
        const resultado = [];
        resultado.push(anoBase);
        if (quantidadeAnos > 0) {
            for (let i = 0; i < quantidadeAnos; i++) {
                anoBase = anoBase + 1;
                resultado.push(anoBase);
            }
        } else {
            for (let i = 0; i > quantidadeAnos; i--) {
                anoBase = anoBase - 1;
                resultado.push(anoBase);
            }
        }
        return resultado;
    }


    private async buildQuantidadesProjeto(filtro: string) {
        const sql = `select (select count(*)::int as quantidade
                             from view_projetos vp
                                      inner join projeto p on vp.id = p.id
                                      inner join tarefa_cronograma tc on tc.projeto_id = p.id
                             where tc.realizado_termino is null
                               and tc.previsao_termino is not null
                               and tc.removido_em is null
                               and p.tipo = 'PP'
                                 ${filtro}
                               and date_part('year', tc.previsao_termino) =
                                   date_part('YEAR', current_date))                                                                    as quantidade_planejada,
                            (select count(*)::int as quantidade
                             from view_projetos vp
                                      inner join projeto p on vp.id = p.id
                                      inner join tarefa_cronograma tc on tc.projeto_id = p.id
                             where p.tipo = 'PP'
                               and tc.realizado_termino is not null
                               and tc.removido_em is null ${filtro}
                               and date_part('year', tc.realizado_termino) =
                                   date_part('year', CURRENT_DATE)) as quantidade_concluida,
                            date_part('year',current_date)::int as ano`;
        return (await this.prisma.$queryRawUnsafe(sql) as PainelEstrategicoQuantidadesAnoCorrente[])[0];
    }

    async listaProjetosPaginado(filtro: PainelEstrategicoListaFilterDto, user: PessoaFromJwt):
        Promise<PaginatedWithPagesDto<PainelEstrategicoProjeto>> {
        let retToken = filtro.token_paginacao;
        const filterToken = filtro.token_paginacao;
        let ipp = filtro.ipp ?? 50;
        const page = filtro.pagina ?? 1;
        let total_registros = 0;
        let tem_mais = false;

        if (page > 1 && !filtro.token_paginacao) throw new HttpException('Campo obrigatório para paginação', 400);

        // para não atrapalhar no hash, remove o campo pagina
        delete filtro.pagina;
        delete filtro.token_paginacao;
        let now = new Date(Date.now());
        const whereFilter = await this.applyFilter(filtro, user);
        if (filterToken) {
            const decoded = this.decodeNextPageToken(filterToken, filtro);
            total_registros = decoded.total_rows;
            ipp = decoded.ipp;
            now = new Date(decoded.issued_at);
        }
        const offset = (page - 1) * ipp;
        const sql = `select vp.nome,
                            org.sigla                                  as secretaria_sigla,
                            org.descricao                              as secretaria_descricao,
                            org.id                                     as secretaria_id,
                            m.codigo                                   as meta_codigo,
                            m.titulo                                   as meta_titulo,
                            m.id                                       as meta_id,
                            vp.status,
                            pe.descricao                               as etapa,
                            TO_CHAR(vp.projecao_termino, 'yyyy/mm/dd') as termino_projetado,
                            vp.percentual_atraso,
                            (select count(*)
                             from projeto_risco pr
                             where pr.projeto_id = p.id
                               and pr.status_risco <> 'Fechado') ::int as riscos_abertos
                     from view_projetos vp
                              inner join projeto p on vp.id = p.id
                              inner join projeto_etapa pe on pe.id = p.projeto_etapa_id
                              inner join orgao org on org.id = vp.orgao_responsavel_id
                              inner join meta m on m.id = vp.meta_id
                     where p.tipo = 'PP'
                         ${whereFilter}
                     order by etapa
                     limit ${ipp} offset ${offset}`;
        const linhas = await this.prisma.$queryRawUnsafe(sql) as any[];

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
        };

    }

    private async encodeNextPageTokenListaProjetos(
        whereFilter: string,
        issued_at: Date,
        filter: PainelEstrategicoListaFilterDto,
        ipp?: number,
    ): Promise<{
        jwt: string;
        body: AnyPageTokenJwtBody;
    }> {
        const quantidade_rows = await this.prisma.$queryRawUnsafe(`select count(*) ::int
                                                                   from view_projetos vp
                                                                            inner join projeto p on vp.id = p.id
                                                                            inner join projeto_etapa pe on pe.id = p.projeto_etapa_id
                                                                            inner join orgao org on org.id = vp.orgao_responsavel_id
                                                                            inner join meta m on m.id = vp.meta_id
                                                                   where p.tipo = 'PP'
                                                                       ${whereFilter}
                                                                     and p.removido_em is null`) as any;

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

    private decodeNextPageToken(jwt: string | undefined, filters: PainelEstrategicoListaFilterDto): AnyPageTokenJwtBody {
        let tmp: AnyPageTokenJwtBody | null = null;

        try {
            if (jwt) tmp = this.jwtService.verify(jwt) as AnyPageTokenJwtBody;
        } catch {
            throw new HttpException('token_paginacao invalido', 400);
        }
        if (!tmp) throw new HttpException('token_paginacao invalido ou faltando', 400);
        console.log(Object2Hash(filters));
        console.log(tmp);
        if (tmp.search_hash != Object2Hash(filters))
            throw new HttpException(
                'Parâmetros da busca não podem ser diferente da busca inicial para avançar na paginação.',
                400,
            );
        return tmp;
    }
    private async buildResumoOrcamentario(filter: string) {
        const sql = `select  sum((select tc.previsao_custo
                                  from tarefa_cronograma tc
                                  where tc.removido_em is null
                                    and tc.projeto_id = p.id))::float as custo_planejado_total,
                             sum((select sum(orcr.soma_valor_empenho)
                                  from orcamento_realizado orcr
                                  where orcr.removido_em is null
                                    and orcr.projeto_id = p.id))::float as valor_empenhado_total,
                             sum((select sum(orcr.soma_valor_liquidado)
                                  from orcamento_realizado orcr
                                  where orcr.removido_em is null
                                    and orcr.projeto_id = p.id))::float as valor_liquidado_total,
                             date_part('year',current_date)::int as ano
                     from projeto p
                     where p.tipo = 'PP'
                         ${filter} `
        return (await await this.prisma.$queryRawUnsafe(sql) as PainelEstrategicoResumoOrcamentario[])[0];
    }

    /*
        Mock!! Aguardando definição das regras de negócio!
     */
    private async buildExecucaoOrcamentariaAno(filter: string) {
        const sql = `select sum(custo_planejado_total) as custo_planejado_total,
                            sum(valor_empenhado_total) as valor_empenhado_total,
                            sum(valor_liquidado_total) as valor_liquidado_total,
                            ano_referencia
                            from (select
                                    sum(coalesce(tc.previsao_custo, 0))::float as custo_planejado_total,
                                    sum(orcr.soma_valor_empenho)::float as valor_empenhado_total ,
                                    sum(orcr.soma_valor_liquidado)::float as valor_liquidado_total,
                                    orcr.ano_referencia
                                from orcamento_realizado orcr
                                inner join view_projetos vp on orcr.projeto_id = vp.id
                                inner join projeto p on p.id = vp.id
                                full outer join (select
                                                    tc.previsao_custo,
                                                    date_part('year',tc.previsao_termino) as ano_referencia ,
                                                    tc.projeto_id
                                                from tarefa_cronograma tc) as tc on tc.projeto_id = p.id
                                                    and tc.ano_referencia = orcr.ano_referencia
                           where p.tipo = 'PP'
                             and p.removido_em is null
                             and orcr.ano_referencia between date_part('year', current_date)-3
                             and date_part('year', current_date)+3
                            ${filter}
                           group by orcr.ano_referencia
                           union
                           select
                               0 as custo_planejado_total,
                               0 as valor_empenhado_total,
                               0 as valor_liquidado_total,
                               t.yr as ano_referencia
                           from generate_series(DATE_PART('YEAR', CURRENT_DATE):: INT -3, DATE_PART('YEAR', CURRENT_DATE):: INT +3) t(yr)) as t
                     group by ano_referencia`
        return await await this.prisma.$queryRawUnsafe(sql) as PainelEstrategicoExecucaoOrcamentariaAno[];

    }

    private async encodeNextPageTokenListaExecucaoOrcamentaria(
        whereFilter: string,
        issued_at: Date,
        filter: PainelEstrategicoListaFilterDto,
        ipp?: number,
    ): Promise<{
        jwt: string;
        body: AnyPageTokenJwtBody;
    }> {
        const quantidade_rows = await this.prisma.$queryRawUnsafe(`select
                                                                        count(*)::int as count
                                                                   from
                                                                       projeto p
                                                                   where p.tipo = 'PP'
                                                                   ${whereFilter}`) as any;
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
        let ipp = filtro.ipp ?? 50;
        const page = filtro.pagina ?? 1;
        let total_registros = 3;
        let tem_mais = false;

        if (page > 1 && !filtro.token_paginacao) throw new HttpException('Campo obrigatório para paginação', 400);

        // para não atrapalhar no hash, remove o campo pagina
        delete filtro.pagina;
        delete filtro.token_paginacao;
        let now = new Date(Date.now());
        const whereFilter = await this.applyFilter(filtro, user);
        if (filterToken) {
            const decoded = this.decodeNextPageToken(filterToken, filtro);
            total_registros = decoded.total_rows;
            ipp = decoded.ipp;
            now = new Date(decoded.issued_at);
        }
        const offset = (page - 1) * ipp;
        const sql = `select
                        (select sum(t.custo_estimado)
                         from tarefa_cronograma tc
                                  inner join tarefa t on t.tarefa_cronograma_id = tc.id
                         where not exists(select tarefa_pai_id from tarefa where tarefa_pai_id = t.id)
                           and tc.projeto_id = p.id)::float                as valor_custo_planejado_total,
                        (select sum(t.custo_estimado)
                         from tarefa_cronograma tc
                                  inner join tarefa t on t.tarefa_cronograma_id = tc.id
                         where not exists(select tarefa_pai_id from tarefa where tarefa_pai_id = t.id)
                           and tc.projeto_id = p.id
                           and t.termino_planejado <= current_date)::float as valor_custo_planejado_hoje,
                        orc.soma_valor_empenho ::float as valor_empenhado_total,
                        orc.soma_valor_liquidado::float as valor_liquidado_total,
                        p.nome as nome_projeto
                         from projeto p
                                  inner join (select vp.nome,
                                                     vp.id                          as projeto_id,
                                                     sum(orcr.soma_valor_empenho)   as soma_valor_empenho,  -- verificar se esse valor é o valor atualizado
                                                     sum(orcr.soma_valor_liquidado) as soma_valor_liquidado -- verificar se esse valor é o valor atualizado
                                              from orcamento_realizado orcr
                                                       left join view_projetos vp on orcr.projeto_id = vp.id
                                                       inner join projeto p on p.id = vp.id
                                              where p.tipo = 'PP'
                                                and p.removido_em is null
                                                ${whereFilter}
                                              group by vp.nome, vp.id) orc on orc.projeto_id = p.id
                         where p.tipo = 'PP'
                         limit ${ipp} offset ${offset}`
        const linhas = await this.prisma.$queryRawUnsafe(sql) as PainelEstrategicoExecucaoOrcamentariaLista[];
        // executar depois da query
        if (filterToken) {
            retToken = filterToken;
        } else {
            const info = await this.encodeNextPageTokenListaExecucaoOrcamentaria(whereFilter, now, filtro, filtro.ipp);
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
            paginas:paginas,
            linhas: linhas,
        } satisfies PaginatedWithPagesDto<PainelEstrategicoExecucaoOrcamentariaLista>;

    }
    async buildGeoLocalizacao(filtro: PainelEstrategicoFilterDto, user: PessoaFromJwt):Promise<PainelEstrategicoGeoLocalizacaoDto>{
        const whereFilter = await this.applyFilter(filtro, user);
        const sql = `select
                        vp.nome as nome_projeto,
                        vp.id as projeto_id
                    from view_projetos vp inner join projeto p on vp.id = p.id
                    where p.tipo = 'PP'
                    ${whereFilter}`
        const linhas = await this.prisma.$queryRawUnsafe(sql) as any[];

        const geoDto = new ReferenciasValidasBase();
        geoDto.projeto_id = linhas.map((r) => r.projeto_id);
        const geolocalizacao = await this.geolocService.carregaReferencias(geoDto);

        const retorno: PainelEstrategicoGeoLocalizacaoDto = new PainelEstrategicoGeoLocalizacaoDto();
        retorno.linhas = [];
        linhas.forEach((linha) => {
            retorno.linhas.push({
                        projeto_nome:linha.nome_projeto,
                        projeto_id:linha.projeto_id,
                        geolocalizacao:geolocalizacao.get(linha.projeto_id)||[]
                    });
        });
        return retorno;
    }
}
