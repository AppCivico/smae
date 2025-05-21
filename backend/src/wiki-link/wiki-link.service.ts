import { Injectable, HttpException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateWikiLinkDto } from './dto/create-wiki-link.dto';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { ListWikiLinkDto } from './dto/list-wiki-link.dto';
import { WikiUrlDto } from './dto/wiki-url.dto';
import { UpdateWikiLinkDto } from './dto/update-wiki-link.dto';

@Injectable()
export class WikiLinkService {
    constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreateWikiLinkDto, user?: PessoaFromJwt): Promise<RecordWithId> {
        const exists = await this.prisma.wikiLink.count({
            where: {
                chave_smae: { equals: dto.chave_smae, mode: 'insensitive' },
                removido_em: null,
            },
        });

        if (exists > 0) {
            throw new HttpException('Chave SMAE| Nome igual ou semelhante já existe em outro registro ativo', 400);
        }

        return this.prisma.wikiLink.create({
            data: {
                chave_smae: dto.chave_smae,
                url_wiki: dto.url_wiki,
                criado_por: user ? user.id : undefined,
                criado_em: new Date(Date.now()),
            },
            select: {
                id: true,
            },
        });
    }

    async findByUrl(chave_smae: string): Promise<WikiUrlDto | null> {
        return this.prisma.wikiLink.findFirst({
            where: {
                chave_smae: { equals: chave_smae, mode: 'insensitive' },
                removido_em: null,
            },
            select: {
                url_wiki: true,
            },
        });
    }

    async findAll(): Promise<ListWikiLinkDto[]> {
        const results = await this.prisma.wikiLink.findMany({
            where: { removido_em: null },
            select: {
                chave_smae: true,
                url_wiki: true,
            },
            orderBy: {
                chave_smae: 'asc',
            },
        });

        return results;
    }

    async update(id: number, dto: UpdateWikiLinkDto, user: PessoaFromJwt): Promise<RecordWithId> {
        await this.prisma.wikiLink.update({
            where: { id },
            data: {
                ...dto,
                atualizado_por: user.id,
                atualizado_em: new Date(),
            },
        });
        return { id };
    }

    async remove(id: number, user: PessoaFromJwt): Promise<void> {
        await this.prisma.wikiLink.update({
            where: { id },
            data: {
                removido_por: user.id,
                removido_em: new Date(),
            },
        });
    }
}
