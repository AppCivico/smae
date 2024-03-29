import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { Date2YMD } from '../../common/date2ymd';
import { ListApenasTarefaListDto } from '../../pp/tarefa/entities/tarefa.entity';
import { TarefaService } from '../../pp/tarefa/tarefa.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TaskableService } from '../entities/task.entity';
import { CreateAeCronogramaTpJobDto } from './dto/ae_cronograma_tp.dto';

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

        const { tarefas, hierarquiaRef } = await this.resolveTarefas(tarefa_cronograma_id, config);
        if (tarefas.linhas.length === 0) {
            return { tarefas_zero: true, success: true };
        }

        const mailTo: string[] = config.cc;
        let tarefaText = '';
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

        const parts: NotificationParts[] = [];
        await adicionaTextoIntro(tarefaText);
        this.adicionaTarefas(tarefas, hierarquiaRef, parts);

        console.log(parts.filter((t) => (t.t = 't')).map((t) => t.c));

        return {
            success: true,
        };

        // mantendo no escopo para não precisar declara o tipo de TC
        async function adicionaTextoIntro(tarefaText: string) {
            if (tc.projeto) {
                const textoComSemTarefa = {
                    false: 'O Projeto',
                    true: `${tarefaText} do projeto`,
                };

                parts.push({
                    t: 'i',
                    c: `${textoComSemTarefa[tarefaText ? 'true' : 'false']} "${tc.projeto.codigo} - ${tc.projeto.nome}" está aguardando posição sobre as seguintes tarefas:`,
                });
            } else if (tc.transferencia) {
                const textoComSemTarefa = {
                    false: 'A Transferência',
                    true: `${tarefaText} da transferência`,
                };
                parts.push({
                    t: 'i',
                    c: `${textoComSemTarefa[tarefaText ? 'true' : 'false']}  "${tc.transferencia.identificador}" (${tc.transferencia.tipo.nome}) está aguardando posição sobre as seguintes atividades:`,
                });
            }
        }
    }

    private adicionaTarefas(
        tarefas: ListApenasTarefaListDto,
        hierarquiaRef: Record<string, string>,
        parts: NotificationParts[]
    ) {
        for (const t of tarefas.linhas) {
            const hierarquia = hierarquiaRef[t.id];
            const ehMarco = t.eh_marco ? '🚩 ' : '';
            const temAtraso = t.atraso !== null && t.atraso > 0 ? ` (atraso ${t.atraso} dias) ` : '';

            parts.push({
                t: 't',
                c: `Prevista para ${Date2YMD.dbDateToDMY(t.termino_planejado)}, ${hierarquia} - ${ehMarco}${t.tarefa}${temAtraso}`,
            });
        }
    }

    private async resolveTarefas(tarefa_cronograma_id: number, config: CreateAeCronogramaTpJobDto) {
        const tarefas = await this.tarefaService.buscaLinhasRecalcProjecao(tarefa_cronograma_id);
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
        return { tarefas, hierarquiaRef };
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
