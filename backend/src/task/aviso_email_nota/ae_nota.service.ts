import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { uuidv7 } from 'uuidv7';
import { NotaService } from '../../bloco-nota/nota/nota.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TaskableService } from '../entities/task.entity';
import { CreateNotaJobDto } from './dto/ae_nota.dto';

@Injectable()
export class AeNotaTaskService implements TaskableService {
    private readonly logger = new Logger(AeNotaTaskService.name);
    constructor(
        private readonly prisma: PrismaService,
        @Inject(forwardRef(() => NotaService)) private readonly notaService: NotaService
    ) {}

    async executeJob(input: unknown, _taskId: string): Promise<any> {
        const config = plainToClass(CreateNotaJobDto, input);
        const validateConfig = await validate(config);
        if (validateConfig.length) throw new Error(`Invalid config: ${JSON.stringify(validateConfig)}`);
        this.logger.verbose(`Carregando nota id ${JSON.stringify(config)}`);

        const nota = await this.resolveNota(config);

        await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
            const info = await this.notaService.geraDadosEmail(nota.id, prismaTx);

            let enviaParaOrgao: boolean = nota.tipo_nota.visivel_resp_orgao;
            if (nota.tipo_nota.eh_publico == false) {
                enviaParaOrgao = false;
                this.logger.log(`Enviando e-mail apenas para o criador e cópia`);

                const globalEmailQueue = await prismaTx.emaildbQueue.create({
                    data: {
                        id: uuidv7(),
                        config_id: 1,
                        subject: `Aviso para nota - ${info.objeto}`,
                        template: 'ae-nota-aviso.html',
                        to: nota.criador.email,
                        variables: {
                            ':cc': config.cc.join(','),
                            ...info,
                        },
                    },
                });
                if (config.aviso_email_id)
                    await prismaTx.avisoEmailDisparos.create({
                        data: {
                            aviso_email_id: config.aviso_email_id,
                            para: globalEmailQueue.to,
                            com_copia: config.cc,
                            emaildb_queue_id: globalEmailQueue.id,
                        },
                    });
            }

            const orgaoEnviado = new Set<number>();

            for (const encaminhamento of nota.NotaEnderecamento) {
                if (encaminhamento.pessoa_enderecado) {
                    const globalEmailQueue = await prismaTx.emaildbQueue.create({
                        data: {
                            id: uuidv7(),
                            config_id: 1,
                            subject: `Aviso para nota - ${info.objeto}`,
                            template: 'ae-nota-aviso.html',
                            to: encaminhamento.pessoa_enderecado.email,
                            variables: {
                                ':cc': config.cc.join(','),
                                ...info,
                            },
                        },
                    });
                    if (config.aviso_email_id)
                        await prismaTx.avisoEmailDisparos.create({
                            data: {
                                aviso_email_id: config.aviso_email_id,
                                para: globalEmailQueue.to,
                                com_copia: config.cc,
                                emaildb_queue_id: globalEmailQueue.id,
                            },
                        });
                } else if (encaminhamento.orgao_enderecado && encaminhamento.orgao_enderecado.email) {
                    orgaoEnviado.add(encaminhamento.orgao_enderecado.id);

                    const globalEmailQueue = await prismaTx.emaildbQueue.create({
                        data: {
                            id: uuidv7(),
                            config_id: 1,
                            subject: `Aviso para nota - ${info.objeto}`,
                            template: 'ae-nota-aviso.html',
                            to: encaminhamento.orgao_enderecado.email,
                            variables: {
                                ':cc': config.cc.join(','),
                                ...info,
                            },
                        },
                    });
                    if (config.aviso_email_id)
                        await prismaTx.avisoEmailDisparos.create({
                            data: {
                                aviso_email_id: config.aviso_email_id,
                                para: globalEmailQueue.to,
                                com_copia: config.cc,
                                emaildb_queue_id: globalEmailQueue.id,
                            },
                        });
                }
            }

            if (enviaParaOrgao && nota.orgao_responsavel) {
                // avisa o órgão responsável se já não foi um dos encaminhamentos
                if (!orgaoEnviado.has(nota.orgao_responsavel.id) && nota.orgao_responsavel.email) {
                    const globalEmailQueue = await prismaTx.emaildbQueue.create({
                        data: {
                            id: uuidv7(),
                            config_id: 1,
                            subject: `Aviso para nota - ${info.objeto}`,
                            template: 'ae-nota-aviso.html',
                            to: nota.orgao_responsavel.email,
                            variables: {
                                ':cc': config.cc.join(','),
                                ...info,
                            },
                        },
                    });
                    if (config.aviso_email_id)
                        await prismaTx.avisoEmailDisparos.create({
                            data: {
                                aviso_email_id: config.aviso_email_id,
                                para: globalEmailQueue.to,
                                com_copia: config.cc,
                                emaildb_queue_id: globalEmailQueue.id,
                            },
                        });
                }
            }
        });

        return {
            success: true,
        };
    }

    private async resolveNota(inputParams: CreateNotaJobDto) {
        const loookup = await this.prisma.nota.findFirstOrThrow({
            where: { id: inputParams.nota_id },
            select: {
                nota: true,
                id: true,
                criador: {
                    select: {
                        email: true,
                    },
                },
                orgao_responsavel: { select: { id: true, email: true } },
                tipo_nota: true,
                NotaEnderecamento: {
                    where: { removido_em: null },
                    select: {
                        pessoa_enderecado: { select: { email: true } },
                        orgao_enderecado: { select: { email: true, id: true } },
                    },
                },
            },
        });

        return loookup;
    }

    outputToJson(executeOutput: any, _inputParams: any, _taskId: string): JSON {
        this.logger.verbose(JSON.stringify(executeOutput));
        return JSON.stringify(executeOutput) as any;
    }
}
