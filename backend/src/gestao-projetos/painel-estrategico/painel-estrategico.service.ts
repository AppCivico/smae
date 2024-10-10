import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PainelEstrategicoFilterDto } from './dto/painel-estrategico-filter.dto';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import {
    PainelEstrategicoGrandesNumeros,
    PainelEstrategicoProjetoEtapa,
    PainelEstrategicoProjetosAno,
    PainelEstrategicoProjetosMesAno,
    PainelEstrategicoProjetoStatus,
    PainelEstrategicoResponseDto,
    PainelEstrategicoOrgaoResponsavel,
} from './entities/painel-estrategico-responses.dto';
import { Prisma } from '@prisma/client';
import { RecordWithId } from '../../common/dto/record-with-id.dto';

@Injectable()
export class PainelEstrategicoService {
    constructor(
        private readonly prisma: PrismaService,
    ) {}
    /*Está recebendo o usuário pois futuramente será necessário realizar filtros de acordo
      com alguns atributos do usuário
     */
    async buildPainel(filtro:PainelEstrategicoFilterDto, user: PessoaFromJwt):Promise<PainelEstrategicoResponseDto>{
        const strFilter = this.applyFilter(filtro,user);
        const response= new PainelEstrategicoResponseDto();
        response.grandes_numeros = await this.buildGrandeNumeros(strFilter,user);
        response.projeto_status = await this.buildProjetosPorStatus(strFilter,user);
        response.projeto_etapas = await this.buildProjetosPorEtapas(strFilter,user);
        response.projetos_concluidos_ano = await this.buildProjetosConcluidosPorAno(strFilter,user);
        response.projetos_concluidos_mes = await this.buildProjetosConcluidosPorMesAno(strFilter,user);
        response.projetos_planejados_ano = await this.buildProjetosPlanejadosPorAno(strFilter,user);
        response.projetos_planejados_mes = await this.buildProjetosPlanejadosPorMesAno(strFilter,user);
        response.projeto_orgao_responsavel = await this.buildProjetosOrgaoResponsavel(strFilter,user);
        response.anos_mapa_calor_concluidos = this.buildAnosMapaCalor(new Date().getFullYear(),-3);
        response.anos_mapa_calor_planejados = this.buildAnosMapaCalor(new Date().getFullYear(),+3);
        return response;
    }

    applyFilter(filtro:PainelEstrategicoFilterDto, user:PessoaFromJwt):string{
        let strFilter = "";
        if (filtro.projeto_id){
            strFilter = " and p.id in ("+ filtro.projeto_id.toString()+")";
        }
        if (filtro.orgao_responsavel_id){
            strFilter += " and p.orgao_responsavel_id in (+"+ filtro.orgao_responsavel_id.toString()+")";
        }
        if (filtro.portifolio_id){
            strFilter += " and p.portifolio_id in (+"+ filtro.portifolio_id.toString()+")";
        }
        return strFilter;
    }

    async buildGrandeNumeros(filtro:string, user: PessoaFromJwt):Promise<PainelEstrategicoGrandesNumeros>{
        const sql = `select
                   (select count(*)::int from view_projetos vp inner join projeto p on p.id = vp.id
                    where p.tipo = 'PP' ${filtro}) as total_projetos,
                   (select count(*)::int from (select
                                            distinct vp.orgao_responsavel_id
                                          from view_projetos vp inner join projeto p on p.id = vp.id
                                          where
                                                p.tipo = 'PP'
                                                    ${filtro}) as t) as total_orgaos,
                   (select count(*)::int from (select
                                            distinct po.meta_id
                                          from view_projetos vp inner join projeto p on p.id = vp.id
                                                inner join projeto_origem po on po.projeto_id = p.id
                                          where p.tipo = 'PP'
                                              ${filtro}) as t) as total_metas`

        return  await this.prisma.$queryRawUnsafe(sql) as PainelEstrategicoGrandesNumeros;
    }

    async buildProjetosPorStatus(filtro:string, user:PessoaFromJwt){
        const sql = `select t.status, count(t.id)::int as quantidade
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
                                  END, quantidade desc`
        return await this.prisma.$queryRawUnsafe(sql) as PainelEstrategicoProjetoStatus[];
    }

    async buildProjetosPorEtapas(filtro:string, user:PessoaFromJwt){
        const sql = `select t.etapa, count(t.id)::int quantidade
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
                                  END, quantidade desc`
        return await this.prisma.$queryRawUnsafe(sql) as PainelEstrategicoProjetoEtapa[];
    }

    async buildProjetosConcluidosPorAno(filtro:string, user:PessoaFromJwt){
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
                           from generate_series(DATE_PART('YEAR', CURRENT_DATE)::INT-4,
                                                DATE_PART('YEAR', CURRENT_DATE)::INT) t(yr)) t
                     group by ano`
        return await this.prisma.$queryRawUnsafe(sql) as PainelEstrategicoProjetosAno[];
    }

    async buildProjetosConcluidosPorMesAno(filtro:string, user:PessoaFromJwt){
        const sql = `select count(*)::int                                                                 as quantidade,
                            date_part('year', tc.realizado_termino)                                   as ano,
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
                              date_part('year', tc.realizado_termino)`
        return await this.prisma.$queryRawUnsafe(sql) as PainelEstrategicoProjetosMesAno[];
    }

    async buildProjetosPlanejadosPorAno(filtro:string, user:PessoaFromJwt){
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
                     order by ano desc`
        return await this.prisma.$queryRawUnsafe(sql) as PainelEstrategicoProjetosAno[];
    }

    async buildProjetosPlanejadosPorMesAno(filtro:string, user:PessoaFromJwt){
        const sql = `select date_part('year', tc.previsao_termino)                                   as ano,
                            date_part('month', tc.previsao_termino)                                  as mes,
                            count(*)::int                                                                 as quantidade,
                            date_part('year', tc.previsao_termino) - date_part('YEAR', current_date) as linha,
                            date_part('month', tc.previsao_termino) - 1                              as coluna
                     from view_projetos vp
                              inner join projeto p on vp.id = p.id
                              inner join tarefa_cronograma tc on tc.projeto_id = p.id
                     where tc.realizado_termino is null
                       and tc.previsao_termino is not null
                       and tc.removido_em is null
                       and p.tipo = 'PP'
                         ${filtro}
                       and date_part('year', tc.previsao_termino) >= date_part('YEAR', current_date) -3
                       and date_part('year', tc.previsao_termino) <= date_part('YEAR', current_date) + 3
                     group by date_part('year', tc.previsao_termino),
                              date_part('month', tc.previsao_termino)`
        return await this.prisma.$queryRawUnsafe(sql) as PainelEstrategicoProjetosMesAno[];
    }

    async buildProjetosOrgaoResponsavel(filtro:string, user:PessoaFromJwt){
        return this.prisma.$transaction(
            async (prismaTx : Prisma.TransactionClient): Promise<PainelEstrategicoOrgaoResponsavel[]> => {
            await prismaTx.$executeRawUnsafe(`drop table if exists tmp_dash_org_resp`);
            await prismaTx.$executeRawUnsafe(`create temporary table tmp_dash_org_resp as
                        select * from (
                        select
                            count(*)::int as quantidade,
                            org.sigla as orgao_sigla,
                            org.descricao as orgao_descricao
                        from
                            view_projetos vp inner join projeto p on vp.id = p.id
                            inner join orgao org on vp.orgao_responsavel_id = org.id
                        where
                            p.removido_em is null
                        and p.tipo = 'PP'
                        ${filtro}
                        group by org.sigla, org.descricao  ) as t
                        order by quantidade desc`);

            const sql = `select quantidade,orgao_descricao, orgao_sigla from (
                            select * from (
                                select
                                    quantidade ::int,
                                    orgao_sigla,
                                    orgao_descricao,
                                    1 as indice
                                from
                                    tmp_dash_org_resp
                                limit 10) t
                        union
                            select
                                sum(quantidade)::int as quantidade,
                                'OUTROS' as orgao_sigla,
                                'Outros' as orgao_descricao,
                                0 as indice
                        from
                                tmp_dash_org_resp
                        where
                                orgao_sigla not in (select orgao_sigla from tmp_dash_org_resp limit 10)) t
                        order by indice desc,quantidade desc;`
            return  await prismaTx.$queryRawUnsafe(sql) as PainelEstrategicoOrgaoResponsavel[];
        });
    }

    buildAnosMapaCalor(anoBase:number,quantidadeAnos:number):number[]{
        const resultado = [];
        resultado.push(anoBase);
        if (quantidadeAnos>0){
            for(let i=0;i<quantidadeAnos;i++){
                anoBase = anoBase+1;
                resultado.push(anoBase);
            }
        }else{
            for(let i=0;i>quantidadeAnos;i--){
                anoBase = anoBase-1;
                resultado.push(anoBase);
            }
        }
        return resultado;
    }



}
