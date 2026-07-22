import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { EquipeRespService } from '../equipe-resp/equipe-resp.service';
import { PrismaService } from '../prisma/prisma.service';
import { RecalcEquipeResumoDto } from './dto/recalc-equipe-resumo.dto';

@Injectable()
export class PessoaUtilsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly equipeRespService: EquipeRespService
    ) {}

    async recalculaEquipeTodasPessoas(): Promise<RecalcEquipeResumoDto> {
        const logger = new Logger('PessoaUtilsService');
        logger.log('Iniciando recálculo de equipes para todas as pessoas...');

        return await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecalcEquipeResumoDto> => {
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

                const resumo: RecalcEquipeResumoDto = {
                    total_pessoas: pessoas.length,
                    pessoas_processadas: 0,
                    pessoas_puladas_sem_orgao: 0,
                    pessoas_com_correcao: 0,
                    pessoas_com_correcao_equipe: 0,
                    pessoas_com_correcao_perfil: 0,
                    equipes_adicionadas: 0,
                    equipes_removidas: 0,
                    pessoas_afetadas: [],
                };

                for (const pessoa of pessoas) {
                    if (!pessoa.pessoa_fisica?.orgao_id) {
                        logger.warn(`Pessoa ${pessoa.id} não possui órgão, pulando...`);
                        resumo.pessoas_puladas_sem_orgao++;
                        continue;
                    }

                    const equipes = pessoa.GrupoResponsavelEquipePessoa.map((e) => e.grupo_responsavel_equipe_id);

                    try {
                        const { teamsAdded, teamsRemoved, perfisChanged } =
                            await this.equipeRespService.atualizaEquipe(
                                pessoa.id,
                                equipes,
                                prismaTx,
                                pessoa.pessoa_fisica.orgao_id
                            );
                        resumo.pessoas_processadas++;

                        const equipeCorrigida = teamsAdded > 0 || teamsRemoved > 0;
                        if (equipeCorrigida) resumo.pessoas_com_correcao_equipe++;
                        if (perfisChanged) resumo.pessoas_com_correcao_perfil++;

                        resumo.equipes_adicionadas += teamsAdded;
                        resumo.equipes_removidas += teamsRemoved;

                        if (equipeCorrigida || perfisChanged) {
                            resumo.pessoas_com_correcao++;
                            resumo.pessoas_afetadas.push({
                                pessoa_id: pessoa.id,
                                equipes_adicionadas: teamsAdded,
                                equipes_removidas: teamsRemoved,
                                perfil_alterado: perfisChanged,
                            });
                        }

                        logger.debug(`Pessoa ${pessoa.id} atualizada com sucesso`);
                    } catch (error) {
                        logger.error(`Erro ao atualizar pessoa ${pessoa.id}: ${error.message}`);
                        throw error;
                    }
                }

                logger.log(
                    `Recálculo de equipes finalizado com sucesso. ${resumo.pessoas_com_correcao} de ${resumo.total_pessoas} pessoa(s) corrigida(s).`
                );

                return resumo;
            },
            {
                timeout: 60000,
                maxWait: 60000,
                isolationLevel: 'Serializable',
            }
        );
    }
}
