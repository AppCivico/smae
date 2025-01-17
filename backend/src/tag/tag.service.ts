import { HttpException, Inject, Injectable } from '@nestjs/common';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { PdmModoParaTipo, TipoPdmType } from '../common/decorators/current-tipo-pdm';
import { PdmService } from '../pdm/pdm.service';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { FilterTagDto } from './dto/filter-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { TagDto } from './entities/tag.entity';

@Injectable()
export class TagService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly uploadService: UploadService,
        //
        @Inject(PdmService)
        private readonly pdmService: PdmService
    ) {}

    async create(tipo: TipoPdmType, createTagDto: CreateTagDto, user: PessoaFromJwt) {
        await this.pdmService.getDetail(tipo, createTagDto.pdm_id, user, 'ReadWrite');

        const similarExists = await this.prisma.tag.count({
            where: {
                descricao: { equals: createTagDto.descricao, mode: 'insensitive' },
                pdm_id: createTagDto.pdm_id,
                pdm: { tipo: PdmModoParaTipo(tipo), id: createTagDto.pdm_id },
                removido_em: null,
            },
        });

        if (similarExists > 0)
            throw new HttpException('descricao| Descrição igual ou semelhante já existe em outro registro ativo', 400);

        let uploadId: number | null = null;
        if (createTagDto.upload_icone) {
            uploadId = this.uploadService.checkUploadOrDownloadToken(createTagDto.upload_icone);
        }
        delete createTagDto.upload_icone;

        const created = await this.prisma.tag.create({
            data: {
                criado_por: user.id,
                criado_em: new Date(Date.now()),
                ...createTagDto,
                arquivo_icone_id: uploadId,
            },
            select: { id: true },
        });

        return created;
    }

    async findAll(tipo: TipoPdmType, filters: FilterTagDto): Promise<TagDto[]> {
        const listActive = await this.prisma.tag.findMany({
            where: {
                id: filters.id ? { in: filters.id } : undefined,
                pdm_id: filters.pdm_id,
                pdm: { id: filters.pdm_id, tipo: PdmModoParaTipo(tipo) },
                removido_em: null,
            },
            select: {
                id: true,
                descricao: true,
                pdm_id: true,
                ods_id: true,
                icone: true,
                arquivo_icone_id: true,
                ods: {
                    select: { id: true, titulo: true },
                },
            },
            orderBy: { descricao: 'asc' },
        });

        for (const item of listActive) {
            if (item.arquivo_icone_id)
                item.icone = this.uploadService.getDownloadToken(item.arquivo_icone_id, '1 days').download_token;
        }

        return listActive;
    }

    async update(tipo: TipoPdmType, id: number, updateTagDto: UpdateTagDto, user: PessoaFromJwt) {
        const self = await this.prisma.tag.findFirstOrThrow({
            where: { id: id, removido_em: null, pdm: { tipo: PdmModoParaTipo(tipo) } },
        });

        await this.pdmService.getDetail(tipo, self.pdm_id, user, 'ReadWrite');

        let uploadId: number | null | undefined = undefined;
        if (updateTagDto.upload_icone === null || updateTagDto.upload_icone === '') {
            uploadId = null;
        } else if (updateTagDto.upload_icone) {
            uploadId = this.uploadService.checkUploadOrDownloadToken(updateTagDto.upload_icone);
        }
        delete updateTagDto.upload_icone;

        if (updateTagDto.descricao !== undefined) {
            const similarExists = await this.prisma.tag.count({
                where: {
                    descricao: { equals: updateTagDto.descricao, mode: 'insensitive' },
                    pdm: { tipo: PdmModoParaTipo(tipo), id: self.pdm_id },
                    removido_em: null,
                    pdm_id: self.pdm_id,
                    NOT: { id: id },
                },
            });

            if (similarExists > 0)
                throw new HttpException(
                    'descricao| Descrição igual ou semelhante já existe em outro registro ativo',
                    400
                );
        }

        await this.prisma.tag.update({
            where: { id: id },
            data: {
                atualizado_por: user.id,
                atualizado_em: new Date(Date.now()),
                ...updateTagDto,
                arquivo_icone_id: uploadId,
            },
        });

        return { id };
    }

    async remove(tipo: TipoPdmType, id: number, user: PessoaFromJwt) {
        const self = await this.prisma.tag.findFirstOrThrow({
            where: { id, removido_em: null, pdm: { tipo: PdmModoParaTipo(tipo) } },
            select: { pdm_id: true },
        });
        await this.pdmService.getDetail(tipo, self.pdm_id, user, 'ReadWrite');

        const emUso = await this.prisma.meta.count({
            where: {
                removido_em: null,
                pdm: { tipo: PdmModoParaTipo(tipo) },
                meta_tag: {
                    some: {
                        tag_id: id,
                    },
                },
            },
        });
        if (emUso > 0) throw new HttpException('Tag em uso em Metas.', 400);

        const created = await this.prisma.tag.updateMany({
            where: { id: id, pdm: { tipo: PdmModoParaTipo(tipo) }, removido_em: null },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });

        return created;
    }
}
