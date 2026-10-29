import { HttpException, Injectable } from '@nestjs/common';
import { PessoaAcessoPdm, Prisma } from '@prisma/client';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { Date2YMD } from '../../common/date2ymd';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { Html2Text } from '../../common/Html2Text';
import { HtmlSanitizer } from '../../common/html-sanitizer';
import { PrismaService } from '../../prisma/prisma.service';
import { escreveNoPdmLegado } from './trava-pdm-legado';
import { UploadService } from '../../upload/upload.service';
import {
    AnaliseQualitativaDocumentoDto,
    CreateAnaliseQualitativaDto,
    FilterAnaliseQualitativaDto,
    MfListAnaliseQualitativaDto,
    UpdateAnaliseQualitativaDocumentoDto,
} from './../metas/dto/mf-meta-analise-quali.dto';
import { BuildArquivoBaseDto, PrismaArquivoComPreviewSelect } from '../../upload/arquivo-preview.helper';

@Injectable()
export class MetasAnaliseQualiService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly uploadService: UploadService
    ) {}

    private async carregaCicloPorId(ciclo_fisico_id: number) {
        const ret = await this.prisma.cicloFisico.findFirst({
            where: { id: ciclo_fisico_id },
            select: {
                data_ciclo: true,
            },
        });
        if (!ret) {
            throw new HttpException(`Ciclo não encontrado no PDM`, 404);
        }

        return ret;
    }

    private async carregaCicloDoDocumento(id: number): Promise<number> {
        const documento = await this.prisma.metaCicloFisicoAnaliseDocumento.findFirst({
            where: { id, removido_em: null },
            select: { ciclo_fisico_id: true },
        });
        if (!documento) throw new HttpException('Documento não encontrado ou já removido', 404);

        return documento.ciclo_fisico_id;
    }

    async getMetaAnaliseQualitativa(
        dto: FilterAnaliseQualitativaDto,
        config: PessoaAcessoPdm | null,
        user: PessoaFromJwt | null
    ): Promise<MfListAnaliseQualitativaDto> {
        return this.getMetaAnaliseQualitativaInterno(dto);
    }

    async getMetaAnaliseQualitativaInterno(dto: FilterAnaliseQualitativaDto): Promise<MfListAnaliseQualitativaDto> {
        const analisesResult = await this.prisma.metaCicloFisicoAnalise.findMany({
            where: {
                ciclo_fisico_id: dto.ciclo_fisico_id,
                meta_id: dto.meta_id,
                ultima_revisao: dto.apenas_ultima_revisao ? true : undefined,
            },
            orderBy: {
                criado_em: 'desc',
            },
            select: {
                ultima_revisao: true,
                informacoes_complementares: true,
                referencia_data: true,
                criado_em: true,
                meta_id: true,
                pessoaCriador: {
                    select: { nome_exibicao: true },
                },
                id: true,
            },
        });

        const arquivosResult = await this.prisma.metaCicloFisicoAnaliseDocumento.findMany({
            where: {
                ciclo_fisico_id: dto.ciclo_fisico_id,
                meta_id: dto.meta_id,
                removido_em: null,
            },
            orderBy: {
                criado_em: 'desc',
            },
            select: {
                criado_em: true,
                pessoaCriador: {
                    select: { nome_exibicao: true },
                },
                id: true,
                descricao: true,
                arquivo: {
                    select: PrismaArquivoComPreviewSelect,
                },
            },
        });

        return {
            arquivos: arquivosResult.map((r) => {
                return {
                    id: r.id,
                    criador: { nome_exibicao: r.pessoaCriador.nome_exibicao },
                    criado_em: r.criado_em,
                    descricao: r.descricao,
                    arquivo: BuildArquivoBaseDto(
                        r.arquivo,
                        (id, expiresIn) => this.uploadService.getDownloadToken(id, expiresIn).download_token
                    ),
                };
            }),
            analises: analisesResult.map((r) => {
                return {
                    informacoes_complementares: r.informacoes_complementares || '',
                    informacoes_complementares_texto: Html2Text(r.informacoes_complementares) || '',
                    referencia_data: Date2YMD.toString(r.referencia_data),
                    ultima_revisao: r.ultima_revisao,
                    criado_em: r.criado_em,
                    meta_id: r.meta_id,
                    id: r.id,
                    criador: { nome_exibicao: r.pessoaCriador.nome_exibicao },
                };
            }),
        };
    }

    async addMetaAnaliseQualitativaDocumento(
        dto: AnaliseQualitativaDocumentoDto,
        config: PessoaAcessoPdm,
        user: PessoaFromJwt,
        prismaCtx?: Prisma.TransactionClient | undefined
    ): Promise<RecordWithId> {
        if (config.perfil == 'ponto_focal') {
            throw new HttpException('Você não pode enviar analise qualitativa.', 400);
        }

        return escreveNoPdmLegado(this.prisma, prismaCtx, dto.ciclo_fisico_id, (prismaTx) =>
            this.addMetaAnaliseQualitativaDocumentoInterno(dto, user, prismaTx)
        );
    }

    async addMetaAnaliseQualitativaDocumentoInterno(
        dto: AnaliseQualitativaDocumentoDto,
        user: PessoaFromJwt,
        prismaCtx: Prisma.TransactionClient
    ): Promise<RecordWithId> {
        const now = new Date(Date.now());
        const ciclo = await this.carregaCicloPorId(dto.ciclo_fisico_id);

        const performWrite = async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
            const uploadId = this.uploadService.checkUploadOrDownloadToken(dto.upload_token);

            const cfq = await prismaTx.metaCicloFisicoAnaliseDocumento.create({
                data: {
                    ciclo_fisico_id: dto.ciclo_fisico_id,
                    meta_id: dto.meta_id,
                    criado_por: user.id,
                    criado_em: now,
                    referencia_data: ciclo.data_ciclo,
                    arquivo_id: uploadId,
                    descricao: dto.descricao,
                },
                select: { id: true },
            });

            return { id: cfq.id };
        };

        return await performWrite(prismaCtx);
    }

    async updateMetaAnaliseQualitativaDocumento(
        id: number,
        dto: UpdateAnaliseQualitativaDocumentoDto,
        config: PessoaAcessoPdm,
        user: PessoaFromJwt,
        prismaCtx?: Prisma.TransactionClient | undefined
    ): Promise<RecordWithId> {
        if (config.perfil == 'ponto_focal') {
            throw new HttpException('Você não pode atualizar análise qualitativa.', 400);
        }

        const cicloFisicoId = await this.carregaCicloDoDocumento(id);
        return escreveNoPdmLegado(this.prisma, prismaCtx, cicloFisicoId, (prismaTx) =>
            this.updateMetaAnaliseQualitativaDocumentoInterno(id, dto, user, prismaTx)
        );
    }

    async updateMetaAnaliseQualitativaDocumentoInterno(
        id: number,
        dto: UpdateAnaliseQualitativaDocumentoDto,
        user: PessoaFromJwt,
        prismaCtx: Prisma.TransactionClient
    ): Promise<RecordWithId> {
        const documento = await prismaCtx.metaCicloFisicoAnaliseDocumento.findFirst({
            where: {
                id: id,
                removido_em: null,
            },
        });
        if (!documento) throw new HttpException('Documento não encontrado ou já removido', 404);

        const performWrite = async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
            const updated = await prismaTx.metaCicloFisicoAnaliseDocumento.update({
                where: { id: id },
                data: {
                    descricao: dto.descricao,
                },
                select: { id: true },
            });

            return { id: updated.id };
        };

        return await performWrite(prismaCtx);
    }

    async deleteMetaAnaliseQualitativaDocumento(
        id: number,
        config: PessoaAcessoPdm,
        user: PessoaFromJwt,
        prismaCtx?: Prisma.TransactionClient | undefined
    ) {
        if (config.perfil == 'ponto_focal') {
            throw new HttpException('Você não pode remover analise qualitativa.', 400);
        }

        const cicloFisicoId = await this.carregaCicloDoDocumento(id);
        return escreveNoPdmLegado(this.prisma, prismaCtx, cicloFisicoId, (prismaTx) =>
            this.deleteMetaAnaliseQualitativaDocumentoInterno(id, user, prismaTx)
        );
    }

    async deleteMetaAnaliseQualitativaDocumentoInterno(
        id: number,
        user: PessoaFromJwt,
        prismaCtx: Prisma.TransactionClient
    ) {
        const arquivo = await prismaCtx.metaCicloFisicoAnaliseDocumento.findFirst({
            where: {
                id: id,
                removido_em: null,
            },
        });
        if (!arquivo) throw new HttpException('Documento não encontrado ou já removido', 404);
        const now = new Date(Date.now());

        const performWrite = async (prismaTx: Prisma.TransactionClient): Promise<void> => {
            await prismaTx.metaCicloFisicoAnaliseDocumento.update({
                where: { id: id },
                data: { removido_em: now, removido_por: user.id },
            });
        };

        await performWrite(prismaCtx);
    }

    async addMetaAnaliseQualitativa(
        dto: CreateAnaliseQualitativaDto,
        config: PessoaAcessoPdm,
        user: PessoaFromJwt,
        prismaCtx?: Prisma.TransactionClient | undefined
    ): Promise<RecordWithId> {
        if (config.perfil == 'ponto_focal') {
            throw new HttpException('Você não pode enviar analise qualitativa.', 400);
        }

        return escreveNoPdmLegado(this.prisma, prismaCtx, dto.ciclo_fisico_id, (prismaTx) =>
            this.addMetaAnaliseQualitativaInterno(dto, user, prismaTx)
        );
    }

    async addMetaAnaliseQualitativaInterno(
        dto: CreateAnaliseQualitativaDto,
        user: PessoaFromJwt,
        prismaCtx: Prisma.TransactionClient
    ): Promise<RecordWithId> {
        const now = new Date(Date.now());
        const ciclo = await this.carregaCicloPorId(dto.ciclo_fisico_id);

        const performWrite = async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
            await prismaTx.metaCicloFisicoAnalise.updateMany({
                where: {
                    ciclo_fisico_id: dto.ciclo_fisico_id,
                    meta_id: dto.meta_id,
                    ultima_revisao: true,
                },
                data: {
                    ultima_revisao: false,
                },
            });

            dto.informacoes_complementares = HtmlSanitizer(dto.informacoes_complementares);

            const cfq = await prismaTx.metaCicloFisicoAnalise.create({
                data: {
                    ciclo_fisico_id: dto.ciclo_fisico_id,
                    ultima_revisao: true,
                    criado_por: user.id,
                    criado_em: now,
                    referencia_data: ciclo.data_ciclo,
                    informacoes_complementares: dto.informacoes_complementares,
                    meta_id: dto.meta_id,
                },
                select: { id: true },
            });

            return { id: cfq.id };
        };

        return await performWrite(prismaCtx);
    }
}
