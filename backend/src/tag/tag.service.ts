import { HttpException, Injectable } from '@nestjs/common';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { FilterTagDto } from './dto/filter-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@Injectable()
export class TagService {
    constructor(private readonly prisma: PrismaService, private readonly uploadService: UploadService) {}

    async create(createTagDto: CreateTagDto, user: PessoaFromJwt) {
        const similarExists = await this.prisma.tag.count({
            where: {
                descricao: { equals: createTagDto.descricao, mode: 'insensitive' },
                removido_em: null,
                pdm_id: createTagDto.pdm_id,
            },
        });

        if (similarExists > 0)
            throw new HttpException('descricao| Descrição igual ou semelhante já existe em outro registro ativo', 400);

        let uploadId: number | null = null;
        if (createTagDto.upload_icone) {
            uploadId = this.uploadService.checkUploadOrDownloadToken(createTagDto.upload_icone);
        }
        delete createTagDto.upload_icone;

        console.log(createTagDto);

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

    async findAll(filters: FilterTagDto | undefined = undefined) {
        const pdmId = filters?.pdm_id;

        const listActive = await this.prisma.tag.findMany({
            where: {
                removido_em: null,
                pdm_id: pdmId,
            },
            select: {
                id: true,
                descricao: true,
                pdm_id: true,
                ods_id: true,
                icone: true,
                arquivo_icone_id: true,
            },
            orderBy: { descricao: 'asc' },
        });

        for (const item of listActive) {
            if (item.arquivo_icone_id)
                item.icone = this.uploadService.getDownloadToken(item.arquivo_icone_id, '1 days').download_token;
        }

        return listActive;
    }

    async update(id: number, updateTagDto: UpdateTagDto, user: PessoaFromJwt) {
        const self = await this.prisma.tag.findFirstOrThrow({
            where: { id: id },
        });

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

    async remove(id: number, user: PessoaFromJwt) {
        const created = await this.prisma.tag.updateMany({
            where: { id: id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });

        return created;
    }
}
