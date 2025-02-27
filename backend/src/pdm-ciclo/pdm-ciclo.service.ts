import { HttpException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Date2YMD } from '../common/date2ymd';
import { CicloFisicoDto } from '../pdm/dto/list-pdm.dto';
import { PrismaService } from '../prisma/prisma.service';
import { FilterPdmCiclo, UpdatePdmCicloDto } from './dto/update-pdm-ciclo.dto';
import { CicloFisicoV2Dto } from './entities/pdm-ciclo.entity';

@Injectable()
export class PdmCicloService {
    constructor(private readonly prisma: PrismaService) {}

    async findAll(params: FilterPdmCiclo): Promise<CicloFisicoDto[]> {
        const retorno: CicloFisicoDto[] = [];

        // O filtro de "ano" afeta o data ciclo. E ele deve funcionar junto com o filtro de "apenas_futuro".
        const ciclos = await this.prisma.cicloFisico.findMany({
            where: {
                pdm_id: params.pdm_id,
                AND: [
                    {
                        data_ciclo: {
                            gte: params.apenas_futuro ? new Date(Date.now()) : undefined,
                        },
                    },
                    {
                        data_ciclo: {
                            gte: params.ano ? new Date(params.ano, 0, 1) : undefined,
                        },
                    },
                ],
            },
            include: {
                fases: true,
            },
            orderBy: [{ data_ciclo: 'asc' }],
        });

        for (const ciclo of ciclos) {
            const item: CicloFisicoDto = {
                id: ciclo.id,
                data_ciclo: Date2YMD.toString(ciclo.data_ciclo),
                fases: [],
                ativo: ciclo.ativo,
            };
            for (const fase of ciclo.fases) {
                item.fases.push({
                    id: fase.id,
                    ciclo_fase: fase.ciclo_fase,
                    data_inicio: Date2YMD.toString(fase.data_inicio),
                    data_fim: Date2YMD.toString(fase.data_fim),
                    fase_corrente: ciclo.ciclo_fase_atual_id == fase.id && ciclo.ativo,
                });
            }

            retorno.push(item);
        }

        return retorno;
    }

    async findAllV2(params: FilterPdmCiclo): Promise<CicloFisicoV2Dto[]> {
        const process = await this.findAll(params);

        const retorno: CicloFisicoV2Dto[] = [];
        let ativoVisto = params.apenas_futuro ? true : false;
        for (const ciclo of process) {
            retorno.push({
                id: ciclo.id,
                data_ciclo: ciclo.data_ciclo,
                ativo: ciclo.ativo,
                inicio_coleta: ciclo.fases.filter((n) => n.ciclo_fase == 'Coleta')[0].data_inicio,
                inicio_qualificacao: ciclo.fases.filter((n) => n.ciclo_fase == 'Analise')[0].data_inicio,
                inicio_analise_risco: ciclo.fases.filter((n) => n.ciclo_fase == 'Risco')[0].data_inicio,
                inicio_fechamento: ciclo.fases.filter((n) => n.ciclo_fase == 'Fechamento')[0].data_inicio,
                fechamento: ciclo.fases.filter((n) => n.ciclo_fase == 'Fechamento')[0].data_fim,
                pode_editar: ativoVisto,
            });

            if (ciclo.ativo) ativoVisto = true;
        }

        return retorno;
    }

    async update(id: number, dto: UpdatePdmCicloDto) {
        if (!(Date2YMD.toString(dto.fechamento) > Date2YMD.toString(dto.inicio_fechamento)))
            throw new HttpException(`Fechamento precisa ser maior que o início do fechamento`, 400);

        if (!(Date2YMD.toString(dto.inicio_fechamento) > Date2YMD.toString(dto.inicio_analise_risco)))
            throw new HttpException(`Início do fechamento precisa ser maior que o inicio da análise de risco`, 400);

        if (!(Date2YMD.toString(dto.inicio_analise_risco) > Date2YMD.toString(dto.inicio_qualificacao)))
            throw new HttpException(`Início da análise de risco precisa ser maior que o inicio da qualificação`, 400);

        if (!(Date2YMD.toString(dto.inicio_qualificacao) > Date2YMD.toString(dto.inicio_coleta)))
            throw new HttpException(`Início da qualificação precisa ser maior que o inicio da coleta`, 400);

        const cicloEscolhido = await this.prisma.cicloFisico.findFirst({
            where: { id },
        });
        if (!cicloEscolhido) throw new HttpException('ciclo não encontrado', 404);

        const cicloAtivo = await this.prisma.cicloFisico.findFirst({
            where: { pdm_id: cicloEscolhido.pdm_id, ativo: true },
        });
        if (cicloAtivo)
            if (Date2YMD.toString(cicloEscolhido.data_ciclo) <= Date2YMD.toString(cicloAtivo.data_ciclo))
                throw new HttpException(
                    `Você só pode editar ciclos que ainda não foram iniciados (após ${cicloAtivo.data_ciclo}) ou de PDM não ativos (com nenhum ciclo ativo)`,
                    404
                );

        const cicloAnterior = await this.prisma.cicloFisico.findFirst({
            where: { pdm_id: cicloEscolhido.pdm_id, data_ciclo: { lt: cicloEscolhido.data_ciclo } },
            orderBy: [{ data_ciclo: 'desc' }],
            take: 1,
            include: { fases: true },
        });
        const cicloSucessor = await this.prisma.cicloFisico.findFirst({
            where: { pdm_id: cicloEscolhido.pdm_id, data_ciclo: { gt: cicloEscolhido.data_ciclo } },
            orderBy: [{ data_ciclo: 'asc' }],
            take: 1,
            include: { fases: true },
        });

        // verificações já que apenas 1 fase é esticada/encolhida por vez
        if (cicloAnterior) {
            console.dir({ cicloAnterior }, { depth: null });

            const inicioDoFechamentoAnterior = cicloAnterior.fases.filter((n) => n.ciclo_fase == 'Fechamento')[0]
                .data_inicio;

            if (Date2YMD.toString(dto.inicio_coleta) <= Date2YMD.toString(inicioDoFechamentoAnterior)) {
                throw new HttpException(
                    `início da coleta ${Date2YMD.toString(
                        dto.inicio_coleta
                    )} não pode encolher mais do que o início do fechamento anterior ${Date2YMD.toString(
                        inicioDoFechamentoAnterior
                    )}`,
                    400
                );
            }
        }

        if (cicloSucessor) {
            console.dir({ cicloSucessor }, { depth: null });
            const fimDaColetaSucessor = cicloSucessor.fases.filter((n) => n.ciclo_fase == 'Coleta')[0].data_fim;
            if (Date2YMD.toString(dto.fechamento) >= Date2YMD.toString(fimDaColetaSucessor)) {
                throw new HttpException(
                    `Fechamento ${Date2YMD.toString(
                        dto.fechamento
                    )} não pode passar do final da próxima coleta ${Date2YMD.toString(fimDaColetaSucessor)}`,
                    400
                );
            }
        }

        await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
            if (cicloAnterior) {
                await prismaTx.cicloFisicoFase.updateMany({
                    where: { ciclo_fisico_id: cicloAnterior.id, ciclo_fase: 'Fechamento' },
                    data: {
                        data_fim: Date2YMD.incDaysFromISO(dto.inicio_coleta, -1),
                    },
                });
            }

            if (cicloSucessor) {
                await prismaTx.cicloFisicoFase.updateMany({
                    where: { ciclo_fisico_id: cicloSucessor.id, ciclo_fase: 'Coleta' },
                    data: {
                        data_inicio: Date2YMD.incDaysFromISO(dto.fechamento, 1),
                    },
                });
            }

            await prismaTx.cicloFisicoFase.updateMany({
                where: { ciclo_fisico_id: cicloEscolhido.id, ciclo_fase: 'Coleta' },
                data: {
                    data_inicio: dto.inicio_coleta,
                    data_fim: Date2YMD.incDaysFromISO(dto.inicio_qualificacao, -1),
                },
            });
            await prismaTx.cicloFisicoFase.updateMany({
                where: { ciclo_fisico_id: cicloEscolhido.id, ciclo_fase: 'Analise' },
                data: {
                    data_inicio: dto.inicio_qualificacao,
                    data_fim: Date2YMD.incDaysFromISO(dto.inicio_analise_risco, -1),
                },
            });
            await prismaTx.cicloFisicoFase.updateMany({
                where: { ciclo_fisico_id: cicloEscolhido.id, ciclo_fase: 'Risco' },
                data: {
                    data_inicio: dto.inicio_analise_risco,
                    data_fim: Date2YMD.incDaysFromISO(dto.inicio_fechamento, -1),
                },
            });

            await prismaTx.cicloFisicoFase.updateMany({
                where: { ciclo_fisico_id: cicloEscolhido.id, ciclo_fase: 'Fechamento' },
                data: {
                    data_inicio: dto.inicio_fechamento,
                    data_fim: dto.fechamento,
                },
            });
        });

        console.log(cicloAnterior, cicloSucessor);
    }
}
