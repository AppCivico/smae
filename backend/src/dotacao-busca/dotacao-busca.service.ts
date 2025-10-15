import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Prisma, TipoProjeto } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
    DotacaoBuscaDto,
    DotacaoBuscaResponseDto,
    PdmPsResumoDto,
    ProjetoObraResumoDto,
} from './dto/dotacao-busca.dto';
import { DotacaoService } from '../dotacao/dotacao.service';

const MAX_RESULTS_DEFAULT = 200;

@Injectable()
export class DotacaoBuscaService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly dotacaoService: DotacaoService,
    ) {}

    async searchByDotacao(dto: DotacaoBuscaDto): Promise<DotacaoBuscaResponseDto> {
        const { query, limit = MAX_RESULTS_DEFAULT, somenteAtivos = true } = dto;
        if (!query || !query.trim()) {
            throw new BadRequestException('Envie a dotação ou parte dela em "query".');
        }

        // normaliza a parte da dotação e monta padrão para ILIKE
        const parteNormalizada = this.dotacaoService.expandirParteDotacao(query.trim());
        const sqlLike = `%${parteNormalizada.replace(/\*/g, '%')}%`;

        const [plan, real, proc, nota] = await Promise.all([
            this.prisma.$queryRaw<{ dotacao: string }[]>`
                SELECT DISTINCT dotacao FROM dotacao_planejado WHERE dotacao ILIKE ${sqlLike} LIMIT ${limit}
            `,
            this.prisma.$queryRaw<{ dotacao: string }[]>`
                SELECT DISTINCT dotacao FROM dotacao_realizado WHERE dotacao ILIKE ${sqlLike} LIMIT ${limit}
            `,
            this.prisma.$queryRaw<{ dotacao: string }[]>`
                SELECT DISTINCT dotacao FROM dotacao_processo WHERE dotacao ILIKE ${sqlLike} LIMIT ${limit}
            `,
            this.prisma.$queryRaw<{ dotacao: string }[]>`
                SELECT DISTINCT dotacao FROM dotacao_processo_nota WHERE dotacao ILIKE ${sqlLike} LIMIT ${limit}
            `,
        ]);

        const dotacoesSet = new Set<string>();
        [...plan, ...real, ...proc, ...nota].forEach((r) => r?.dotacao && dotacoesSet.add(r.dotacao));
        const dotacoes = Array.from(dotacoesSet);

        if (dotacoes.length === 0) {
            return { projetos: [], obras: [], pdm_ps: [] };
        }

        const [pdmPlan, pdmReal, portPlan, portReal] = await Promise.all([
            this.prisma.pdmDotacaoPlanejado.findMany({
                where: { dotacao: { in: dotacoes } },
                select: { pdm_id: true, dotacao: true },
                take: limit,
            }),
            this.prisma.pdmDotacaoRealizado.findMany({
                where: { dotacao: { in: dotacoes } },
                select: { pdm_id: true, dotacao: true },
                take: limit,
            }),
            this.prisma.portfolioDotacaoPlanejado.findMany({
                where: { dotacao: { in: dotacoes } },
                select: { portfolio_id: true, dotacao: true },
                take: limit,
            }),
            this.prisma.portfolioDotacaoRealizado.findMany({
                where: { dotacao: { in: dotacoes } },
                select: { portfolio_id: true, dotacao: true },
                take: limit,
            }),
        ]);

        const pdmIds = new Set<number>();
        const portfolioIds = new Set<number>();
        const pdmIdToDots = new Map<number, Set<string>>();
        const portfolioIdToDots = new Map<number, Set<string>>();

        for (const r of [...pdmPlan, ...pdmReal]) {
            if (r.pdm_id) {
                pdmIds.add(r.pdm_id);
                if (!pdmIdToDots.has(r.pdm_id)) pdmIdToDots.set(r.pdm_id, new Set());
                pdmIdToDots.get(r.pdm_id)!.add(r.dotacao);
            }
        }
        for (const r of [...portPlan, ...portReal]) {
            if (r.portfolio_id) {
                portfolioIds.add(r.portfolio_id);
                if (!portfolioIdToDots.has(r.portfolio_id)) portfolioIdToDots.set(r.portfolio_id, new Set());
                portfolioIdToDots.get(r.portfolio_id)!.add(r.dotacao);
            }
        }

        // 4) Buscar PROJETOS/OBRAS a partir dos Portfólios relacionados
        const projetos: ProjetoObraResumoDto[] = [];
        const obras: ProjetoObraResumoDto[] = [];

        if (portfolioIds.size > 0) {
            const projetosFromView = await this.prisma.viewProjetoV2.findMany({
                where: {
                    portfolio_id: { in: Array.from(portfolioIds) },
                    ...(somenteAtivos ? { projeto: { removido_em: null } } : {}),
                },
                select: {
                    id: true,
                    nome: true,
                    codigo: true,
                    portfolio_id: true,
                    portfolio_titulo: true,
                    grupo_tematico_nome: true,
                    tipo_intervencao_nome: true,
                    equipamento_nome: true,
                    regioes: true,
                    orgao_responsavel_sigla: true,
                    projeto: { select: { tipo: true, status: true } },
                },
                take: limit,
            });

            for (const p of projetosFromView) {
                const dots = portfolioIdToDots.get(p.portfolio_id ?? -1);
                const item: ProjetoObraResumoDto = {
                    id: p.id,
                    nome: p.nome,
                    codigo: p.codigo,
                    portfolio_id: p.portfolio_id,
                    portfolio_titulo: p.portfolio_titulo,
                    orgao_responsavel_sigla: p.orgao_responsavel_sigla,
                    status: p.projeto.status,
                    subprefeitura_nomes: p.regioes,
                    grupo_tematico_nome: p.grupo_tematico_nome,
                    tipo_obra_nome: p.tipo_intervencao_nome,
                    equipamento_nome: p.equipamento_nome,
                    dotacoes_encontradas: Array.from(dots ?? dotacoesSet),
                };
                if (p.projeto.tipo === TipoProjeto.MDO) obras.push(item);
                else projetos.push(item);
            }
        }

        // 5) Buscar PdM/PS (metas) a partir dos PDMs relacionados
        const pdm_ps: PdmPsResumoDto[] = [];
        if (pdmIds.size > 0) {
            const metas = await this.prisma.meta.findMany({
                where: {
                    pdm_id: { in: Array.from(pdmIds) },
                    ...(somenteAtivos ? { ativo: true, removido_em: null } : {}),
                },
                select: {
                    id: true,
                    codigo: true,
                    titulo: true,
                    pdm_id: true,
                    meta_orgao: { select: { orgao: { select: { sigla: true } } } },
                    pdm: { select: { rotulo_iniciativa: true, rotulo_atividade: true } },
                },
                take: limit,
            });

            for (const m of metas) {
                const dots = pdmIdToDots.get(m.pdm_id ?? -1);
                pdm_ps.push({
                    pdm_id: m.pdm_id,
                    meta_id: m.id,
                    meta_codigo: m.codigo,
                    meta_titulo: m.titulo,
                    orgaos_sigla: m.meta_orgao.map((x) => x.orgao.sigla),
                    rotulo_iniciativa: m.pdm?.rotulo_iniciativa ?? null,
                    rotulo_atividade: m.pdm?.rotulo_atividade ?? null,
                    iniciativa: null, // opcional: preencher se houver relação direta dotação->iniciativa
                    atividade: null, // opcional: preencher se houver relação direta dotação->atividade
                    dotacoes_encontradas: Array.from(dots ?? dotacoesSet),
                });
            }
        }

        return { projetos, obras, pdm_ps };
    }
}
