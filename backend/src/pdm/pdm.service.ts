import { ForbiddenException, HttpException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { UploadService } from 'src/upload/upload.service';
import { CreatePdmDocumentDto } from './dto/create-pdm-document.dto';
import { CreatePdmDto } from './dto/create-pdm.dto';
import { FilterPdmDto } from './dto/filter-pdm.dto';
import { UpdatePdmDto } from './dto/update-pdm.dto';
import { PdmDocument } from './entities/pdm-document.entity';

@Injectable()
export class PdmService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly uploadService: UploadService
    ) { }

    async create(createPdmDto: CreatePdmDto, user: PessoaFromJwt) {

        const similarExists = await this.prisma.pdm.count({
            where: {
                descricao: { endsWith: createPdmDto.nome, mode: 'insensitive' },
            }
        });
        if (similarExists > 0)
            throw new HttpException('descricao| Descrição igual ou semelhante já existe em outro registro ativo', 400);

        let arquivo_logo_id;
        if (createPdmDto.upload_logo) {
            arquivo_logo_id = await this.uploadService.checkDownloadToken(createPdmDto.upload_logo);
            delete createPdmDto.upload_logo;
        }

        if (createPdmDto.possui_atividade && !createPdmDto.possui_iniciativa)
            throw new HttpException('possui_atividade| possui_iniciativa precisa ser True para ativar Atividades', 400);

        const created = await this.prisma.pdm.create({
            data: {
                criado_por: user.id,
                criado_em: new Date(Date.now()),
                arquivo_logo_id: arquivo_logo_id,
                ...createPdmDto as any,
            },
            select: { id: true }
        });

        return created;
    }

    async findAll(filters: FilterPdmDto | undefined = undefined) {
        const active = filters?.ativo;

        const listActive = await this.prisma.pdm.findMany({
            where: {
                ativo: active,
            },
            select: {
                id: true,
                nome: true,
                descricao: true,
                ativo: true,
                data_inicio: true,
                data_fim: true,
                equipe_tecnica: true,
                prefeito: true,
                data_publicacao: true,
                periodo_do_ciclo_participativo_inicio: true,
                periodo_do_ciclo_participativo_fim: true,
                rotulo_iniciativa: true,
                rotulo_atividade: true,
                rotulo_macro_tema: true,
                rotulo_tema: true,
                rotulo_sub_tema: true,
                rotulo_contexto_meta: true,
                rotulo_complementacao_meta: true,
                possui_macro_tema: true,
                possui_tema: true,
                possui_sub_tema: true,
                possui_contexto_meta: true,
                possui_complementacao_meta: true,
                possui_atividade: true,
                possui_iniciativa: true
            }
        });

        return listActive;
    }

    async getDetail(id: number, user: PessoaFromJwt) {
        let pdm = await this.prisma.pdm.findFirst({
            where: {
                id: id
            }
        });
        if (!pdm) throw new HttpException('PDM não encontrado', 404)

        if (pdm.arquivo_logo_id) {
            pdm.logo = this.uploadService.getDownloadToken(pdm.arquivo_logo_id, '30d').download_token
        }
        return pdm;
    }

    async verificarPrivilegiosEdicao(updatePdmDto: UpdatePdmDto, user: PessoaFromJwt) {
        if (
            updatePdmDto.ativo === true &&
            user.hasSomeRoles(['CadastroPdm.ativar']) === false
        ) {
            throw new ForbiddenException(`Você não pode ativar Plano de Metas`);
        } else if (
            updatePdmDto.ativo === false &&
            user.hasSomeRoles(['CadastroPdm.inativar']) === false
        ) {
            throw new ForbiddenException(`Você não pode inativar Plano de Metas`);
        }

    }

    async update(id: number, updatePdmDto: UpdatePdmDto, user: PessoaFromJwt) {
        let pdm = await this.prisma.pdm.count({ where: { id: id } });
        if (!pdm) throw new HttpException('PDM não encontrado', 404);

        updatePdmDto.id = id
        await this.verificarPrivilegiosEdicao(updatePdmDto, user);

        if (updatePdmDto.nome) {
            const similarExists = await this.prisma.pdm.count({
                where: {
                    descricao: { endsWith: updatePdmDto.nome, mode: 'insensitive' },
                    NOT: { id: id }
                }
            });
            if (similarExists > 0)
                throw new HttpException('descricao| Descrição igual ou semelhante já existe em outro registro ativo', 400);
        }

        let arquivo_logo_id: number | undefined;
        if (updatePdmDto.upload_logo) {
            arquivo_logo_id = await this.uploadService.checkDownloadToken(updatePdmDto.upload_logo);
            delete updatePdmDto.upload_logo;
        }

        await this.prisma.$transaction(async (prisma: Prisma.TransactionClient) => {
            if (updatePdmDto.possui_atividade) {
                let pdm = await this.prisma.pdm.findFirst({where: {id: id}});

                if (!updatePdmDto.possui_iniciativa || !pdm?.possui_iniciativa) {
                    throw new HttpException('possui_atividade| possui_iniciativa precisa ser True para ativar Atividades', 400);
                }
            }

            if (updatePdmDto.ativo === true) {
                // desativa outros planos
                prisma.pdm.updateMany({
                    where: {
                        ativo: true
                    },
                    data: {
                        ativo: false,
                        desativado_em: new Date(Date.now()),
                        desativado_por: user.id,
                        arquivo_logo_id: arquivo_logo_id
                    }
                });
            } else if (updatePdmDto.ativo === false) {
                await prisma.pdm.update({
                    where: { id: id },
                    data: {
                        ativo: false,
                        desativado_em: new Date(Date.now()),
                        desativado_por: user.id,
                        arquivo_logo_id: arquivo_logo_id
                    },
                    select: { id: true }
                });
            }

            await prisma.pdm.update({
                where: { id: id },
                data: {
                    atualizado_por: user.id,
                    atualizado_em: new Date(Date.now()),
                    ...updatePdmDto,
                    arquivo_logo_id: arquivo_logo_id
                },
                select: { id: true }
            });

        });

        return { id: id };
    }

    async append_document(pdm_id: number, createPdmDocDto: CreatePdmDocumentDto, user: PessoaFromJwt) {
        let pdm = await this.prisma.pdm.count({ where: { id: pdm_id } });
        if (!pdm) throw new HttpException('PDM não encontrado', 404);

        const arquivoId = this.uploadService.checkUploadToken(createPdmDocDto.upload_token);

        const arquivo = await this.prisma.arquivoDocumento.create({
            data: {
                criado_em: new Date(Date.now()),
                criado_por: user.id,
                arquivo_id: arquivoId,
                pdm_id: pdm_id
            },
            select: {
                id: true
            }
        });

        return { id: arquivo.id }
    }

    async list_document(pdm_id: number, user: PessoaFromJwt) {
        let pdm = await this.prisma.pdm.count({ where: { id: pdm_id } });
        if (!pdm) throw new HttpException('PDM não encontrado', 404);

        const arquivos: PdmDocument[] = await this.prisma.arquivoDocumento.findMany({
            where: { pdm_id: pdm_id, removido_em: null },
            select: {
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
        for (const item of arquivos) {
            item.arquivo.download_token = this.uploadService.getDownloadToken(item.arquivo.id, '30d').download_token;
        }

        return arquivos
    }

    async remove_document(pdm_id: number, pdmDocId: number, user: PessoaFromJwt) {
        let pdm = await this.prisma.pdm.count({ where: { id: pdm_id } });
        if (!pdm) throw new HttpException('PDM não encontrado', 404);

        await this.prisma.arquivoDocumento.updateMany({
            where: { pdm_id: pdm_id, removido_em: null, id: pdmDocId },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            }
        });
    }

}
