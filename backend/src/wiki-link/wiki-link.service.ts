import { Injectable, HttpException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateWikiLinkDto } from './dto/create-wiki-link.dto';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { ListWikiLinkDto } from './dto/list-wiki-link.dto';
import { WikiUrlDto } from './dto/wiki-url.dto';
import { UpdateWikiLinkDto } from './dto/update-wiki-link.dto';
import { WikiLinkDto } from './dto/wiki-link.dto';

@Injectable()
export class WikiLinkService {
    constructor(private readonly prisma: PrismaService) {}

    private async getWikiPrefix(): Promise<string> {
        const config = await this.prisma.smaeConfig.findUnique({
            where: { key: 'WIKI_PREFIX' },
            select: { value: true },
        });
        if (!config?.value) throw new HttpException('Wiki prefix not configured', 500);

        return config.value;
    }

    private normalizeWikiUrl(url: string): string {
        // Remove leading slash if present
        return url.startsWith('/') ? url.substring(1) : url;
    }

    private async validateWikiUrl(url: string): Promise<void> {
        const prefix = await this.getWikiPrefix();
        const normalizedUrl = this.normalizeWikiUrl(url);
        const fullUrl = `${prefix}${normalizedUrl}`;

        try {
            new URL(fullUrl);
        } catch (error) {
            throw new HttpException('URL da wiki inválida quando combinada com o prefixo configurado', 400);
        }
    }

    async create(dto: CreateWikiLinkDto, user?: PessoaFromJwt): Promise<RecordWithId> {
        // Validate and normalize the URL
        await this.validateWikiUrl(dto.url_wiki);
        const normalizedUrl = this.normalizeWikiUrl(dto.url_wiki);

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
                url_wiki: normalizedUrl,
                criado_por: user ? user.id : undefined,
                criado_em: new Date(Date.now()),
            },
            select: {
                id: true,
            },
        });
    }

    async findByUrl(dto: WikiLinkDto): Promise<WikiUrlDto | null> {
        return this.prisma.wikiLink.findFirst({
            where: {
                chave_smae: { equals: dto.chave_smae, mode: 'insensitive' },
                removido_em: null,
            },
            select: {
                chave_smae: true,
                url_wiki: true,
            },
        });
    }

    async findAll(): Promise<ListWikiLinkDto[]> {
        const prefix = await this.getWikiPrefix();

        const results = await this.prisma.wikiLink.findMany({
            where: { removido_em: null },
            select: {
                chave_smae: true,
                url_wiki: true,
            },
            orderBy: { chave_smae: 'asc' },
        });

        return results.map((item) => ({
            chave_smae: item.chave_smae,
            url_wiki: `${prefix}${item.url_wiki}`,
        }));
    }

    async update(id: number, dto: UpdateWikiLinkDto, user: PessoaFromJwt): Promise<RecordWithId> {
        // Validate and normalize the URL
        await this.validateWikiUrl(dto.url_wiki);
        const normalizedUrl = this.normalizeWikiUrl(dto.url_wiki);

        await this.prisma.wikiLink.update({
            where: { id },
            data: {
                url_wiki: normalizedUrl,
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
