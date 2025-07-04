import { forwardRef, HttpException, Inject, Injectable, Logger } from '@nestjs/common';
import { Prisma, TipoAtualizacaoEmLote, TipoProjeto } from '@prisma/client';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { ReadOnlyBooleanType } from 'src/common/TypeReadOnly';
import { PessoaService } from 'src/pessoa/pessoa.service';
import { CreateTarefaDto } from 'src/pp/tarefa/dto/create-tarefa.dto';
import { TarefaService } from 'src/pp/tarefa/tarefa.service';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateProjetoDto } from 'src/pp/projeto/dto/update-projeto.dto';
import { ProjetoService } from 'src/pp/projeto/projeto.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UploadService } from 'src/upload/upload.service';
import { utils, write } from 'xlsx-js-style';

import { TaskableService } from '../entities/task.entity';
import { TaskContext } from '../task.context';
import { CreateRunUpdateDto, TipoOperacao, UpdateOperacaoDto } from './dto/create-run-update.dto';

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

export interface RegistroProcessamento {
    id: number;
    nome: string;
    status: 'OK' | 'Erro';
    mensagemErro?: string;
    registro?: any;
}

export interface LogResultadosEstendido extends LogResultados {
    registrosProcessados: RegistroProcessamento[];
}

@Injectable()
export class RunUpdateTaskService implements TaskableService {
    private readonly logger = new Logger(RunUpdateTaskService.name);

    constructor(
        private readonly prisma: PrismaService,
        @Inject(forwardRef(() => ProjetoService)) private readonly projetoService: ProjetoService,
        @Inject(forwardRef(() => PessoaService)) private readonly pessoaService: PessoaService,
        @Inject(forwardRef(() => TarefaService)) private readonly tarefaService: TarefaService,
        @Inject(forwardRef(() => UploadService)) private readonly uploadService: UploadService
    ) {}

    async executeJob(_params: CreateRunUpdateDto, taskId: string, context: TaskContext): Promise<any> {
        this.logger.log(`Executando tarefa de atualização em lote. ID da tarefa: ${taskId}`);

        // Apenas atualizações em lote pendentes.
        const atualizacaoEmLote = await this.prisma.atualizacaoEmLote.findUnique({
            where: {
                id: _params.atualizacao_em_lote_id,
                status: {
                    in: ['Pendente', 'ConcluidoParcialmente', 'Falhou', 'Abortado', 'Concluido'],
                },
            },
        });
        if (!atualizacaoEmLote) throw new Error('Atualização em lote não encontrada ou já processada');

        await this.prisma.atualizacaoEmLote.update({
            where: { id: _params.atualizacao_em_lote_id },
            data: { status: 'Executando', iniciou_em: new Date() },
        });

        // Iniciando sessão com contexto do usuário que criou.
        const pessoaJwt = await this.pessoaService.reportPessoaFromJwt(
            atualizacaoEmLote.criado_por_id,
            atualizacaoEmLote.modulo_sistema
        );

        let n_sucesso = atualizacaoEmLote.n_sucesso || 0;
        let n_erro = 0;
        const sucesso_ids = atualizacaoEmLote.sucesso_ids || [];

        // Carrega dados armazenados ou inicializa novos dados
        const resultadosEstendidos = await context.loadStashedData<LogResultadosEstendido>({
            falhas: [],
            registrosProcessados: [],
        });

        // O serviço é definido de maneira dinâmica, dependendo do tipo de atualização.
        const service = this.servicoDoTipo(_params.tipo);

        // Pré-processamento de operações para adicionar operações implícitas
        _params.ops = this.preprocessOps(_params.ops);

        try {
            for (const id of _params.ids) {
                // skip if already processed
                const registroProcessado = atualizacaoEmLote.sucesso_ids.find((r) => r === id);
                if (registroProcessado) {
                    continue;
                }

                try {
                    // Cada row possui sua própia tx
                    await this.prisma.$transaction(async (prismaTxn) => {
                        let operacaoFalhou = false;

                        // Buscando título/nome da linha para logs.
                        const paramsBusca = this.preparaParamsParaFindOne(_params.tipo);
                        const registro = await service.findOne(paramsBusca.tipo, id, pessoaJwt, 'ReadWrite');
                        // Armazena o registro no nosso log estendido
                        const registroProcessamento: RegistroProcessamento = {
                            id: id,
                            nome: registro?.nome || registro?.titulo || registro?.descricao || 'Nome não identificado',
                            status: 'OK',
                            registro: registro,
                        };

                        // Adiciona aos registros processados
                        resultadosEstendidos.registrosProcessados.push(registroProcessamento);
                        // Armazena dados após cada registro ser buscado
                        await context.stashData<LogResultadosEstendido>(resultadosEstendidos);

                        const paramsAtualizacao: any = { dto: {} };
                        const paramsCriacaoTarefa: any = {};

                        // Para cada coluna, armazenamos o estado atual
                        const estadoAtualColunas: Record<string, any> = {};

                        for (const operacao of _params.ops) {
                            try {
                                // Preparamos os parâmetros para esta operação
                                const params = await this.preparaParamsParaOp(
                                    _params.tipo,
                                    operacao,
                                    registro,
                                    estadoAtualColunas
                                );

                                // Adiciona valores do Dto desta operação no dto consolidado
                                if (operacao.tipo_operacao === TipoOperacao.CreateTarefa) {
                                    paramsCriacaoTarefa.dto = {
                                        ...params.dto,
                                    };
                                } else {
                                    // Atualiza o estado atual da coluna após esta operação
                                    Object.keys(params.dto).forEach((key) => {
                                        estadoAtualColunas[key] = params.dto[key];
                                        paramsAtualizacao.dto[key] = params.dto[key];
                                    });
                                }

                                // TODO: por agora, atualizações em lote são apenas para PP e MDO.
                                // E esses serviços necessitam do "tipo".
                                // Implementar solução mais genérica.
                                if (
                                    !paramsAtualizacao.tipo &&
                                    params.tipo &&
                                    operacao.tipo_operacao !== TipoOperacao.CreateTarefa
                                ) {
                                    paramsAtualizacao.tipo = params.tipo;
                                }
                            } catch (error) {
                                this.logger.error(`Erro ao processar operação ${operacao.col}: ${error.message}`);
                                throw error;
                            }
                        }

                        try {
                            // AVISO: SEMPRE GARANTIR QUE O MÉTODO UPDATE/CREATE RECEBE TX DO PRISMA.
                            if (Object.keys(paramsAtualizacao.dto).length > 0)
                                await service.update(
                                    paramsAtualizacao.tipo,
                                    id,
                                    paramsAtualizacao.dto,
                                    pessoaJwt,
                                    prismaTxn
                                );

                            if (paramsCriacaoTarefa.dto) {
                                // Por agora, a única entidade que é criada pela atualização em lote é a tarefa.
                                // Então utilizando direto o serviço.
                                // TODO?: Implementar interface para solução mais genérica.
                                await this.tarefaService.create({ projeto_id: id }, paramsCriacaoTarefa.dto, pessoaJwt);
                            }
                        } catch (error) {
                            this.logger.error(`Erro ao atualizar ID ${id}: ${error.message}`);

                            // TODO: implementar ordem de prioridade para cada tipo de row.
                            const nome: string =
                                (registro?.nome as string) ||
                                (registro?.titulo as string) ||
                                (registro?.descricao as string) ||
                                'Nome não identificado';

                            operacaoFalhou = true;
                            this.adicionarLogErro(error, id, nome, resultadosEstendidos);

                            // Atualiza o status do registro de processamento
                            const indiceRegistro = resultadosEstendidos.registrosProcessados.findIndex(
                                (r) => r.id === id
                            );
                            if (indiceRegistro >= 0) {
                                resultadosEstendidos.registrosProcessados[indiceRegistro].status = 'Erro';
                                resultadosEstendidos.registrosProcessados[indiceRegistro].mensagemErro =
                                    error instanceof HttpException ? error.getResponse().toString() : 'Erro interno';
                                await context.stashData<LogResultadosEstendido>(resultadosEstendidos);
                            }
                        }

                        if (operacaoFalhou) {
                            throw new Error(`Rollback da transação para o ID ${id}`);
                        }
                    });

                    n_sucesso++;
                    sucesso_ids.push(id);

                    // Atualiza nossos dados armazenados após cada operação bem-sucedida
                    await context.stashData<LogResultadosEstendido>(resultadosEstendidos);
                } catch (error) {
                    this.logger.error(`Erro ao atualizar ID ${id}: ${error.message}`);
                    n_erro++;

                    // Se o erro não foi capturado anteriormente (por exemplo, falha na transação antes de obtermos o registro)
                    const indiceRegistro = resultadosEstendidos.registrosProcessados.findIndex((r) => r.id === id);
                    if (indiceRegistro === -1) {
                        resultadosEstendidos.registrosProcessados.push({
                            id: id,
                            nome: 'Registro não acessado',
                            status: 'Erro',
                            mensagemErro: error.message || 'Erro não capturado',
                        });
                    } else if (resultadosEstendidos.registrosProcessados[indiceRegistro].status !== 'Erro') {
                        resultadosEstendidos.registrosProcessados[indiceRegistro].status = 'Erro';
                        resultadosEstendidos.registrosProcessados[indiceRegistro].mensagemErro =
                            error.message || 'Erro não capturado';
                    }

                    await context.stashData<LogResultadosEstendido>(resultadosEstendidos);

                    if (n_erro >= 50) {
                        // Gera relatórios antes de sair devido ao limite de erros
                        await this.gerarRelatorioExcel(_params, resultadosEstendidos, pessoaJwt);
                        await this.finalizarAtualizacaoEmLote(
                            _params,
                            resultadosEstendidos,
                            n_sucesso,
                            n_erro,
                            sucesso_ids
                        );
                        throw new Error('Limite de erros atingido (50 erros)');
                    }
                }
            }

            // Gera relatório Excel ao final da execução bem-sucedida
            await this.gerarRelatorioExcel(_params, resultadosEstendidos, pessoaJwt);
            await this.finalizarAtualizacaoEmLote(_params, resultadosEstendidos, n_sucesso, n_erro, sucesso_ids);
        } catch (error) {
            // Se houver um erro não capturado, ainda tente gerar relatório e finalizar
            try {
                await this.gerarRelatorioExcel(_params, resultadosEstendidos, pessoaJwt);
                await this.finalizarAtualizacaoEmLote(_params, resultadosEstendidos, n_sucesso, n_erro, sucesso_ids);
            } catch (erroFinal) {
                this.logger.error(`Erro durante a finalização após falha: ${erroFinal.message}`);
            }
            throw error;
        }

        return { success: true };
    }

    // Novo método para pré-processar as operações e adicionar operações implícitas
    private preprocessOps(ops: UpdateOperacaoDto[]): UpdateOperacaoDto[] {
        // Cria uma cópia das operações originais
        const processedOps = [...ops];

        // Verifica se há uma operação Set para orgao_gestor_id
        const hasOrgaoGestorSet = ops.some(
            (op) => op.col === 'orgao_gestor_id' && op.tipo_operacao === TipoOperacao.Set
        );

        // Verifica se há alguma operação para responsaveis_no_orgao_gestor
        const hasResponsaveisOp = ops.some((op) => op.col === 'responsaveis_no_orgao_gestor');

        // Se temos um Set para orgao_gestor_id mas nenhuma operação para responsaveis_no_orgao_gestor,
        // adiciona uma operação Set para limpar responsaveis_no_orgao_gestor
        if (hasOrgaoGestorSet && !hasResponsaveisOp) {
            processedOps.push({
                col: 'responsaveis_no_orgao_gestor',
                tipo_operacao: TipoOperacao.Set,
                valor: [],
            });
        }

        // Verifica se há uma operação Set para orgao_responsavel_id
        const hasOrgaoResponsavelSet = ops.some(
            (op) => op.col === 'orgao_responsavel_id' && op.tipo_operacao === TipoOperacao.Set
        );

        // Verifica se há alguma operação para responsavel_id
        const hasResponsavelOp = ops.some((op) => op.col === 'responsavel_id');

        // Se temos um Set para orgao_responsavel_id mas nenhuma operação para responsavel_id,
        // adiciona uma operação Set para definir responsavel_id como null
        if (hasOrgaoResponsavelSet && !hasResponsavelOp) {
            processedOps.push({
                col: 'responsavel_id',
                tipo_operacao: TipoOperacao.Set,
                valor: null,
            });
        }

        return processedOps;
    }

    // Método para gerar relatório Excel
    private async gerarRelatorioExcel(
        params: CreateRunUpdateDto,
        resultados: LogResultadosEstendido,
        usuario: PessoaFromJwt
    ): Promise<void> {
        try {
            // Importações necessárias (considere adicionar no topo do arquivo)
            //

            // Cria novo workbook
            const workbook = utils.book_new();

            // Cria cabeçalhos para a planilha
            const cabecalhos = ['ID', 'Nome', 'Status', 'Mensagem de Erro', 'Versão Anterior'];
            const linhas = [cabecalhos];

            // Adiciona linhas de dados
            for (const registro of resultados.registrosProcessados) {
                linhas.push([
                    registro.id.toString(),
                    registro.nome,
                    registro.status,
                    registro.mensagemErro || '',
                    registro.registro ? JSON.stringify(registro.registro) : '',
                ]);
            }

            // Cria planilha a partir das linhas
            const planilha = utils.aoa_to_sheet(linhas);

            // Define larguras de coluna apropriadas
            const colunaLarguras = [
                { wch: 10 }, // ID - largura moderada
                { wch: 30 }, // Nome - coluna mais larga
                { wch: 15 }, // Status - largura média
                { wch: 50 }, // Mensagem de Erro - bem larga
                { wch: 100 }, // Detalhes do Registro - coluna mais larga
            ];
            planilha['!cols'] = colunaLarguras;

            // Configura formatação de células
            // Primeira linha (cabeçalhos) em negrito
            const range = utils.decode_range(planilha['!ref']!);
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const enderecoColuna = utils.encode_col(C);
                const enderecoCelula = enderecoColuna + '1';

                // Garante que a célula existe
                if (!planilha[enderecoCelula]) continue;

                // Configura estilo de cabeçalho em negrito com bordas
                planilha[enderecoCelula].s = {
                    font: { bold: true },
                    alignment: { vertical: 'center', horizontal: 'center' },
                    border: {
                        top: { style: 'thin' },
                        bottom: { style: 'thin' },
                        left: { style: 'thin' },
                        right: { style: 'thin' },
                    },
                };
            }

            // Configuração para todas as células de dados
            for (let R = 1; R <= range.e.r; ++R) {
                for (let C = 0; C <= range.e.c; ++C) {
                    const enderecoColuna = utils.encode_col(C);
                    const enderecoCelula = enderecoColuna + (R + 1);

                    // Pula se a célula não existir
                    if (!planilha[enderecoCelula]) continue;

                    // Inicializa o objeto de estilo com bordas em todas as células
                    const estiloCelula: any = {
                        alignment: { vertical: 'top', wrapText: false },
                        border: {
                            top: { style: 'thin' },
                            bottom: { style: 'thin' },
                            left: { style: 'thin' },
                            right: { style: 'thin' },
                        },
                    };

                    // Aplica estilos específicos por coluna
                    if (C === 0) {
                        // ID
                        estiloCelula.alignment.horizontal = 'center';
                    } else if (C === 1) {
                        // Nome
                        estiloCelula.alignment.wrapText = true;
                    } else if (C === 2) {
                        // Status
                        estiloCelula.alignment.horizontal = 'center';
                        // Adiciona cor de acordo com o status
                        const valorCelula = planilha[enderecoCelula].v;
                        if (valorCelula === 'OK') {
                            estiloCelula.fill = {
                                patternType: 'solid',
                                fgColor: { rgb: 'C6EFCE' }, // Verde claro
                            };
                            estiloCelula.font = {
                                color: { rgb: '006100' }, // Verde escuro
                                bold: true,
                            };
                        } else {
                            estiloCelula.fill = {
                                patternType: 'solid',
                                fgColor: { rgb: 'FFC7CE' }, // Vermelho claro
                            };
                            estiloCelula.font = {
                                color: { rgb: '9C0006' }, // Vermelho escuro
                                bold: true,
                            };
                        }
                    } else if (C === 3) {
                        // Mensagem de erro
                        estiloCelula.alignment.wrapText = true;
                    } else if (C === 4) {
                        // Detalhes do Registro (JSON)
                        estiloCelula.font = { name: 'Consolas', sz: 9 }; // Fonte monospace
                        estiloCelula.alignment.wrapText = false;
                    }

                    // Aplica o estilo à célula
                    planilha[enderecoCelula].s = estiloCelula;
                }
            }

            // Adiciona planilha ao workbook
            utils.book_append_sheet(workbook, planilha, 'Resultados');

            // Gera buffer
            const buffer = write(workbook, {
                type: 'buffer',
                bookType: 'xlsx',
                compression: true,
                cellStyles: true,
            });

            // Faz upload do arquivo Excel
            const upload_id = await this.uploadService.upload(
                {
                    arquivo: buffer,
                    descricao: `relatorio-atualizacao-${params.atualizacao_em_lote_id}.xlsx`,
                    tipo: 'ATUALIZACAO_EM_LOTE_RELATORIO',
                },
                usuario,
                { buffer },
                ''
            );

            // Atualiza o registro de atualização em lote com o ID do arquivo de relatório
            await this.prisma.atualizacaoEmLote.update({
                where: { id: params.atualizacao_em_lote_id },
                data: { relatorio_arquivo_id: upload_id },
            });

            this.logger.log(`Arquivo Excel gerado com sucesso! Upload ID: ${upload_id}`);
        } catch (error) {
            this.logger.error(`Erro ao gerar relatório Excel: ${error.message}`);
            throw error;
        }
    }

    private adicionarLogErro(error: any, id: number, nome: string, results_log: LogResultadosEstendido) {
        if (error instanceof HttpException) {
            const errorResponse = error.getResponse().toString();

            // Tentando extrair a coluna do erro.
            const col = errorResponse.split('|')[0] ?? '';

            if (col === '') this.logger.warn(`Erro não possui coluna identificada: ${errorResponse}`);

            results_log.falhas.push({
                id,
                nome,
                tipo: 'Exception',
                col: col,
                erro: errorResponse.includes('|') ? errorResponse.split('|')[1] : errorResponse,
            });
        } else {
            results_log.falhas.push({
                id,
                nome,
                tipo: 'Internal',
                // TODO: Pensar em jeito de extrair a coluna do erro interno.
                col: '',
                erro: 'Erro interno',
            });
        }
    }

    private async finalizarAtualizacaoEmLote(
        params: CreateRunUpdateDto,
        results_log: LogResultadosEstendido,
        n_sucesso: number,
        n_erro: number,
        sucesso_ids: number[]
    ) {
        const status = n_erro > 0 ? (n_sucesso > 0 ? 'ConcluidoParcialmente' : 'Falhou') : 'Concluido';

        // Armazena apenas a estrutura LogResultados original no banco de dados
        const resultadosOriginais: LogResultados = {
            falhas: results_log.falhas,
        };

        await this.prisma.atualizacaoEmLote.update({
            where: { id: params.atualizacao_em_lote_id },
            data: {
                status,
                results_log: resultadosOriginais as any,
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

    // Método modificado para aceitar o estado atual das colunas
    private async preparaParamsParaOp(
        tipoAtualizacao: TipoAtualizacaoEmLote,
        op: UpdateOperacaoDto,
        registro: any,
        estadoAtualColunas: Record<string, any> = {}
    ) {
        const params: any = {};

        // Usa o estado atual da coluna se disponível, caso contrário, usa o valor original do registro
        const valorAtual =
            estadoAtualColunas[op.col] !== undefined
                ? estadoAtualColunas[op.col] // Usa o valor acumulado para operações Add/Remove acumulativas
                : registro
                  ? registro[op.col]
                  : undefined; // Usa o valor original do registro

        const value = await this.processaValorParaOp(op, op.tipo_operacao, registro, valorAtual);

        switch (tipoAtualizacao) {
            case TipoAtualizacaoEmLote.ProjetoPP:
            case TipoAtualizacaoEmLote.ProjetoMDO: {
                params['tipo'] = tipoAtualizacao === TipoAtualizacaoEmLote.ProjetoPP ? 'PP' : ('MDO' as TipoProjeto);
                break;
            }
            default:
                throw new Error(`Tipo de atualização não suportado: ${tipoAtualizacao}`);
        }

        const dto =
            typeof value === 'object' && Array.isArray(value) === false && value.tarefa
                ? ({
                      ...value,
                  } as CreateTarefaDto) // TODO: Isso aqui provavelmente não ficará assim, pois teremos mais casos.
                : ({
                      [op.col]: value,
                  } as UpdateProjetoDto);
        params['dto'] = dto;
        return params;
    }

    // Método modificado para usar valorAtual em vez de registro[op.col]
    private async processaValorParaOp(
        op: UpdateOperacaoDto,
        tipo_operacao: TipoOperacao,
        registro: any,
        valorAtual: any
    ) {
        let value = op.valor;

        if (tipo_operacao === TipoOperacao.Set) {
            // Caso o valor se pareça com uma data (YYYY-MM-DD), convertemos para Date.
            if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
                value = new Date(value);
            }

            // Para Set, apenas retornamos o valor.
        } else if (tipo_operacao === TipoOperacao.Add || tipo_operacao === TipoOperacao.Remove) {
            if (valorAtual !== undefined) {
                // É necessário planificar a array se for um array de objetos com id
                // Pois no findOne, geralmente retornamos um array de objetos.
                // Que contem um campo id.
                const valorSalvoIds = Array.isArray(valorAtual)
                    ? valorAtual.length > 0 &&
                      typeof valorAtual[0] === 'object' &&
                      valorAtual[0] !== null &&
                      'id' in valorAtual[0]
                        ? valorAtual.map((item: any) => item.id)
                        : valorAtual // Já é um array de valores primitivos
                    : valorAtual;

                // Para Add, adicionamos o valor (sempre array) ao existente.
                if (tipo_operacao === TipoOperacao.Add) {
                    value = Array.isArray(valorSalvoIds)
                        ? [...valorSalvoIds, ...(Array.isArray(value) ? value : [value])]
                        : typeof valorSalvoIds === 'string'
                          ? `${valorSalvoIds},${value}`
                          : [valorSalvoIds, ...(Array.isArray(value) ? value : [value])];
                }
                // Para Remove, removemos o valor do existente.
                else if (tipo_operacao === TipoOperacao.Remove) {
                    if (Array.isArray(valorSalvoIds)) {
                        value = valorSalvoIds.filter((item: any) => {
                            if (Array.isArray(value)) {
                                return !value.includes(item);
                            } else {
                                return item !== value;
                            }
                        });
                    } else if (typeof valorSalvoIds === 'string') {
                        // Para Remove, removemos o valor.
                        value = valorSalvoIds.replace(new RegExp(`,?${value}`, 'g'), '');
                    } else {
                        throw new Error(`Coluna "${op.col}" não é um array ou string.`);
                    }
                }
            } else {
                throw new Error(`Coluna "${op.col}" não encontrada no registro.`);
            }
        } else if (tipo_operacao === TipoOperacao.CreateTarefa) {
            // Para CreateTarefa, o valor deve ser um objeto com os dados da tarefa.
            if (typeof value !== 'object' || value === null) {
                throw new Error(`Valor para CreateTarefa deve ser um objeto.`);
            }

            // Campos de data devem ser convertidos para Date.
            if (value.inicio_planejado && typeof value.inicio_planejado === 'string') {
                value.inicio_planejado = new Date(value.inicio_planejado);
            }
            if (value.termino_planejado && typeof value.termino_planejado === 'string') {
                value.termino_planejado = new Date(value.termino_planejado);
            }

            // TODO?: Aprimorar esta parte, para não ficar hardcoded.
            value.orgao_id = op.col === 'orgao_id' ? value.orgao_id : registro.orgao_responsavel?.id;
            value.nivel = 1;
            value.numero = 99999;
            value.tarefa_pai_id = null;
            value.descricao = value.tarefa;
            value.recursos = '';

            // Calculando duracao_planejado.
            // Ele deve ser enviado junto com inicio_planejado e termino_planejado.
            // Geralmente, o front-end envia o valor em dias, mas para viabilizar a implementação, faremos o cálculo aqui.
            // Um detalhe sobre a validação: o valor em dias deve contar com o dia de início e o dia de término.
            if (value.inicio_planejado && value.termino_planejado) {
                const inicio = new Date(value.inicio_planejado);
                const termino = new Date(value.termino_planejado);
                const diffTime = Math.abs(termino.getTime() - inicio.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                value.duracao_planejado = diffDays + 1; // Adicionando 1 para incluir o dia de término.
            } else {
                throw new Error(`Inicio e término planejados são obrigatórios para CreateTarefa.`);
            }

            // Após adicionar os campos, validamos o DTO.
            // Essa validação é feita aqui, pois no DTO de create da task não temos os valores que foram adicionados aqui neste método.
            const dummyInstance = plainToInstance(
                CreateTarefaDto,
                { ...value }, // Mapeia o valor para a coluna
                { enableImplicitConversion: true }
            ) as object;
            const errors = await validate(dummyInstance, {
                skipMissingProperties: true,
                forbidUnknownValues: true,
            });
            if (errors.length > 0) {
                throw new Error(`Erro de validação: ${errors.map((e) => e.toString()).join(', ')}`);
            }
        } else {
            throw new Error(`Operação "${tipo_operacao}" não suportada.`);
        }

        return value;
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
