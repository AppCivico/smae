import { forwardRef, HttpException, Inject, Injectable, Logger } from '@nestjs/common';
import { TaskableService } from '../entities/task.entity';
import { CreateRunUpdateDto, UpdateOperacaoDto } from './dto/create-run-update.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, TipoAtualizacaoEmLote, TipoProjeto } from '@prisma/client';
import { ProjetoService } from 'src/pp/projeto/projeto.service';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { UpdateProjetoDto } from 'src/pp/projeto/dto/update-projeto.dto';
import { plainToInstance } from 'class-transformer';
import { ReadOnlyBooleanType } from 'src/common/TypeReadOnly';

export interface UpdateService {
    update(
        tipo: any,
        id: number,
        dto: any,
        user: PessoaFromJwt,
        prismaTx?: Prisma.TransactionClient
    ): Promise<RecordWithId>;
    findOne(tipo: any, id: number, user: PessoaFromJwt, readonly: ReadOnlyBooleanType): Promise<any>;
}

@Injectable()
export class RunUpdateTaskService implements TaskableService {
    private readonly logger = new Logger(RunUpdateTaskService.name);

    constructor(
        private readonly prisma: PrismaService,
        @Inject(forwardRef(() => ProjetoService)) private readonly projetoService: ProjetoService
    ) {}

    async executeJob(_params: CreateRunUpdateDto, taskId: string): Promise<any> {
        this.logger.log(`Executing bulk update task. Task ID: ${taskId}`);

        // Verify batch update exists and is pending
        const batchUpdate = await this.prisma.atualizacaoEmLote.findUnique({
            where: { id: _params.atualizacao_em_lote_id, status: 'Pendente' },
        });
        if (!batchUpdate) throw new Error('Batch update not found or already processed');

        // Update status to 'Executing'
        await this.prisma.atualizacaoEmLote.update({
            where: { id: _params.atualizacao_em_lote_id },
            data: { status: 'Executando', iniciou_em: new Date() },
        });

        const results_log = { falhas: [] };
        let n_sucesso = 0;
        let n_erro = 0;
        const sucesso_ids = [];
        const user = plainToInstance(PessoaFromJwt, _params.user);
        const service = this.servicoDoTipo(_params.tipo);

        for (const id of _params.ids) {
            try {
                // Process each ID in its own transaction
                await this.prisma.$transaction(async (prismaTxn) => {
                    let operationFailed = false;

                    for (const operacao of _params.ops) {
                        const params = this.preparaParamsParaOp(_params.tipo, operacao);

                        try {
                            // Pass transactional client to service
                            await service.update(params.tipo, id, params.dto, user, prismaTxn);
                        } catch (error) {
                            // Buscando título/nome da linha para logs.
                            const registro = await service.findOne(params.tipo, id, user, 'ReadWrite');
                            // TODO: implementar ordem de prioridade para cada tipo de row.
                            const nome =
                                registro.nome || registro.titulo || registro.descricao || 'Nome não identificado';

                            operationFailed = true;
                            this.handleOperationError(error, id, nome, operacao, results_log);
                            break; // Stop processing other operations for this ID
                        }
                    }

                    if (operationFailed) {
                        throw new Error(`Rollback transaction for ID ${id}`);
                    }
                });

                // Only count as success if transaction committed
                n_sucesso++;
                sucesso_ids.push(id);
            } catch (error) {
                n_erro++;
                if (n_erro >= 50) {
                    await this.finalizeBatchUpdate(_params, results_log, n_sucesso, n_erro, sucesso_ids);
                    throw new Error('Error limit reached (50 errors)');
                }
            }
        }

        // Finalize batch update status
        await this.finalizeBatchUpdate(_params, results_log, n_sucesso, n_erro, sucesso_ids);

        return { success: true };
    }

    private handleOperationError(error: any, id: number, nome: string, operacao: UpdateOperacaoDto, results_log: any) {
        if (error instanceof HttpException) {
            results_log.falhas.push({
                id,
                nome,
                tipo: 'Exception',
                col: operacao.col,
                // Geralmente erros de exception possuem o formato `$field| erro`.
                // Para facilitar leitura vamos remover tudo que vem antes do pipe. e também o pipe.
                erro: error.getResponse().toString().split('|')[1],
            });
        } else {
            results_log.falhas.push({
                id,
                nome,
                tipo: 'Internal',
                col: operacao.col,
                erro: 'Erro interno',
            });
        }
    }

    private async finalizeBatchUpdate(
        params: CreateRunUpdateDto,
        results_log: any,
        n_sucesso: number,
        n_erro: number,
        sucesso_ids: number[]
    ) {
        const status = n_erro > 0 ? (n_sucesso > 0 ? 'ConcluidoParcialmente' : 'Falhou') : 'Concluido';

        await this.prisma.atualizacaoEmLote.update({
            where: { id: params.atualizacao_em_lote_id },
            data: {
                status,
                results_log,
                n_sucesso,
                n_erro,
                n_ignorado: params.ids.length - n_sucesso - n_erro,
                sucesso_ids,
                terminou_em: new Date(),
            },
        });
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
