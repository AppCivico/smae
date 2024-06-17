import { HttpException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DiretorioDto, DiretorioItemDto, FilterDiretorioDto } from './dto/diretorio.dto';

@Injectable()
export class UploadDiretorioService {
    constructor(private readonly prisma: PrismaService) {}

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
        await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient) => {
                const dirExiting = new Set<string>();

                const dbRows = await prismaTx.diretorio.findMany({
                    where: {
                        projeto_id: dto.projeto_id,
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

                await this.removeFilhos(prismaTx, self.caminho);
            },
            {
                isolationLevel: 'Serializable',
            }
        );
    }

    private async removeFilhos(prismaTx: Prisma.TransactionClient, path: string): Promise<void> {
        const dirToRemove = await prismaTx.diretorio.findMany({
            where: {
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
