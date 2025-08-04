import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { uuidv7 } from 'uuidv7';
import { Date2YMD } from '../../common/date2ymd';
import { TarefaItemProjetadoDto } from '../../pp/tarefa/entities/tarefa.entity';
import { TarefaService } from '../../pp/tarefa/tarefa.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TaskableService } from '../entities/task.entity';
import { CreateAeCronogramaTpJobDto } from './dto/ae_cronograma_tp.dto';
import { Prisma } from 'src/generated/prisma/client';

// t=tarefa, i=intro
// c=conteúdo
type NotificationParts = { t: 'i' | 't'; c: string };
@Injectable()
export class AeCronogramaTpTaskService implements TaskableService {
    private readonly logger = new Logger(AeCronogramaTpTaskService.name);
    constructor(
        private readonly prisma: PrismaService,
        @Inject(forwardRef(() => TarefaService)) private readonly tarefaService: TarefaService
    ) {}

    async executeJob(input: unknown, _taskId: string): Promise<any> {
        const config = plainToClass(CreateAeCronogramaTpJobDto, input);
        const validateConfig = await validate(config);
        if (validateConfig.length) throw new Error(`Invalid config: ${JSON.stringify(validateConfig)}`);
        this.logger.verbose(`Carregando cronograma ou tarefa id ${JSON.stringify(config)}`);

        const tarefa_cronograma_id = await this.resolveTarefaCronoId(config);
        const tc = await this.prisma.tarefaCronograma.findFirstOrThrow({
            where: { id: tarefa_cronograma_id },
            select: {
                transferencia: {
                    select: {
                        id: true,
                        identificador: true,
                        tipo: { select: { nome: true } },
                        objeto: true,
                    },
                },
                projeto: {
                    select: {
                        id: true,
                        codigo: true,
                        nome: true,
                    },
                },
            },
        });

        const { tarefas, hierarquiaRef, orgaoDb } = await this.resolveTarefas(tarefa_cronograma_id, config);
        if (tarefas.linhas.length === 0) {
            return { tarefas_zero: true, success: true };
        }

        const mailTo: string[] = config.cc;
        let tarefaText = '';
        let objeto = '';
        if (config.tarefa_id) {
            const tarefa = await this.prisma.tarefa.findFirstOrThrow({
                where: { id: config.tarefa_id },
                select: {
                    tarefa: true,
                    orgao: {
                        select: { email: true },
                    },
                },
            });
            const email = tarefa.orgao?.email;
            if (email) {
                this.logger.log(`Adicionando e-mail do órgão da tarefa ${email}`);
                mailTo.push(...email.split(';'));
            }
            tarefaText = `A tarefa ${tarefa.tarefa}`;
        }
        objeto = calculaTextoObjeto(tarefaText);

        const partes: NotificationParts[] = [];
        await adicionaTextoIntro(objeto, partes);
        this.adicionaTarefas(tarefas.linhas, hierarquiaRef, partes);

        const emailConfig = await this.prisma.cronogramaTerminoPlanejadoConfig.findUnique({
            where: {
                modulo_sistema: tc.projeto ? 'Projetos' : 'CasaCivil',
            },
        });
        if (emailConfig) {
            // email global
            await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
                const globalEmailQueue = await prismaTx.emaildbQueue.create({
                    data: {
                        id: uuidv7(),
                        config_id: 1,
                        subject: this.processaAssunto(emailConfig.assunto_global, objeto),
                        template: 'ae-cronograma-termino-planejado.html',
                        to: emailConfig.para,
                        variables: {
                            ':cc': config.cc.join(','),
                            texto_inicial: emailConfig.texto_inicial,
                            texto_final: emailConfig.texto_final,
                            partes: partes,
                        },
                    },
                });

                if (config.aviso_email_id) {
                    console.log(config, globalEmailQueue.id);
                    await prismaTx.avisoEmailDisparos.create({
                        data: {
                            aviso_email_id: config.aviso_email_id,
                            para: globalEmailQueue.to,
                            com_copia: config.cc,
                            emaildb_queue_id: globalEmailQueue.id,
                        },
                    });
                }

                for (const orgao of orgaoDb) {
                    if (!orgao.email) {
                        this.logger.verbose(`órgão ${orgao.sigla} sem e-mail`);
                        continue;
                    }
                    const tarefasDoOrgao = tarefas.linhas.filter((t) => t.orgao?.id === orgao.id);
                    if (!tarefasDoOrgao.length) {
                        this.logger.verbose(`sem tarefas para o órgão ${orgao.sigla}`);
                        continue;
                    }

                    const partes: NotificationParts[] = [];
                    await adicionaTextoIntro(tarefaText, partes);
                    this.adicionaTarefas(tarefasDoOrgao, hierarquiaRef, partes);

                    const orgaoEmailQueue = await prismaTx.emaildbQueue.create({
                        data: {
                            id: uuidv7(),
                            config_id: 1,
                            subject: this.processaAssunto(emailConfig.assunto_orgao, objeto),
                            template: 'ae-cronograma-termino-planejado.html',
                            to: orgao.email,
                            variables: {
                                ':cc': config.cc.join(','),
                                texto_inicial: emailConfig.texto_inicial,
                                texto_final: emailConfig.texto_final,
                                partes: partes,
                            },
                        },
                    });

                    if (config.aviso_email_id)
                        await prismaTx.avisoEmailDisparos.create({
                            data: {
                                aviso_email_id: config.aviso_email_id,
                                para: orgaoEmailQueue.to,
                                com_copia: config.cc,
                                emaildb_queue_id: orgaoEmailQueue.id,
                            },
                        });
                }
            });
        } else {
            this.logger.warn(`configuração de email não encontrada, nenhum e-mail disparado`);
        }

        return {
            success: true,
        };

        // mantendo no escopo para não precisar declara o tipo de TC
        function calculaTextoObjeto(tarefaText: string): string {
            if (tc.projeto) {
                const textoComSemTarefa = {
                    false: 'O Projeto',
                    true: `${tarefaText} do projeto`,
                };

                return `${textoComSemTarefa[tarefaText ? 'true' : 'false']} ${tc.projeto.codigo ? tc.projeto.codigo + ' -' : ''} ${tc.projeto.nome}`;
            } else if (tc.transferencia) {
                const textoComSemTarefa = {
                    false: 'A Transferência',
                    true: `${tarefaText} da transferência`,
                };
                return `${textoComSemTarefa[tarefaText ? 'true' : 'false']} ${tc.transferencia.identificador}`;
            }
            return `-`;
        }

        // mantendo no escopo para não precisar declara o tipo de TC
        async function adicionaTextoIntro(objeto: string, parts: NotificationParts[]) {
            if (tc.projeto) {
                parts.push({
                    t: 'i',
                    c: `${objeto} está aguardando posição sobre as seguintes tarefas:`,
                });
            } else if (tc.transferencia) {
                parts.push({
                    t: 'i',
                    c: `${objeto} (${tc.transferencia.tipo.nome}) está aguardando posição sobre as seguintes atividades:`,
                });
            }
        }
    }

    private processaAssunto(base: string, objeto: string): string {
        return base.replace(/:objeto:/g, objeto);
    }

    private adicionaTarefas(
        tarefas: TarefaItemProjetadoDto[],
        hierarquiaRef: Record<string, string>,
        parts: NotificationParts[]
    ) {
        for (const t of tarefas) {
            const hierarquia = hierarquiaRef[t.id];
            const ehMarco = t.eh_marco ? '🚩 ' : '';
            const temAtraso = t.atraso !== null && t.atraso > 0 ? ` (atraso ${t.atraso} dias) ` : '';

            parts.push({
                t: 't',
                c: `Prevista para ${Date2YMD.ymdToDMY(t.termino_planejado)}, ${hierarquia} - ${ehMarco}${t.tarefa}${temAtraso}`,
            });
        }
    }

    private async resolveTarefas(tarefa_cronograma_id: number, config: CreateAeCronogramaTpJobDto) {
        const tarefas = await this.tarefaService.buscaLinhasRecalcProjecao(tarefa_cronograma_id, null);
        const hierarquiaRef = await this.tarefaService.tarefasHierarquia(tarefa_cronograma_id);

        // se for por tarefa, mostra o resumo dela + filhas
        if (config.tarefa_id) {
            const hierarquiaMae = hierarquiaRef[config.tarefa_id];
            tarefas.linhas = tarefas.linhas.filter((t) => {
                const hierarquiaTarefa = hierarquiaRef[t.id] + '.';
                return hierarquiaTarefa.startsWith(hierarquiaMae + '.') && t.termino_planejado;
            });
        } else {
            // se for do cronograma, filtra o que está com data de term real ou exec 100% (não deveria ter exec 100% e term real mas ok)
            tarefas.linhas = tarefas.linhas.filter((t) => {
                return t.termino_real == null && t.percentual_concluido !== 100 && t.termino_planejado;
            });
        }

        tarefas.linhas.sort((a, b) => {
            const numberA = a.numero;
            const depthA = a.nivel;
            const numberB = b.numero;
            const depthB = b.nivel;

            // primeiro profundidade
            if (depthA !== depthB) {
                return depthA - depthB; // depth first
            } else {
                return numberA - numberB;
            }
        });

        const orgaos = new Set<number>();
        for (const t of tarefas.linhas) {
            if (t.orgao?.id) orgaos.add(t.orgao.id);
        }
        const orgaoList = Array.from(orgaos).map((r) => +r);

        const orgaoDb = await this.prisma.orgao.findMany({
            where: { id: { in: orgaoList } },
            select: { id: true, sigla: true, email: true },
        });

        return { tarefas, hierarquiaRef, orgaoList, orgaoDb };
    }

    private async resolveTarefaCronoId(inputParams: CreateAeCronogramaTpJobDto) {
        let tarefa_cronograma_id: number | undefined = undefined;

        if (inputParams.tarefa_id) {
            const loookup = await this.prisma.tarefa.findFirstOrThrow({
                where: { id: inputParams.tarefa_id },
                select: { tarefa_cronograma_id: true },
            });
            tarefa_cronograma_id = loookup.tarefa_cronograma_id;
        } else if (inputParams.tarefa_cronograma_id) {
            tarefa_cronograma_id = inputParams.tarefa_cronograma_id;
        }
        if (!tarefa_cronograma_id) throw 'envie tarefa_id ou tarefa_cronograma_id';
        return tarefa_cronograma_id;
    }

    outputToJson(executeOutput: any, _inputParams: any, _taskId: string): JSON {
        this.logger.verbose(JSON.stringify(executeOutput));
        return JSON.stringify(executeOutput) as any;
    }
}
