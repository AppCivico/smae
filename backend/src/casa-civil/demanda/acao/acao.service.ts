import { forwardRef, HttpException, Inject, Injectable } from '@nestjs/common';
import { DemandaSituacao, DemandaStatus, Prisma } from '@prisma/client';
import { PessoaFromJwt } from '../../../auth/models/PessoaFromJwt';
import { CacheKVService } from '../../../common/services/cache-kv.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { TaskService } from '../../../task/task.service';
import { DemandaService } from '../demanda.service';
import { CreateDemandaAcaoDto } from './dto/acao.dto';

@Injectable()
export class DemandaAcaoService {
    constructor(
        private readonly prisma: PrismaService,
        @Inject(forwardRef(() => DemandaService)) private readonly demandaService: DemandaService,
        @Inject(forwardRef(() => TaskService)) private readonly taskService: TaskService,
        private readonly cacheKvService: CacheKVService
    ) {}

    async create(dto: CreateDemandaAcaoDto, user: PessoaFromJwt) {
        try {
            dto.validaDependencias();
        } catch (error: any) {
            throw new HttpException(error.message, 400);
        }

        // Apenas testa se pode ler, pois a ação será testado abaixo
        const demanda = await this.demandaService.findOne(dto.demanda_id, user, 'ReadOnly');

        if (!dto.podeExecutar(demanda.permissoes)) {
            throw new HttpException(`Não é possível executar ação ${dto.acao} no momento`, 400);
        }

        // Se a ação for 'editar', apenas atualiza os dados sem mudar o status
        if (dto.acao === 'editar') {
            if (!dto.edicao) {
                throw new HttpException('Dados de edição são obrigatórios para a ação editar', 400);
            }
            // Executa a atualização (sem mudança de status)
            return this.demandaService.update(dto.demanda_id, dto.edicao, user);
        }

        // Para outras ações (enviar, validar, devolver, cancelar)
        const transition = dto.fsmState(demanda.status);
        if (!transition)
            throw new HttpException(`Ação ${dto.acao} não pode ser executada no status atual: ${demanda.status}`, 400);

        // Se houver dados de edição e o usuário tiver permissão para editar, executa ambos em uma transação
        if (dto.edicao && demanda.permissoes.pode_editar) {
            return this.prisma.$transaction(
                async (prismaTxn: Prisma.TransactionClient) => {
                    // Primeiro atualiza os dados
                    await this.demandaService.update(dto.demanda_id, dto.edicao!, user, prismaTxn);

                    // Depois executa a mudança de status
                    return this.demandaService.changeStatus(
                        dto.demanda_id,
                        user,
                        transition.from,
                        transition.to,
                        dto.motivo || null,
                        dto.acao === 'cancelar' ? DemandaSituacao.Cancelada : undefined,
                        prismaTxn
                    );
                },
                {
                    isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
                    maxWait: 15000,
                    timeout: 30000,
                }
            );
        }

        // Sem edição, apenas executa a mudança de status
        const result = await this.demandaService.changeStatus(
            dto.demanda_id,
            user,
            transition.from,
            transition.to,
            dto.motivo || null,
            dto.acao === 'cancelar' ? DemandaSituacao.Cancelada : undefined
        );

        if (transition.to === DemandaStatus.Publicado || transition.from === DemandaStatus.Publicado) {
            // Só marca como deletado no cache se for cancelar
            if (dto.acao === 'cancelar') {
                await this.cacheKvService.setDeleted(`demandas:${dto.demanda_id}`);
            }

            // Precisa atualizar a listagem
            await this.taskService.create(
                {
                    type: 'refresh_demanda',
                    params: { force_all: true },
                },
                user
            );
        }

        return result;
    }
}
