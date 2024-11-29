import { HttpException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DiretorioDto, DiretorioItemDto, FilterDiretorioDto } from './dto/diretorio.dto';
import { SmaeConfigService } from '../common/services/smae-config.service';

type DiretorioFields = {
    projeto_id?: number | null;
    transferencia_id?: number | null;
    pdm_id?: number | null;
};

@Injectable()
export class UploadDiretorioService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly smaeConfigService: SmaeConfigService
    ) {}

    private async createOrGetDirectory(
        createdDirectories: Set<string>,
        prismaTx: Prisma.TransactionClient,
        path: string,
        dto: DiretorioDto
    ): Promise<void> {
        if (!createdDirectories.has(path)) {
            await prismaTx.diretorio.create({
                data: {
                    caminho: path,
                    projeto_id: dto.projeto_id,
                    transferencia_id: dto.transferencia_id,
                    pdm_id: dto.pdm_id,
                },
            });

            createdDirectories.add(path);
        }
    }

    async create(dto: DiretorioDto): Promise<void> {
        this.verificaMutualidade(dto);

        await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient) => {
                const dirExiting = new Set<string>();

                const dbRows = await prismaTx.diretorio.findMany({
                    where: {
                        projeto_id: dto.projeto_id,
                        transferencia_id: dto.transferencia_id,
                        pdm_id: dto.pdm_id,
                    },
                    select: {
                        caminho: true,
                    },
                });

                for (const dir of dbRows) {
                    dirExiting.add(dir.caminho);
                }

                let clean = this.normalizaCaminho(dto.caminho);
                clean = clean.substring(0, clean.length - 1); //tira a barra do final
                const parts = clean.split('/');
                let currentPath = '';

                for (const part of parts) {
                    currentPath += `${part}/`;
                    await this.createOrGetDirectory(dirExiting, prismaTx, currentPath, dto);
                }
            },
            {
                isolationLevel: 'Serializable',
            }
        );
    }

    private verificaMutualidade(dto: DiretorioFields) {
        if (
            (dto.projeto_id && dto.transferencia_id) ||
            (dto.projeto_id && dto.pdm_id) ||
            (dto.transferencia_id && dto.pdm_id)
        ) {
            throw new HttpException('Os campos projeto_id, transferencia_id e pdm_id são mutuamente exclusivos', 400);
        }

        // at least one of the fields must be filled
        if (!dto.projeto_id && !dto.transferencia_id && !dto.pdm_id)
            throw new HttpException(
                'Pelo menos um dos campos projeto_id, transferencia_id ou pdm_id deve ser preenchido',
                400
            );
    }

    normalizaCaminho(caminho: string): string {
        // Replace non-standard spaces with standard space (0x20)
        let cleanedPath = caminho.replace(/\s+/g, ' ');
        // Normalize Unicode expansion
        cleanedPath = cleanedPath.normalize('NFC');

        // Replace reserved or special characters
        cleanedPath = cleanedPath.replace(/[<>:"\\|?*]/g, '_');

        // Replace backslashes with forward slashes (for cross-platform compatibility)
        cleanedPath = cleanedPath.replace(/\\/g, '/');

        if (!cleanedPath.startsWith('/')) cleanedPath = '/' + cleanedPath;

        return cleanedPath.replace(/\/+/g, '/').replace(/\/+$/, '') + '/';
    }

    async listAll(filters: FilterDiretorioDto): Promise<DiretorioItemDto[]> {
        const desativado = await this.smaeConfigService.getConfig('DESATIVA_DIRETORIOS_FISICOS');
        if (desativado) {
            return [];
        }

        this.verificaMutualidade(filters);

        const linhas = await this.prisma.diretorio.findMany({
            where: {
                projeto_id: filters.projeto_id,
                transferencia_id: filters.transferencia_id,
                pdm_id: filters.pdm_id,
            },
            select: {
                id: true,
                caminho: true,
            },
        });

        return linhas;
    }

    async remove(id: number): Promise<void> {
        await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient) => {
                const self = await prismaTx.diretorio.findUnique({
                    where: { id: id },
                });

                if (!self)
                    throw new HttpException(`Diretório não encontrado, atualize a página e tente novamente.`, 404);

                await this.removeFilhos(prismaTx, self.caminho, {
                    projeto_id: self.projeto_id,
                    transferencia_id: self.transferencia_id,
                    pdm_id: self.pdm_id,
                });
            },
            {
                isolationLevel: 'Serializable',
            }
        );
    }

    private async removeFilhos(prismaTx: Prisma.TransactionClient, path: string, dto: DiretorioFields): Promise<void> {
        const dirToRemove = await prismaTx.diretorio.findMany({
            where: {
                projeto_id: dto.projeto_id,
                transferencia_id: dto.transferencia_id,
                pdm_id: dto.pdm_id,
                caminho: {
                    startsWith: path,
                },
            },
            select: {
                id: true,
                caminho: true,
            },
        });

        for (const directory of dirToRemove) {
            await prismaTx.diretorio.delete({
                where: {
                    id: directory.id,
                },
            });
        }
    }
}
