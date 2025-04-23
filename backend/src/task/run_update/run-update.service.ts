import { forwardRef, HttpException, Inject, Injectable, Logger } from '@nestjs/common';
import { TaskableService } from '../entities/task.entity';
import { CreateRunUpdateDto, UpdateOperacaoDto } from './dto/create-run-update.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, TipoAtualizacaoEmLote, TipoProjeto } from '@prisma/client';
import { ProjetoService } from 'src/pp/projeto/projeto.service';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { UpdateProjetoDto } from 'src/pp/projeto/dto/update-projeto.dto';
import { ReadOnlyBooleanType } from 'src/common/TypeReadOnly';
import { PessoaService } from 'src/pessoa/pessoa.service';

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

export interface LogResultados {
    falhas: {
        id: number;
        nome: string;
        tipo: string;
        col: string;
        erro: string;
    }[];
}

@Injectable()
export class RunUpdateTaskService implements TaskableService {
    private readonly logger = new Logger(RunUpdateTaskService.name);

    constructor(
        private readonly prisma: PrismaService,
        @Inject(forwardRef(() => ProjetoService)) private readonly projetoService: ProjetoService,
        @Inject(forwardRef(() => PessoaService)) private readonly pessoaService: PessoaService
    ) {}

    async executeJob(_params: CreateRunUpdateDto, taskId: string): Promise<any> {
        this.logger.log(`Executing bulk update task. Task ID: ${taskId}`);

        // Apenas atualizações em lote pendentes.
        const atualizacaoEmLote = await this.prisma.atualizacaoEmLote.findUnique({
            where: { id: _params.atualizacao_em_lote_id, status: 'Pendente' },
        });
        if (!atualizacaoEmLote) throw new Error('Batch update not found or already processed');

        await this.prisma.atualizacaoEmLote.update({
            where: { id: _params.atualizacao_em_lote_id },
            data: { status: 'Executando', iniciou_em: new Date() },
        });

        // Iniciando sessão com contexto do usuário que criou.
        const pessoaJwt = await this.pessoaService.reportPessoaFromJwt(
            atualizacaoEmLote.criado_por_id,
            atualizacaoEmLote.modulo_sistema
        );

        let n_sucesso = 0;
        let n_erro = 0;
        const sucesso_ids = [];
        const results_log: LogResultados = { falhas: [] };

        // O serviço é definido de maneira dinâmica, dependendo do tipo de atualização.
        const service = this.servicoDoTipo(_params.tipo);

        for (const id of _params.ids) {
            try {
                // Cada row possui sua própia tx
                await this.prisma.$transaction(async (prismaTxn) => {
                    let operacaoFalhou = false;

                    // Buscando título/nome da linha para logs.
                    const paramsBusca = this.preparaParamsParaFindOne(_params.tipo);
                    const registro = await service.findOne(paramsBusca.tipo, id, pessoaJwt, 'ReadWrite');

                    for (const operacao of _params.ops) {
                        const params = this.preparaParamsParaOp(_params.tipo, operacao);

                        try {
                            // AVISO: SEMPRE GARANTIR QUE O MÉTODO UPDATE RECEBE TX DO PRISMA.
                            await service.update(params.tipo, id, params.dto, pessoaJwt, prismaTxn);
                        } catch (error) {
                            // TODO: implementar ordem de prioridade para cada tipo de row.
                            const nome: string =
                                (registro?.nome as string) ||
                                (registro?.titulo as string) ||
                                (registro?.descricao as string) ||
                                'Nome não identificado';

                            operacaoFalhou = true;
                            this.adicionarLogErro(error, id, nome, operacao, results_log);
                            break;
                        }
                    }

                    if (operacaoFalhou) {
                        throw new Error(`Rollback transaction for ID ${id}`);
                    }
                });

                n_sucesso++;
                sucesso_ids.push(id);
            } catch (error) {
                n_erro++;
                if (n_erro >= 50) {
                    await this.finalizarAtualizacaoEmLote(_params, results_log, n_sucesso, n_erro, sucesso_ids);
                    throw new Error('Error limit reached (50 errors)');
                }
            }
        }

        await this.finalizarAtualizacaoEmLote(_params, results_log, n_sucesso, n_erro, sucesso_ids);

        return { success: true };
    }

    private adicionarLogErro(
        error: any,
        id: number,
        nome: string,
        operacao: UpdateOperacaoDto,
        results_log: LogResultados
    ) {
        if (error instanceof HttpException) {
            const errorResponse = error.getResponse().toString();
            results_log.falhas.push({
                id,
                nome,
                tipo: 'Exception',
                col: operacao.col,
                erro: errorResponse.includes('|') ? errorResponse.split('|')[1] : errorResponse,
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

    private async finalizarAtualizacaoEmLote(
        params: CreateRunUpdateDto,
        results_log: LogResultados,
        n_sucesso: number,
        n_erro: number,
        sucesso_ids: number[]
    ) {
        const status = n_erro > 0 ? (n_sucesso > 0 ? 'ConcluidoParcialmente' : 'Falhou') : 'Concluido';

        await this.prisma.atualizacaoEmLote.update({
            where: { id: params.atualizacao_em_lote_id },
            data: {
                status,
                results_log: JSON.stringify(results_log),
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

        let value = op.valor;

        // Caso o valor se pareça com uma data (YYYY-MM-DD), convertemos para Date.
        if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
            value = new Date(value);
        }

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

    private preparaParamsParaFindOne(tipoAtualizacao: TipoAtualizacaoEmLote) {
        const params: any = {};

        switch (tipoAtualizacao) {
            case TipoAtualizacaoEmLote.ProjetoPP:
            case TipoAtualizacaoEmLote.ProjetoMDO: {
                params['tipo'] = tipoAtualizacao === TipoAtualizacaoEmLote.ProjetoPP ? 'PP' : ('MDO' as TipoProjeto);
                break;
            }
            default:
                throw new Error(`Tipo de atualização não suportado: ${tipoAtualizacao}`);
        }

        return params;
    }
}
