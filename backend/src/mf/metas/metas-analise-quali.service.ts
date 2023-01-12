import { HttpException, Injectable } from '@nestjs/common';
import { PessoaAcessoPdm, Prisma } from '@prisma/client';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { Date2YMD } from '../../common/date2ymd';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { AnaliseQualitativaDocumentoDto, AnaliseQualitativaDto, FilterAnaliseQualitativaDto, MfListAnaliseQualitativaDto } from './../metas/dto/mf-meta-analise-quali.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadService } from '../../upload/upload.service';


@Injectable()
export class MetasAnaliseQualiService {

    constructor(
        private readonly prisma: PrismaService,
        private readonly uploadService: UploadService,
    ) { }


    private async carregaCicloPorId(ciclo_fisico_id: number) {
        const ret = await this.prisma.cicloFisico.findFirst({
            where: { id: ciclo_fisico_id },
            select: {
                data_ciclo: true
            }
        });
        if (!ret) {
            throw new HttpException(`Ciclo não encontrado no PDM`, 404);
        }

        return ret;
    }

    async getMetaAnaliseQualitativa(dto: FilterAnaliseQualitativaDto, config: PessoaAcessoPdm | null, user: PessoaFromJwt | null): Promise<MfListAnaliseQualitativaDto> {
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
                    select: { nome_exibicao: true }
                },
                id: true
            }
        });

        const arquivosResult = await this.prisma.metaCicloFisicoAnaliseDocumento.findMany({
            where: {
                ciclo_fisico_id: dto.ciclo_fisico_id,
                meta_id: dto.meta_id,
                removido_em: null
            },
            orderBy: {
                criado_em: 'desc',
            },
            select: {
                criado_em: true,
                pessoaCriador: {
                    select: { nome_exibicao: true }
                },
                id: true,
                arquivo: {
                    select: {
                        id: true,
                        tamanho_bytes: true,
                        TipoDocumento: true,
                        descricao: true,
                        nome_original: true
                    }
                }
            }
        });


        return {
            arquivos: arquivosResult.map((r) => {
                return {
                    id: r.id,
                    criador: { nome_exibicao: r.pessoaCriador.nome_exibicao },
                    criado_em: r.criado_em,
                    arquivo: { ...r.arquivo, ...this.uploadService.getDownloadToken(r.arquivo.id, '180 minutes') },
                }
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
                }
            }),
        }
    }


    async addMetaAnaliseQualitativaDocumento(dto: AnaliseQualitativaDocumentoDto, config: PessoaAcessoPdm, user: PessoaFromJwt): Promise<RecordWithId> {
        const now = new Date(Date.now());
        if (config.perfil == 'ponto_focal') {
            throw new HttpException('Você não pode enviar analise qualitativa.', 400);
        }
        const ciclo = await this.carregaCicloPorId(dto.ciclo_fisico_id);


        const id = await this.prisma.$transaction(async (prismaTxn: Prisma.TransactionClient): Promise<number> => {
            const uploadId = this.uploadService.checkUploadToken(dto.upload_token);

            const cfq = await prismaTxn.metaCicloFisicoAnaliseDocumento.create({
                data: {
                    ciclo_fisico_id: dto.ciclo_fisico_id,
                    meta_id: dto.meta_id,
                    criado_por: user.id,
                    criado_em: now,
                    referencia_data: ciclo.data_ciclo,
                    arquivo_id: uploadId,
                },
                select: { id: true }
            });

            return cfq.id;
        });

        return { id: id }
    }

    async deleteMetaAnaliseQualitativaDocumento(id: number, config: PessoaAcessoPdm, user: PessoaFromJwt) {
        const arquivo = await this.prisma.metaCicloFisicoAnaliseDocumento.findFirst({
            where: {
                id: id,
                removido_em: null
            }
        });
        if (!arquivo) throw new HttpException('404', 404);
        const now = new Date(Date.now());

        if (config.perfil == 'ponto_focal') {
            throw new HttpException('Você não pode remover analise qualitativa.', 400);
        }

        const count = await this.prisma.metaCicloFisicoAnaliseDocumento.update({
            where: { id: id },
            data: { removido_em: now, removido_por: user.id }
        });
        console.log({ count });

    }


    async addMetaAnaliseQualitativa(dto: AnaliseQualitativaDto, config: PessoaAcessoPdm, user: PessoaFromJwt): Promise<RecordWithId> {
        const now = new Date(Date.now());
        if (config.perfil == 'ponto_focal') {
            throw new HttpException('Você não pode enviar analise qualitativa.', 400);
        }
        const ciclo = await this.carregaCicloPorId(dto.ciclo_fisico_id);


        const id = await this.prisma.$transaction(async (prismaTxn: Prisma.TransactionClient): Promise<number> => {

            const cfq = await prismaTxn.metaCicloFisicoAnalise.create({
                data: {
                    ciclo_fisico_id: dto.ciclo_fisico_id,

                    ultima_revisao: true,
                    criado_por: user.id,
                    criado_em: now,
                    referencia_data: ciclo.data_ciclo,
                    informacoes_complementares: dto.informacoes_complementares,
                    meta_id: dto.meta_id,
                },
                select: { id: true }
            });


            return cfq.id;
        });

        return { id: id }
    }


}
