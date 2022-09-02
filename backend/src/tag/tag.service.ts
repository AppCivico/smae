import { Injectable, Logger } from '@nestjs/common';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { UploadService } from 'src/upload/upload.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@Injectable()
export class TagService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly uploadService: UploadService,
    ) { }

    async create(createTagDto: CreateTagDto, user: PessoaFromJwt) {

        let uploadId: number | null = null;
        if (createTagDto.upload_icone) {
            uploadId = this.uploadService.checkUploadToken(createTagDto.upload_icone);
        }
        delete createTagDto.upload_icone;

        console.log(createTagDto);

        const created = await this.prisma.tag.create({
            data: {
                criado_por: user.id,
                criado_em: new Date(Date.now()),
                ...createTagDto,
                arquivo_icone_id: uploadId
            },
            select: { id: true }
        });

        return created;
    }

    async findAll() {
        let listActive = await this.prisma.tag.findMany({
            where: {
                removido_em: null,
            },
            select: {
                id: true,
                descricao: true,
                pdm_id: true,
                ods_id: true,
                icone: true,
                arquivo_icone_id: true
            }
        });

        for (const item of listActive) {
            if (item.arquivo_icone_id)
                item.icone = this.uploadService.getDownloadToken(item.arquivo_icone_id, '1 days').download_token;
        }

        return listActive;
    }

    async update(id: number, updateTagDto: UpdateTagDto, user: PessoaFromJwt) {
        let uploadId: number | undefined = undefined;
        if (updateTagDto.upload_icone) {
            uploadId = this.uploadService.checkUploadToken(updateTagDto.upload_icone);
        }
        delete updateTagDto.upload_icone;

        await this.prisma.tag.update({
            where: { id: id },
            data: {
                atualizado_por: user.id,
                atualizado_em: new Date(Date.now()),
                ...updateTagDto,
                arquivo_icone_id: uploadId
            }
        });

        return { id };
    }

    async remove(id: number, user: PessoaFromJwt) {
        const created = await this.prisma.tag.updateMany({
            where: { id: id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            }
        });

        return created;
    }
}
