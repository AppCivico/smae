import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { EquipeRespService } from '../equipe-resp/equipe-resp.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PessoaUtilsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly equipeRespService: EquipeRespService
    ) {}

    async recalculaEquipeTodasPessoas() {
        const logger = new Logger('PessoaUtilsService');
        logger.log('Iniciando recálculo de equipes para todas as pessoas...');

        return await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient) => {
                // Get all active pessoas with their current teams
                const pessoas = await prismaTx.pessoa.findMany({
                    where: {
                        desativado: false,
                        pessoa_fisica: { isNot: null },
                    },
                    select: {
                        id: true,
                        pessoa_fisica: {
                            select: { orgao_id: true },
                        },
                        GrupoResponsavelEquipePessoa: {
                            where: { removido_em: null },
                            select: {
                                grupo_responsavel_equipe_id: true,
                            },
                        },
                    },
                });

                logger.log(`Encontradas ${pessoas.length} pessoas para processar`);

                for (const pessoa of pessoas) {
                    if (!pessoa.pessoa_fisica?.orgao_id) {
                        logger.warn(`Pessoa ${pessoa.id} não possui órgão, pulando...`);
                        continue;
                    }

                    const equipes = pessoa.GrupoResponsavelEquipePessoa.map((e) => e.grupo_responsavel_equipe_id);

                    try {
                        await this.equipeRespService.atualizaEquipe(
                            pessoa.id,
                            equipes,
                            prismaTx,
                            pessoa.pessoa_fisica.orgao_id
                        );
                        logger.debug(`Pessoa ${pessoa.id} atualizada com sucesso`);
                    } catch (error) {
                        logger.error(`Erro ao atualizar pessoa ${pessoa.id}: ${error.message}`);
                        throw error;
                    }
                }

                logger.log('Recálculo de equipes finalizado com sucesso');
            },
            {
                timeout: 60000,
                maxWait: 60000,
                isolationLevel: 'Serializable',
            }
        );
    }
}
