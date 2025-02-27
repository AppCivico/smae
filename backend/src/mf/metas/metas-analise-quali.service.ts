import { HttpException, Injectable } from '@nestjs/common';
import { PessoaAcessoPdm, Prisma } from '@prisma/client';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { Date2YMD } from '../../common/date2ymd';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadService } from '../../upload/upload.service';
import {
    AnaliseQualitativaDocumentoDto,
    CreateAnaliseQualitativaDto,
    FilterAnaliseQualitativaDto,
    MfListAnaliseQualitativaDto,
} from './../metas/dto/mf-meta-analise-quali.dto';
import { ArquivoBaseDto } from '../../upload/dto/create-upload.dto';

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
                arquivo: {
                    select: {
                        id: true,
                        tamanho_bytes: true,
                        nome_original: true,
                        diretorio_caminho: true,
                    },
                },
            },
        });

        return {
            arquivos: arquivosResult.map((r) => {
                return {
                    id: r.id,
                    criador: { nome_exibicao: r.pessoaCriador.nome_exibicao },
                    criado_em: r.criado_em,
                    arquivo: {
                        ...r.arquivo,
                        descricao: null,
                        ...this.uploadService.getDownloadToken(r.arquivo.id, '180 minutes'),
                    } satisfies ArquivoBaseDto,
                };
            }),
            analises: analisesResult.map((r) => {
                return {
                    informacoes_complementares: r.informacoes_complementares || '',
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

        return this.addMetaAnaliseQualitativaDocumentoInterno(dto, user, prismaCtx);
    }

    async addMetaAnaliseQualitativaDocumentoInterno(
        dto: AnaliseQualitativaDocumentoDto,
        user: PessoaFromJwt,
        prismaCtx?: Prisma.TransactionClient | undefined
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
                },
                select: { id: true },
            });

            return { id: cfq.id };
        };

        let ret;
        if (prismaCtx) {
            ret = await performWrite(prismaCtx);
        } else {
            ret = await this.prisma.$transaction(
                async (prismaTx: Prisma.TransactionClient) => {
                    return await performWrite(prismaTx);
                },
                {
                    isolationLevel: 'Serializable',
                    maxWait: 5000,
                    timeout: 5000,
                }
            );
        }
        return ret;
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

        return this.deleteMetaAnaliseQualitativaDocumentoInterno(id, user, prismaCtx);
    }

    async deleteMetaAnaliseQualitativaDocumentoInterno(
        id: number,
        user: PessoaFromJwt,
        prismaCtx?: Prisma.TransactionClient | undefined
    ) {
        const arquivo = await this.prisma.metaCicloFisicoAnaliseDocumento.findFirst({
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

        if (prismaCtx) {
            await performWrite(prismaCtx);
        } else {
            await this.prisma.$transaction(
                async (prismaTx: Prisma.TransactionClient) => {
                    await performWrite(prismaTx);
                },
                {
                    isolationLevel: 'Serializable',
                    maxWait: 5000,
                    timeout: 5000,
                }
            );
        }
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

        return this.addMetaAnaliseQualitativaInterno(dto, user, prismaCtx);
    }

    async addMetaAnaliseQualitativaInterno(
        dto: CreateAnaliseQualitativaDto,
        user: PessoaFromJwt,
        prismaCtx?: Prisma.TransactionClient | undefined
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

        let ret;
        if (prismaCtx) {
            ret = await performWrite(prismaCtx);
        } else {
            ret = await this.prisma.$transaction(
                async (prismaTx: Prisma.TransactionClient) => {
                    return await performWrite(prismaTx);
                },
                {
                    isolationLevel: 'Serializable',
                    maxWait: 5000,
                    timeout: 5000,
                }
            );
        }
        return ret;
    }
}
