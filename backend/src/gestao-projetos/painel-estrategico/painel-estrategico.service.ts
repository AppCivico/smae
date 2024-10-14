import { HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
    PainelEstrategicoFilterDto,
    PainelEstrategicoListaFilterDto,
} from './dto/painel-estrategico-filter.dto';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import {
    PainelEstrategicoExecucaoOrcamentariaAno, PainelEstrategicoExecucaoOrcamentariaLista,
    PainelEstrategicoGrandesNumeros,
    PainelEstrategicoOrgaoResponsavel,
    PainelEstrategicoProjeto,
    PainelEstrategicoProjetoEtapa,
    PainelEstrategicoProjetosAno,
    PainelEstrategicoProjetosMesAno,
    PainelEstrategicoProjetoStatus,
    PainelEstrategicoQuantidadesAnoCorrente,
    PainelEstrategicoResponseDto, PainelEstrategicoResumoOrcamentario,
} from './entities/painel-estrategico-responses.dto';
import { Prisma } from '@prisma/client';
import { ProjetoService } from '../../pp/projeto/projeto.service';
import { AnyPageTokenJwtBody, PaginatedWithPagesDto } from '../../common/dto/paginated.dto';
import { Object2Hash } from '../../common/object2hash';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class PainelEstrategicoService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly projetoService: ProjetoService,
        private readonly jwtService: JwtService,
    ) {
    }

    /*Está recebendo o usuário pois futuramente será necessário realizar filtros de acordo
      com alguns atributos do usuário
     */
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
        if (filtro.projeto_id.length > 0) {
            strFilter = ' and p.id in (' + filtro.projeto_id.toString() + ')';
        }
        if (filtro.orgao_responsavel_id) {
            strFilter += ' and p.orgao_responsavel_id in (+' + filtro.orgao_responsavel_id.toString() + ')';
        }
        if (filtro.portfolio_id) {
            strFilter += ' and p.portifolio_id in (+' + filtro.portfolio_id.toString() + ')';
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
                                      when p.arquivado = true then 'Arquivado'
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
                                  p.id
                           FROM projeto p
                                    inner join projeto_etapa pe on pe.id = p.projeto_etapa_id
                           where p.tipo = 'PP'
                               ${filtro}) as t
                     group by t.etapa
                     order by CASE
                                  WHEN t.etapa = 'Outros' THEN 1
                                  ELSE 0
                                  END, quantidade desc`;
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
        const sql = `select count(*)::int                                                                 as quantidade, date_part('year', tc.realizado_termino) as ano,
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
        const sql = `select (select count(*) as quantidade
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
                            (select count(*) as quantidade
                             from view_projetos vp
                                      inner join projeto p on vp.id = p.id
                                      inner join tarefa_cronograma tc on tc.projeto_id = p.id
                             where p.tipo = 'PP'
                               and tc.realizado_termino is not null
                               and tc.removido_em is null ${filtro}
                               and date_part('year', tc.realizado_termino) =
                                   date_part('year', CURRENT_DATE)) as quantidade_concluida`;
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
        if (filterToken) {
            const decoded = this.decodeNextPageToken(filtro.token_paginacao, filtro);
            total_registros = decoded.total_rows;
            ipp = decoded.ipp;
            now = new Date(decoded.issued_at);
        }
        const offset = (page - 1) * ipp;
        const whereFilter = await this.applyFilter(filtro, user);
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
                       and p.removido_em is null
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

        if (tmp.search_hash != Object2Hash(filters))
            throw new HttpException(
                'Parâmetros da busca não podem ser diferente da busca inicial para avançar na paginação.',
                400,
            );
        return tmp;
    }

    /*
        Mock!! Aguardando definição das regras de negócio!
     */
    private async buildResumoOrcamentario(filter: string) {
        return {
            custo_planejado_total: 1000000,
            valor_empenhado_total: 2000000,
            valor_liquidado_total: 3000000,
        } satisfies PainelEstrategicoResumoOrcamentario;
    }

    /*
        Mock!! Aguardando definição das regras de negócio!
     */
    private async buildExecucaoOrcamentariaAno(filter: string) {
        return [
            {
                ano: 2021,
                valor_empenhado_total: 80000000,
                valor_liquidado_total: 65000000,
                valor_planejado_total: 75000000,
            } as PainelEstrategicoExecucaoOrcamentariaAno,
            {
                ano: 2022,
                valor_empenhado_total: 70000000,
                valor_liquidado_total: 55000000,
                valor_planejado_total: 65000000,
            } as PainelEstrategicoExecucaoOrcamentariaAno,
            {
                ano: 2023,
                valor_empenhado_total: 90000000,
                valor_liquidado_total: 75000000,
                valor_planejado_total: 85000000,
            } as PainelEstrategicoExecucaoOrcamentariaAno,
            {
                ano: 2024,
                valor_empenhado_total: 50000000,
                valor_liquidado_total: 35000000,
                valor_planejado_total: 45000000,
            } as PainelEstrategicoExecucaoOrcamentariaAno,
            {
                ano: 2025,
                valor_empenhado_total: 40000000,
                valor_liquidado_total: 25000000,
                valor_planejado_total: 35000000,
            } as PainelEstrategicoExecucaoOrcamentariaAno,
            {
                ano: 2026,
                valor_empenhado_total: 30000000,
                valor_liquidado_total: 15000000,
                valor_planejado_total: 25000000,
            } as PainelEstrategicoExecucaoOrcamentariaAno,
            {
                ano: 2027,
                valor_empenhado_total: 20000000,
                valor_liquidado_total: 500000,
                valor_planejado_total: 15000000,
            } as PainelEstrategicoExecucaoOrcamentariaAno,
        ];
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
        const quantidade_rows = await this.prisma.$queryRawUnsafe(`select 3 ::int as count`) as any;

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

    /*
        Mock!! Aguardando definição das regras de negócio!
    */
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
        if (filterToken) {
            const decoded = this.decodeNextPageToken(filtro.token_paginacao, filtro);
            total_registros = decoded.total_rows;
            ipp = decoded.ipp;
            now = new Date(decoded.issued_at);
        }
        //const offset = (page - 1) * ipp;
        const whereFilter = await this.applyFilter(filtro, user);


        // executar depois da query
        if (filterToken) {
            retToken = filterToken;
        } else {
            const info = await this.encodeNextPageTokenListaExecucaoOrcamentaria(whereFilter, now, filtro, filtro.ipp);
            retToken = info.jwt;
            total_registros = info.body.total_rows;
        }
        //tem_mais = offset + linhas.length < total_registros;
        //const paginas = total_registros > ipp ? Math.ceil(total_registros / ipp) : 1;
        return {
            tem_mais: tem_mais,
            pagina_corrente: 1,
            total_registros: total_registros,
            token_paginacao: retToken,
            paginas:1,
            linhas: [{
                nome_projeto: 'Projeto 1  - Teste',
                valor_empenhado_total: 1000000,
                valor_liquidado_total: 500000,
                valor_custo_planejado_hoje: 2000000,
                valor_custo_planejado_total: 3000000,
            } as PainelEstrategicoExecucaoOrcamentariaLista,
                {
                    nome_projeto: 'Projeto 2  - Teste',
                    valor_empenhado_total: 2000000,
                    valor_liquidado_total: 600000,
                    valor_custo_planejado_hoje: 3000000,
                    valor_custo_planejado_total: 4000000,
                } as PainelEstrategicoExecucaoOrcamentariaLista,
                {
                    nome_projeto: 'Projeto 3  - Teste',
                    valor_empenhado_total: 3000000,
                    valor_liquidado_total: 700000,
                    valor_custo_planejado_hoje: 4000000,
                    valor_custo_planejado_total: 5000000,
                } as PainelEstrategicoExecucaoOrcamentariaLista,
            ],

        } satisfies PaginatedWithPagesDto<PainelEstrategicoExecucaoOrcamentariaLista>;

    }
}
