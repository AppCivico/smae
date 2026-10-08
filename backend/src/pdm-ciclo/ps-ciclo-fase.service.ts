import { HttpException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { CONST_BOT_USER_ID } from '../common/consts';
import { Date2YMD } from '../common/date2ymd';
import { TipoPdmType } from '../common/decorators/current-tipo-pdm';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { HtmlSanitizer } from '../common/html-sanitizer';
import { Html2Text } from '../common/Html2Text';
import { MetaService } from '../meta/meta.service';
import { PdmPermissionLevel } from '../pdm/dto/create-pdm.dto';
import { PdmService } from '../pdm/pdm.service';
import { PrismaService } from '../prisma/prisma.service';
import { BuildArquivoBaseDto, PrismaArquivoComPreviewSelect } from '../upload/arquivo-preview.helper';
import { UploadService } from '../upload/upload.service';
import {
    CreatePsCicloFaseDocumentoDto,
    SalvarPsCicloFaseDto,
    UpdatePsCicloFaseDocumentoDto,
} from './dto/ps-ciclo-fase.dto';
import { FilterPsCiclo } from './dto/update-pdm-ciclo.dto';
import { CicloFisicoPSDto, ListPSCicloDto } from './entities/pdm-ciclo.entity';
import { PsCicloFaseCicloDto, PsCicloFaseRevisaoDto, PsCicloFasesDto } from './entities/ps-ciclo-fase.entity';
import { calculaEstadoCiclo, EstadoCiclo } from './ps-ciclo-fase.estado';

export const MSG_PLANO_LEGADO = 'Este plano ainda usa o monitoramento legado';
export const MSG_PLANO_POR_FASES = 'Este plano usa o monitoramento por fases configuradas';

const TX_OPTS = { isolationLevel: 'Serializable', maxWait: 5000, timeout: 15000 } as const;

const SelectFaseConfig = {
    id: true,
    ordem: true,
    rotulo: true,
    habilitada: true,
    aceita_tags: true,
    aceita_anexos: true,
    blocos: {
        where: { removido_em: null },
        orderBy: { ordem: 'asc' as const },
        select: { id: true, ordem: true, rotulo: true, habilitado: true },
    },
} satisfies Prisma.PdmMonitoramentoFaseConfigSelect;

type FaseConfig = Prisma.PdmMonitoramentoFaseConfigGetPayload<{ select: typeof SelectFaseConfig }>;

const SelectRevisao = {
    id: true,
    fase_config_id: true,
    ultima_revisao: true,
    fecha_ciclo: true,
    comentario_sistema: true,
    referencia_data: true,
    criado_em: true,
    criado_por: true,
    reaberto_em: true,
    criador: { select: { id: true, nome_exibicao: true } },
    reabridor: { select: { id: true, nome_exibicao: true } },
    fase_config: { select: { rotulo: true } },
    blocos: {
        select: { bloco_config_id: true, conteudo: true, bloco_config: { select: { rotulo: true, ordem: true } } },
    },
    tags: { select: { tag: { select: { id: true, descricao: true, ods_id: true, removido_em: true } } } },
} satisfies Prisma.MetaMonitoramentoFaseSelect;

type RevisaoCompleta = Prisma.MetaMonitoramentoFaseGetPayload<{ select: typeof SelectRevisao }>;

type CicloResumo = { id: number; data_ciclo: Date; ativo: boolean };

@Injectable()
export class PsCicloFaseService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly metaService: MetaService,
        private readonly pdmService: PdmService,
        private readonly uploadService: UploadService
    ) {}

    async modoPorBlocos(pdmId: number): Promise<boolean> {
        const pdm = await this.prisma.pdm.findFirst({
            where: { id: pdmId, removido_em: null },
            select: { monitoramento_por_blocos: true },
        });
        if (!pdm) throw new HttpException('Plano não encontrado', 400);
        return pdm.monitoramento_por_blocos;
    }

    async assertModoLegado(pdmId: number): Promise<void> {
        if (await this.modoPorBlocos(pdmId)) throw new HttpException(MSG_PLANO_POR_FASES, 400);
    }

    // FOR SHARE: a migração e a edição da config (FOR NO KEY UPDATE) esperam esta escrita terminar
    async travaPlano(prismaTx: Prisma.TransactionClient, pdmId: number, porBlocos: boolean): Promise<void> {
        const rows = await prismaTx.$queryRaw<{ monitoramento_por_blocos: boolean }[]>`
            SELECT monitoramento_por_blocos FROM pdm WHERE id = ${pdmId}::int AND removido_em IS NULL FOR SHARE`;
        if (!rows.length) throw new HttpException('Plano não encontrado', 400);
        if (rows[0].monitoramento_por_blocos !== porBlocos)
            throw new HttpException(porBlocos ? MSG_PLANO_LEGADO : MSG_PLANO_POR_FASES, 400);
    }

    async listaCiclos(
        tipo: TipoPdmType,
        pdmId: number,
        params: FilterPsCiclo,
        user?: PessoaFromJwt
    ): Promise<ListPSCicloDto> {
        if (params.meta_id && user) await this.assertMetaDoPlano(tipo, pdmId, params.meta_id, user, 'readonly');

        const ciclos = await this.prisma.cicloFisico.findMany({
            where: {
                pdm_id: pdmId,
                data_ciclo: { gt: params.apenas_futuro ? new Date(Date.now()) : undefined },
            },
            select: { id: true, data_ciclo: true, ativo: true },
            orderBy: [{ data_ciclo: 'desc' }],
        });

        const metaId = params.meta_id;
        const fases = metaId ? await this.carregaFases(this.prisma, pdmId) : [];
        const ultimas = metaId
            ? await this.carregaUltimas(
                  this.prisma,
                  metaId,
                  ciclos.map((c) => c.id)
              )
            : [];

        const linhas = ciclos.map((ciclo) => {
            const estado = metaId
                ? calculaEstadoCiclo(
                      ciclo.ativo,
                      fases,
                      ultimas.filter((r) => r.ciclo_fisico_id === ciclo.id)
                  )
                : null;
            return {
                id: ciclo.id,
                data_ciclo: Date2YMD.toString(ciclo.data_ciclo),
                ativo: ciclo.ativo,
                fechado: estado?.fechado ?? false,
                reaberto: estado?.reaberto ?? false,
                documentos_editaveis: [],
                fases_preenchidas: estado?.preenchidas ?? [],
                fases_editaveis: estado?.editaveis ?? [],
            } satisfies CicloFisicoPSDto;
        });

        return {
            linhas,
            ultima_revisao: null,
            documentos_editaveis: [],
            monitoramento_por_blocos: true,
        };
    }

    async buscaFases(
        tipo: TipoPdmType,
        pdmId: number,
        cicloId: number,
        metaId: number,
        user: PessoaFromJwt
    ): Promise<PsCicloFasesDto> {
        const meta = await this.assertMetaDoPlano(tipo, pdmId, metaId, user, 'readonly');
        if (!(await this.modoPorBlocos(pdmId))) throw new HttpException(MSG_PLANO_LEGADO, 400);

        const ciclo = await this.carregaCiclo(this.prisma, pdmId, cicloId);
        const cicloAnterior = await this.prisma.cicloFisico.findFirst({
            where: { pdm_id: pdmId, data_ciclo: { lt: ciclo.data_ciclo } },
            orderBy: { data_ciclo: 'desc' },
            select: { id: true, data_ciclo: true, ativo: true },
        });

        const fases = await this.carregaFases(this.prisma, pdmId);
        const revisoes = await this.prisma.metaMonitoramentoFase.findMany({
            where: { meta_id: metaId, ciclo_fisico_id: cicloId, removido_em: null },
            orderBy: [{ criado_em: 'desc' }, { id: 'desc' }],
            select: SelectRevisao,
        });
        const revisoesAnteriores = cicloAnterior
            ? await this.prisma.metaMonitoramentoFase.findMany({
                  where: { meta_id: metaId, ciclo_fisico_id: cicloAnterior.id, ultima_revisao: true, removido_em: null },
                  select: SelectRevisao,
              })
            : [];
        const documentos = await this.prisma.metaMonitoramentoFaseDocumento.findMany({
            where: { meta_id: metaId, ciclo_fisico_id: cicloId, removido_em: null },
            orderBy: [{ criado_em: 'desc' }, { id: 'desc' }],
            select: {
                id: true,
                fase_config_id: true,
                descricao: true,
                criado_em: true,
                criador: { select: { id: true, nome_exibicao: true } },
                arquivo: { select: PrismaArquivoComPreviewSelect },
            },
        });

        const estado = calculaEstadoCiclo(
            ciclo.ativo,
            fases,
            revisoes.filter((r) => r.ultima_revisao)
        );
        const pode_editar = meta.pode_editar && (await this.temEscritaNoPlano(tipo, pdmId, user));

        const habilitadas = fases.filter((f) => f.habilitada);
        const blocosVisiveis = new Set(habilitadas.flatMap((f) => f.blocos.filter((b) => b.habilitado).map((b) => b.id)));
        const fasesDeTags = new Set(habilitadas.filter((f) => f.aceita_tags).map((f) => f.id));
        const revisaoDto = (r: RevisaoCompleta) => this.revisaoDto(r, blocosVisiveis, fasesDeTags);

        return {
            ciclo: this.cicloDto(ciclo),
            ciclo_anterior: cicloAnterior ? this.cicloDto(cicloAnterior) : null,
            fechado: estado.fechado,
            reaberto: estado.reaberto,
            pode_editar,
            pode_reabrir: pode_editar && estado.fechado,
            fases_editaveis: estado.editaveis,
            fases: habilitadas.map((fase) => {
                const daFase = revisoes.filter((r) => r.fase_config_id === fase.id);
                const atual = daFase.find((r) => r.ultima_revisao);
                const anterior = revisoesAnteriores.find((r) => r.fase_config_id === fase.id);
                return {
                    config: {
                        id: fase.id,
                        ordem: fase.ordem,
                        rotulo: fase.rotulo,
                        aceita_tags: fase.aceita_tags,
                        aceita_anexos: fase.aceita_anexos,
                        fecha_ciclo: fase.id === estado.faseFechamentoId,
                        blocos: fase.blocos
                            .filter((b) => b.habilitado)
                            .map((b) => ({ id: b.id, ordem: b.ordem, rotulo: b.rotulo })),
                    },
                    preenchida: estado.preenchidas.includes(fase.id),
                    editavel: estado.editaveis.includes(fase.id),
                    atual: atual ? revisaoDto(atual) : null,
                    historico: daFase.filter((r) => !r.ultima_revisao).map(revisaoDto),
                    anterior: anterior ? revisaoDto(anterior) : null,
                    documentos: fase.aceita_anexos
                        ? documentos
                              .filter((d) => d.fase_config_id === fase.id)
                              .map((d) => ({
                                  id: d.id,
                                  fase_id: d.fase_config_id,
                                  descricao: d.descricao,
                                  criado_em: d.criado_em,
                                  criador: d.criador,
                                  arquivo: BuildArquivoBaseDto(
                                      d.arquivo,
                                      (id, expiresIn) =>
                                          this.uploadService.getDownloadToken(id, expiresIn).download_token
                                  ),
                              }))
                        : [],
                };
            }),
            historico_fechamentos: revisoes.filter((r) => r.fecha_ciclo).map(revisaoDto),
        };
    }

    async salvaFase(
        tipo: TipoPdmType,
        pdmId: number,
        cicloId: number,
        faseId: number,
        metaId: number,
        dto: SalvarPsCicloFaseDto,
        user: PessoaFromJwt
    ): Promise<RecordWithId> {
        await this.assertMetaDoPlano(tipo, pdmId, metaId, user, 'readwrite');

        return await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
            await this.travaPlano(prismaTx, pdmId, true);
            const ciclo = await this.carregaCiclo(prismaTx, pdmId, cicloId);
            const fases = await this.carregaFases(prismaTx, pdmId);
            const fase = this.faseHabilitada(fases, faseId);
            const estado = calculaEstadoCiclo(ciclo.ativo, fases, await this.carregaUltimas(prismaTx, metaId, [cicloId]));
            this.assertFaseEditavel(fases, fase, estado);

            const conteudo = await this.validaConteudo(prismaTx, pdmId, fase, dto);

            await prismaTx.metaMonitoramentoFase.updateMany({
                where: {
                    meta_id: metaId,
                    ciclo_fisico_id: cicloId,
                    fase_config_id: fase.id,
                    ultima_revisao: true,
                    removido_em: null,
                },
                data: { ultima_revisao: false },
            });

            const revisao = await prismaTx.metaMonitoramentoFase.create({
                data: {
                    meta_id: metaId,
                    ciclo_fisico_id: cicloId,
                    fase_config_id: fase.id,
                    referencia_data: ciclo.data_ciclo,
                    ultima_revisao: true,
                    fecha_ciclo: fase.id === estado.faseFechamentoId,
                    criado_por: user.id,
                    blocos: conteudo.blocos.length ? { createMany: { data: conteudo.blocos } } : undefined,
                    tags: conteudo.tags.length
                        ? { createMany: { data: conteudo.tags.map((tag_id) => ({ tag_id })) } }
                        : undefined,
                },
                select: { id: true },
            });

            return { id: revisao.id };
        }, TX_OPTS);
    }

    async adicionaDocumento(
        tipo: TipoPdmType,
        pdmId: number,
        cicloId: number,
        faseId: number,
        metaId: number,
        dto: CreatePsCicloFaseDocumentoDto,
        user: PessoaFromJwt
    ): Promise<RecordWithId> {
        await this.assertMetaDoPlano(tipo, pdmId, metaId, user, 'readwrite');
        const arquivo_id = this.uploadService.checkUploadOrDownloadToken(dto.upload_token);

        return await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
            const ciclo = await this.assertDocumentoEditavel(prismaTx, pdmId, cicloId, faseId, metaId);
            const documento = await prismaTx.metaMonitoramentoFaseDocumento.create({
                data: {
                    meta_id: metaId,
                    ciclo_fisico_id: cicloId,
                    fase_config_id: faseId,
                    arquivo_id,
                    descricao: dto.descricao ?? null,
                    referencia_data: ciclo.data_ciclo,
                    criado_por: user.id,
                },
                select: { id: true },
            });
            return { id: documento.id };
        }, TX_OPTS);
    }

    async atualizaDocumento(
        tipo: TipoPdmType,
        pdmId: number,
        cicloId: number,
        documentoId: number,
        metaId: number,
        dto: UpdatePsCicloFaseDocumentoDto,
        user: PessoaFromJwt
    ): Promise<RecordWithId> {
        await this.assertMetaDoPlano(tipo, pdmId, metaId, user, 'readwrite');

        return await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
            const documento = await this.carregaDocumento(prismaTx, pdmId, cicloId, metaId, documentoId);
            await this.assertDocumentoEditavel(prismaTx, pdmId, cicloId, documento.fase_config_id, metaId);
            await prismaTx.metaMonitoramentoFaseDocumento.update({
                where: { id: documento.id },
                data: { descricao: dto.descricao ?? null, atualizado_por: user.id, atualizado_em: new Date(Date.now()) },
            });
            return { id: documento.id };
        }, TX_OPTS);
    }

    async removeDocumento(
        tipo: TipoPdmType,
        pdmId: number,
        cicloId: number,
        documentoId: number,
        metaId: number,
        user: PessoaFromJwt
    ): Promise<void> {
        await this.assertMetaDoPlano(tipo, pdmId, metaId, user, 'readwrite');

        await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
            const documento = await this.carregaDocumento(prismaTx, pdmId, cicloId, metaId, documentoId);
            await this.assertDocumentoEditavel(prismaTx, pdmId, cicloId, documento.fase_config_id, metaId);
            await prismaTx.metaMonitoramentoFaseDocumento.update({
                where: { id: documento.id },
                data: { removido_por: user.id, removido_em: new Date(Date.now()) },
            });
        }, TX_OPTS);
    }

    async reabre(tipo: TipoPdmType, pdmId: number, cicloId: number, metaId: number, user: PessoaFromJwt): Promise<void> {
        await this.assertMetaDoPlano(tipo, pdmId, metaId, user, 'readwrite');

        await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
            await this.travaPlano(prismaTx, pdmId, true);
            await this.carregaCiclo(prismaTx, pdmId, cicloId);

            const fechamento = await prismaTx.metaMonitoramentoFase.findFirst({
                where: {
                    meta_id: metaId,
                    ciclo_fisico_id: cicloId,
                    fecha_ciclo: true,
                    ultima_revisao: true,
                    reaberto_em: null,
                    removido_em: null,
                },
                select: { id: true },
            });
            if (!fechamento) throw new HttpException('Não existe fechamento para reabrir neste ciclo', 400);

            await prismaTx.metaMonitoramentoFase.update({
                where: { id: fechamento.id },
                data: { reaberto_em: new Date(Date.now()), reaberto_por: user.id },
            });
        }, TX_OPTS);
    }

    private async assertMetaDoPlano(
        tipo: TipoPdmType,
        pdmId: number,
        metaId: number,
        user: PessoaFromJwt,
        modo: 'readonly' | 'readwrite'
    ) {
        const meta = await this.metaService.assertMetaWriteOrThrow(tipo, metaId, user, 'monitoramento', modo);
        if (meta.pdm_id !== pdmId) throw new HttpException('Meta não pertence a este plano', 400);
        return meta;
    }

    private async temEscritaNoPlano(tipo: TipoPdmType, pdmId: number, user: PessoaFromJwt): Promise<boolean> {
        try {
            await this.pdmService.assertUserPermission(tipo, pdmId, user, PdmPermissionLevel.CONTENT_WRITE);
            return true;
        } catch {
            return false;
        }
    }

    private async carregaCiclo(
        prisma: Prisma.TransactionClient,
        pdmId: number,
        cicloId: number
    ): Promise<CicloResumo> {
        const ciclo = await prisma.cicloFisico.findFirst({
            where: { id: cicloId, pdm_id: pdmId },
            select: { id: true, data_ciclo: true, ativo: true },
        });
        if (!ciclo) throw new HttpException('Ciclo não encontrado', 400);
        return ciclo;
    }

    private async carregaFases(prisma: Prisma.TransactionClient, pdmId: number): Promise<FaseConfig[]> {
        return await prisma.pdmMonitoramentoFaseConfig.findMany({
            where: { pdm_id: pdmId, removido_em: null },
            orderBy: { ordem: 'asc' },
            select: SelectFaseConfig,
        });
    }

    private async carregaUltimas(prisma: Prisma.TransactionClient, metaId: number, cicloIds: number[]) {
        return await prisma.metaMonitoramentoFase.findMany({
            where: { meta_id: metaId, ciclo_fisico_id: { in: cicloIds }, ultima_revisao: true, removido_em: null },
            select: { ciclo_fisico_id: true, fase_config_id: true, fecha_ciclo: true, reaberto_em: true },
        });
    }

    private async carregaDocumento(
        prismaTx: Prisma.TransactionClient,
        pdmId: number,
        cicloId: number,
        metaId: number,
        documentoId: number
    ) {
        const documento = await prismaTx.metaMonitoramentoFaseDocumento.findFirst({
            where: {
                id: documentoId,
                meta_id: metaId,
                ciclo_fisico_id: cicloId,
                removido_em: null,
                fase_config: { pdm_id: pdmId },
            },
            select: { id: true, fase_config_id: true },
        });
        if (!documento) throw new HttpException('Documento não encontrado', 400);
        return documento;
    }

    private async assertDocumentoEditavel(
        prismaTx: Prisma.TransactionClient,
        pdmId: number,
        cicloId: number,
        faseId: number,
        metaId: number
    ): Promise<CicloResumo> {
        await this.travaPlano(prismaTx, pdmId, true);
        const ciclo = await this.carregaCiclo(prismaTx, pdmId, cicloId);
        const fases = await this.carregaFases(prismaTx, pdmId);
        const fase = this.faseHabilitada(fases, faseId);
        if (!fase.aceita_anexos) throw new HttpException(`A fase "${fase.rotulo}" não aceita anexos`, 400);

        const estado = calculaEstadoCiclo(ciclo.ativo, fases, await this.carregaUltimas(prismaTx, metaId, [cicloId]));
        this.assertFaseEditavel(fases, fase, estado);
        return ciclo;
    }

    private faseHabilitada(fases: FaseConfig[], faseId: number): FaseConfig {
        const fase = fases.find((f) => f.id === faseId);
        if (!fase) throw new HttpException('Fase não encontrada neste plano', 400);
        if (!fase.habilitada) throw new HttpException(`A fase "${fase.rotulo}" está desabilitada`, 400);
        return fase;
    }

    private assertFaseEditavel(fases: FaseConfig[], fase: FaseConfig, estado: EstadoCiclo): void {
        if (estado.editaveis.includes(fase.id)) return;
        if (estado.fechado) throw new HttpException('Ciclo fechado para esta meta; reabra para editar', 400);
        if (!estado.cicloEditavel) throw new HttpException('Não é possível editar um ciclo inativo', 400);

        const pendentes = fases
            .filter((f) => f.habilitada && f.ordem < fase.ordem && !estado.preenchidas.includes(f.id))
            .map((f) => f.rotulo);
        throw new HttpException(`Preencha antes as fases: ${pendentes.join(', ')}`, 400);
    }

    private async validaConteudo(
        prismaTx: Prisma.TransactionClient,
        pdmId: number,
        fase: FaseConfig,
        dto: SalvarPsCicloFaseDto
    ): Promise<{ blocos: { bloco_config_id: number; conteudo: string }[]; tags: number[] }> {
        if (fase.aceita_tags) {
            if (dto.blocos?.length)
                throw new HttpException(`A fase "${fase.rotulo}" é de tags e não aceita blocos de texto`, 400);

            const tags = [...new Set(dto.tags ?? [])];
            if (tags.length) {
                const encontradas = await prismaTx.tag.findMany({
                    where: { id: { in: tags }, pdm_id: pdmId, removido_em: null },
                    select: { id: true },
                });
                const validas = new Set(encontradas.map((t) => t.id));
                const invalidas = tags.filter((t) => !validas.has(t));
                if (invalidas.length)
                    throw new HttpException(`Tags não encontradas neste plano: ${invalidas.join(', ')}`, 400);
            }
            return { blocos: [], tags };
        }

        if (dto.tags?.length) throw new HttpException(`A fase "${fase.rotulo}" é de texto e não aceita tags`, 400);

        const habilitados = new Set(fase.blocos.filter((b) => b.habilitado).map((b) => b.id));
        const enviados = new Set<number>();
        const blocos: { bloco_config_id: number; conteudo: string }[] = [];
        for (const bloco of dto.blocos ?? []) {
            if (!habilitados.has(bloco.bloco_id))
                throw new HttpException(`Bloco ${bloco.bloco_id} não está habilitado nesta fase`, 400);
            if (enviados.has(bloco.bloco_id))
                throw new HttpException(`Bloco ${bloco.bloco_id} enviado mais de uma vez`, 400);
            enviados.add(bloco.bloco_id);

            const conteudo = HtmlSanitizer(bloco.conteudo).trim();
            if (conteudo) blocos.push({ bloco_config_id: bloco.bloco_id, conteudo });
        }
        return { blocos, tags: [] };
    }

    private cicloDto(ciclo: CicloResumo): PsCicloFaseCicloDto {
        return { id: ciclo.id, data_ciclo: Date2YMD.toString(ciclo.data_ciclo), ativo: ciclo.ativo };
    }

    private revisaoDto(
        r: RevisaoCompleta,
        blocosVisiveis: Set<number>,
        fasesDeTags: Set<number>
    ): PsCicloFaseRevisaoDto {
        return {
            id: r.id,
            fase_id: r.fase_config_id,
            fase_rotulo: r.fase_config.rotulo,
            ultima_revisao: r.ultima_revisao,
            fecha_ciclo: r.fecha_ciclo,
            automatico: r.criado_por === CONST_BOT_USER_ID,
            comentario_sistema: r.comentario_sistema,
            referencia_data: Date2YMD.toString(r.referencia_data),
            criado_em: r.criado_em,
            criador: r.criador,
            reaberto_em: r.reaberto_em,
            reaberto_por: r.reabridor,
            blocos: r.blocos
                .filter((b) => blocosVisiveis.has(b.bloco_config_id))
                .sort((a, b) => a.bloco_config.ordem - b.bloco_config.ordem)
                .map((b) => ({
                    bloco_id: b.bloco_config_id,
                    rotulo: b.bloco_config.rotulo,
                    conteudo: b.conteudo,
                    conteudo_texto: Html2Text(b.conteudo),
                })),
            tags: fasesDeTags.has(r.fase_config_id)
                ? r.tags.map((t) => ({
                      id: t.tag.id,
                      descricao: t.tag.descricao,
                      ods_id: t.tag.ods_id,
                      removido: t.tag.removido_em !== null,
                  }))
                : [],
        };
    }
}
