import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { TaskableService } from '../entities/task.entity';
import { CreateRunUpdateDto, UpdateOperacaoDto } from './dto/create-run-update.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, TipoAtualizacaoEmLote, TipoProjeto } from '@prisma/client';
import { ProjetoService } from 'src/pp/projeto/projeto.service';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { UpdateProjetoDto } from 'src/pp/projeto/dto/update-projeto.dto';
import { plainToInstance } from 'class-transformer';

export interface UpdateService {
    update(tipo: any, id: number, dto: any, user: PessoaFromJwt): Promise<RecordWithId>;
}

@Injectable()
export class RunUpdateTaskService implements TaskableService {
    private readonly logger = new Logger(RunUpdateTaskService.name);

    constructor(
        private readonly prisma: PrismaService,
        @Inject(forwardRef(() => ProjetoService)) private readonly projetoService: ProjetoService
    ) {}

    async executeJob(_params: CreateRunUpdateDto, taskId: string): Promise<any> {
        this.logger.log(
            `Executando tarefa de atualização em lote. Task ID: ${taskId}, Atualização ID: ${_params.atualizacao_em_lote_id}`
        );

        const atualizacaoEmLote = await this.prisma.atualizacaoEmLote.findUnique({
            where: {
                id: _params.atualizacao_em_lote_id,
                status: 'Pendente',
            },
            select: {
                id: true,
            },
        });
        if (!atualizacaoEmLote) {
            throw new Error(`Atualização em lote não encontrada ou já processada.`);
        }

        const user = plainToInstance(PessoaFromJwt, _params.user);

        // Atualizando status da atualização em lote para 'Executando'
        await this.prisma.atualizacaoEmLote.update({
            where: { id: _params.atualizacao_em_lote_id },
            data: {
                status: 'Executando',
                iniciou_em: new Date(Date.now()),
            },
        });

        const results_log: {
            falhas: { id?: number; erro: any }[];
        } = {
            falhas: [],
        };

        try {
            // Abrindo transaction
            await this.prisma.$transaction(async (prismaTxn: Prisma.TransactionClient) => {
                // Definindo service apropriado.
                const service = this.servicoDoTipo(_params.tipo);

                // Colunas que serão utilizadas para controle e estatísticas.
                let n_sucesso = 0;
                let n_erro = 0;
                let n_ignorado = 0;

                const sucesso_ids = [];

                for (const operacao of _params.ops) {
                    for (const id of _params.ids) {
                        try {
                            const params = this.preparaParamsParaOp(_params.tipo, operacao);

                            await service.update(params.tipo, id, params.dto, user);

                            this.logger.log(`Operação ${operacao.col} executada com sucesso para ID ${id}.`);

                            n_sucesso++;
                            sucesso_ids.push(id);
                        } catch (error) {
                            this.logger.error(
                                `Erro ao executar SET para coluna "${operacao.col}" para ID ${id}: ${error}`
                            );
                            n_erro++;

                            results_log.falhas.push({ id, erro: error.message });

                            // Caso chegue em 50 erros. Interrompe a execução e marca como falha no processamento.
                            if (n_erro == 50) {
                                throw new Error(
                                    `Limite de erros atingido! Erro ao executar SET para coluna "${operacao.col}" para ID ${id}: ${error}`
                                );
                            }
                        }
                    }
                }

                if (sucesso_ids.length == 0) throw new Error('Nenhum registro atualizado com sucesso.');

                // Atualizando status da atualização em lote.
                await prismaTxn.atualizacaoEmLote.update({
                    where: { id: _params.atualizacao_em_lote_id },
                    data: {
                        status: n_erro > 0 ? 'ConcluidoParcialmente' : 'Concluido',
                        results_log: results_log,
                        n_sucesso,
                        n_erro,
                        n_ignorado,
                        sucesso_ids,
                        terminou_em: new Date(Date.now()),
                    },
                });

                return { success: true };
            });
        } catch (error) {
            this.logger.error(`Erro ao executar tarefa de atualização em lote: ${error}`);

            await this.prisma.atualizacaoEmLote.update({
                where: { id: _params.atualizacao_em_lote_id },
                data: {
                    status: 'Falhou',
                    results_log: results_log,
                    terminou_em: new Date(Date.now()),
                },
            });

            throw error;
        }
    }

    outputToJson(executeOutput: any, _inputParams: any, _taskId: string): JSON {
        return JSON.stringify(executeOutput) as any;
    }

    private servicoDoTipo(tipo: TipoAtualizacaoEmLote) {
        let service: UpdateService | null = null;
        switch (tipo) {
            case TipoAtualizacaoEmLote.ProjetoMDO:
            case TipoAtualizacaoEmLote.ProjetoPP:
                service = this.projetoService;
                break;
        }
        if (!service) {
            throw new Error(`Serviço não encontrado para o tipo: ${tipo}`);
        }

        return service;
    }

    private preparaParamsParaOp(tipoAtualizacao: TipoAtualizacaoEmLote, op: UpdateOperacaoDto) {
        const params: any = {};

        const value = op.set;

        switch (tipoAtualizacao) {
            case TipoAtualizacaoEmLote.ProjetoPP:
            case TipoAtualizacaoEmLote.ProjetoMDO: {
                params['tipo'] = tipoAtualizacao === TipoAtualizacaoEmLote.ProjetoPP ? 'PP' : ('MDO' as TipoProjeto);
                const dto = {
                    [op.col]: value,
                } as UpdateProjetoDto;
                params['dto'] = dto;
                break;
            }
            default:
                throw new Error(`Tipo de atualização não suportado: ${tipoAtualizacao}`);
        }

        return params;
    }
}
