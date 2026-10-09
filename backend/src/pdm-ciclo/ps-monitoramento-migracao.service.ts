import { HttpException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { CHUNK_SIZE, CONST_BOT_USER_ID } from '../common/consts';
import { TipoPdmType } from '../common/decorators/current-tipo-pdm';
import { PdmPermissionLevel } from '../pdm/dto/create-pdm.dto';
import { PdmService } from '../pdm/pdm.service';
import { PrismaService } from '../prisma/prisma.service';
import { MigrarMonitoramentoPorBlocosDto } from './dto/ps-ciclo-fase.dto';
import { MonitoramentoMigracaoContagemDto, MonitoramentoMigracaoPreviaDto } from './entities/ps-ciclo-fase.entity';
import {
    ConteudoLegado,
    FaseCfgMigracao,
    MapeamentoLegado,
    marcaUltimasRevisoes,
    pendenciasMapeamento,
    sugereMapeamento,
    textoParaHtml,
    validaMapeamento,
} from './ps-monitoramento-migracao.mapeamento';

type Legado = Awaited<ReturnType<PsMonitoramentoMigracaoService['carregaLegado']>>;

type RevisaoLegada = {
    id: number;
    meta_id: number;
    ciclo_fisico_id: number;
    referencia_data: Date;
    criado_por: number;
    criado_em: Date;
    removido_por: number | null;
    removido_em: Date | null;
};

const temTexto = (s: string | null | undefined): s is string => !!s && s.trim() !== '';

function* emLotes<T>(lista: T[]): Generator<T[]> {
    for (let i = 0; i < lista.length; i += CHUNK_SIZE) yield lista.slice(i, i + CHUNK_SIZE);
}

@Injectable()
export class PsMonitoramentoMigracaoService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly pdmService: PdmService
    ) {}

    async previa(tipo: TipoPdmType, pdmId: number, user: PessoaFromJwt): Promise<MonitoramentoMigracaoPreviaDto> {
        await this.pdmService.assertUserPermission(tipo, pdmId, user, PdmPermissionLevel.CONFIG_WRITE);

        const pdm = await this.prisma.pdm.findFirstOrThrow({
            where: { id: pdmId },
            select: { monitoramento_por_blocos: true },
        });
        const fases = await this.carregaFases(this.prisma, pdmId);
        const { mapeamento, avisos } = sugereMapeamento(fases);
        const legado = await this.carregaLegado(this.prisma, pdmId);

        return {
            ja_migrado: pdm.monitoramento_por_blocos,
            mapeamento,
            contagem: this.contagem(legado),
            pendencias: pdm.monitoramento_por_blocos
                ? []
                : [...validaMapeamento(fases, mapeamento), ...pendenciasMapeamento(mapeamento, this.conteudo(legado))],
            avisos,
        };
    }

    async migra(
        tipo: TipoPdmType,
        pdmId: number,
        dto: MigrarMonitoramentoPorBlocosDto,
        user: PessoaFromJwt
    ): Promise<MonitoramentoMigracaoContagemDto> {
        await this.pdmService.assertUserPermission(tipo, pdmId, user, PdmPermissionLevel.CONFIG_WRITE);

        return await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient) => {
                // bloqueia escritas de monitoramento (FOR SHARE) e edição de config do plano até o commit
                const rows = await prismaTx.$queryRaw<{ sistema: string; monitoramento_por_blocos: boolean }[]>`
                    SELECT sistema::text, monitoramento_por_blocos FROM pdm
                    WHERE id = ${pdmId}::int AND removido_em IS NULL FOR NO KEY UPDATE`;
                if (!rows.length) throw new HttpException('Plano não encontrado', 400);
                if (rows[0].sistema === 'PDM') throw new HttpException('Operação não permitida para PDMs antigos', 400);
                if (rows[0].monitoramento_por_blocos)
                    throw new HttpException('Este plano já usa o monitoramento por fases configuradas', 400);

                const fases = await this.carregaFases(prismaTx, pdmId);
                if (!fases.some((f) => f.habilitada && !f.removido_em))
                    throw new HttpException('O plano precisa de ao menos uma fase de monitoramento habilitada', 400);

                const mapeamento: MapeamentoLegado = { ...sugereMapeamento(fases).mapeamento };
                const informado = dto.mapeamento ?? {};
                for (const chave of Object.keys(mapeamento) as (keyof MapeamentoLegado)[]) {
                    const valor = informado[chave];
                    if (valor !== undefined) mapeamento[chave] = valor;
                }

                const legado = await this.carregaLegado(prismaTx, pdmId);
                const erros = [
                    ...validaMapeamento(fases, mapeamento),
                    ...pendenciasMapeamento(mapeamento, this.conteudo(legado)),
                ];
                if (erros.length) throw new HttpException(erros.join('; '), 400);

                await this.copiaLegado(prismaTx, legado, mapeamento);
                await prismaTx.pdm.update({ where: { id: pdmId }, data: { monitoramento_por_blocos: true } });

                return this.contagem(legado);
            },
            { maxWait: 10000, timeout: 300000 }
        );
    }

    private async carregaFases(prisma: Prisma.TransactionClient, pdmId: number): Promise<FaseCfgMigracao[]> {
        return await prisma.pdmMonitoramentoFaseConfig.findMany({
            where: { pdm_id: pdmId },
            select: {
                id: true,
                ordem: true,
                rotulo: true,
                habilitada: true,
                criado_em: true,
                criado_por: true,
                removido_em: true,
                blocos: {
                    select: {
                        id: true,
                        ordem: true,
                        rotulo: true,
                        criado_em: true,
                        atualizado_por: true,
                        removido_em: true,
                    },
                },
            },
        });
    }

    private async carregaLegado(prisma: Prisma.TransactionClient, pdmId: number) {
        const where = { meta: { pdm_id: pdmId }, ciclo_fisico: { pdm_id: pdmId } };
        const orderBy = [{ criado_em: 'asc' as const }, { id: 'asc' as const }];

        const analises = await prisma.metaCicloFisicoAnalise.findMany({ where, orderBy });
        const riscos = await prisma.metaCicloFisicoRisco.findMany({ where, orderBy });
        const fechamentos = await prisma.metaCicloFisicoFechamento.findMany({ where, orderBy });
        const documentos = await prisma.metaCicloFisicoAnaliseDocumento.findMany({ where, orderBy });

        return { analises, riscos, fechamentos, documentos };
    }

    private conteudo(legado: Legado): ConteudoLegado {
        return {
            analises: legado.analises.length,
            analises_com_texto: legado.analises.filter((a) => temTexto(a.informacoes_complementares)).length,
            documentos: legado.documentos.length,
            riscos: legado.riscos.length,
            riscos_com_detalhamento: legado.riscos.filter((r) => temTexto(r.detalhamento)).length,
            riscos_com_ponto_de_atencao: legado.riscos.filter((r) => temTexto(r.ponto_de_atencao)).length,
            fechamentos: legado.fechamentos.length,
        };
    }

    private contagem(legado: Legado): MonitoramentoMigracaoContagemDto {
        const linhas = [...legado.analises, ...legado.riscos, ...legado.fechamentos, ...legado.documentos];
        return {
            metas: new Set(linhas.map((l) => l.meta_id)).size,
            ciclos: new Set(linhas.map((l) => l.ciclo_fisico_id)).size,
            analises: legado.analises.length,
            riscos: legado.riscos.length,
            fechamentos: legado.fechamentos.length,
            fechamentos_automaticos: legado.fechamentos.filter((f) => f.criado_por === CONST_BOT_USER_ID).length,
            documentos: legado.documentos.length,
        };
    }

    private async copiaLegado(prismaTx: Prisma.TransactionClient, legado: Legado, m: MapeamentoLegado) {
        const revisoes: Prisma.MetaMonitoramentoFaseCreateManyInput[] = [];
        const blocosPorRevisao = new Map<string, { bloco_config_id: number; conteudo: string }[]>();
        const adiciona = (
            legado_tipo: 'analise' | 'risco' | 'fechamento',
            revisao: Omit<Prisma.MetaMonitoramentoFaseCreateManyInput, 'legado_tipo'> & { legado_id: number },
            blocos: { bloco_config_id: number | null; conteudo: string | null }[]
        ) => {
            revisoes.push({ ...revisao, legado_tipo });
            blocosPorRevisao.set(
                `${legado_tipo}:${revisao.legado_id}`,
                blocos
                    .filter((b): b is { bloco_config_id: number; conteudo: string } => b.bloco_config_id !== null)
                    .filter((b) => temTexto(b.conteudo))
            );
        };
        const base = (r: RevisaoLegada, ultimas: Set<number>, fase_config_id: number) => ({
            meta_id: r.meta_id,
            ciclo_fisico_id: r.ciclo_fisico_id,
            fase_config_id,
            referencia_data: r.referencia_data,
            ultima_revisao: ultimas.has(r.id),
            legado_id: r.id,
            criado_por: r.criado_por,
            criado_em: r.criado_em,
            removido_por: r.removido_por,
            removido_em: r.removido_em,
        });

        const ultimasAnalises = marcaUltimasRevisoes(legado.analises);
        for (const a of legado.analises)
            adiciona('analise', base(a, ultimasAnalises, m.qualificacao_fase_id!), [
                { bloco_config_id: m.informacoes_complementares_bloco_id, conteudo: a.informacoes_complementares },
            ]);

        const ultimosRiscos = marcaUltimasRevisoes(legado.riscos);
        for (const r of legado.riscos)
            adiciona('risco', base(r, ultimosRiscos, m.risco_fase_id!), [
                { bloco_config_id: m.detalhamento_bloco_id, conteudo: r.detalhamento },
                { bloco_config_id: m.ponto_de_atencao_bloco_id, conteudo: r.ponto_de_atencao },
            ]);

        const ultimosFechamentos = marcaUltimasRevisoes(legado.fechamentos);
        for (const f of legado.fechamentos) {
            const vaiParaBloco =
                temTexto(f.comentario) && f.criado_por !== CONST_BOT_USER_ID && m.comentario_bloco_id !== null;
            adiciona(
                'fechamento',
                {
                    ...base(f, ultimosFechamentos, m.fechamento_fase_id!),
                    fecha_ciclo: true,
                    reaberto_em: f.reaberto_em,
                    reaberto_por: f.reaberto_por,
                    comentario_sistema: !vaiParaBloco && temTexto(f.comentario) ? f.comentario : null,
                },
                vaiParaBloco ? [{ bloco_config_id: m.comentario_bloco_id, conteudo: textoParaHtml(f.comentario!) }] : []
            );
        }

        const novosIds = new Map<string, number>();
        for (const lote of emLotes(revisoes)) {
            const criadas = await prismaTx.metaMonitoramentoFase.createManyAndReturn({
                data: lote,
                select: { id: true, legado_tipo: true, legado_id: true },
            });
            for (const c of criadas) novosIds.set(`${c.legado_tipo}:${c.legado_id}`, c.id);
        }

        const blocos = [...blocosPorRevisao].flatMap(([chave, lista]) =>
            lista.map((b) => ({ revisao_id: novosIds.get(chave)!, ...b }))
        );
        for (const lote of emLotes(blocos)) await prismaTx.metaMonitoramentoFaseBloco.createMany({ data: lote });

        const documentos = legado.documentos.map((d) => ({
            meta_id: d.meta_id,
            ciclo_fisico_id: d.ciclo_fisico_id,
            fase_config_id: m.qualificacao_fase_id!,
            arquivo_id: d.arquivo_id,
            descricao: d.descricao,
            referencia_data: d.referencia_data,
            legado_id: d.id,
            criado_por: d.criado_por,
            criado_em: d.criado_em,
            atualizado_em: d.criado_em,
            removido_por: d.removido_por,
            removido_em: d.removido_em,
        }));
        for (const lote of emLotes(documentos))
            await prismaTx.metaMonitoramentoFaseDocumento.createMany({ data: lote });
    }
}
