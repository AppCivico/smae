import { BadRequestException, Inject, Injectable, forwardRef } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Prisma, VariavelFase } from '@prisma/client';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { CrontabIsEnabled } from '../common/CrontabIsEnabled';
import { Date2YMD } from '../common/date2ymd';
import { PdmService } from '../pdm/pdm.service';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import {
    BatchAnaliseQualitativaDto,
    FilterVariavelGlobalCicloDto,
    VariavelGlobalAnaliseItemDto,
    VariavelGlobalCicloDto,
} from './dto/variavel.ciclo.dto';
import { VariavelComCategorica, VariavelService } from './variavel.service';

interface ICicloCorrente {
    variavel: {
        id: number;
        titulo: string;
        variaveis_filhas: {
            id: number;
            titulo?: string;
        }[];
    };
    fase: VariavelFase;
    proximo_periodo_abertura: Date;
    ultimo_periodo_valido: Date;
}

@Injectable()
export class VariavelCicloService {
    private enabled: boolean;
    constructor(
        private readonly prisma: PrismaService,
        private readonly uploadService: UploadService,
        private readonly variavelService: VariavelService,
        //
        @Inject(forwardRef(() => PdmService))
        private readonly pdmService: PdmService
    ) {
        this.enabled = false;
    }

    async onModuleInit() {
        if (CrontabIsEnabled('variavel_ciclo')) {
            // irá ser necessário verificar uma vez por mes ativar as variaveis
            this.enabled = true;
        }
    }

    @Cron(CronExpression.EVERY_HOUR)
    async variavelCicloCrontab() {
        if (!this.enabled) return;
        // TODO
    }

    async getPermissionSet(
        filters: FilterVariavelGlobalCicloDto,
        user: PessoaFromJwt
    ): Promise<Prisma.Enumerable<Prisma.VariavelCicloCorrenteWhereInput>> {
        const isRoot = user.hasSomeRoles(['SMAE.superadmin', 'CadastroVariavelGlobal.administrador']);
        const pdmIds = isRoot ? undefined : await this.pdmService.findAllIds('PS', user);

        let ponto_focal = true;
        let pessoaId = user.id;

        if (user.hasSomeRoles(['CadastroVariavelGlobal.administrador'])) ponto_focal = false;

        if (filters.simular_ponto_focal && isRoot) {
            pessoaId = filters.simular_usuario ?? pessoaId;
            ponto_focal = true;
        }

        const whereConditions: Prisma.Enumerable<Prisma.VariavelCicloCorrenteWhereInput> = [{ fase: filters.fase }];

        if (pdmIds) {
            whereConditions.push({
                ViewVariavelGlobal: {
                    some: { planos: { hasSome: pdmIds } },
                },
            });
        }

        if (ponto_focal) {
            const equipes = await this.prisma.grupoResponsavelEquipe.findMany({
                where: {
                    removido_em: null,
                    perfil: 'Medicao',
                    GrupoResponsavelEquipePessoa: {
                        some: {
                            pessoa_id: pessoaId,
                        },
                    },
                },
            });
            const equipeIds = equipes.map((e) => e.id);

            whereConditions.push({
                variavel: {
                    VariavelGrupoResponsavelEquipe: {
                        some: { grupo_responsavel_equipe_id: { in: equipeIds } },
                    },
                },
            });
        }

        return { AND: whereConditions };
    }

    async getVariavelCiclo(
        filters: FilterVariavelGlobalCicloDto,
        user: PessoaFromJwt
    ): Promise<VariavelGlobalCicloDto[]> {
        const whereFilter = await this.getPermissionSet(filters, user);

        const variaveis = await this.prisma.variavelCicloCorrente.findMany({
            where: {
                AND: whereFilter,
            },
            include: {
                variavel: {
                    select: {
                        id: true,
                        titulo: true,
                    },
                },
            },
        });

        const rows = variaveis.map((v) => {
            return {
                id: v.variavel.id,
                titulo: v.variavel.titulo,
                fase: v.fase,
                proximo_periodo_abertura: Date2YMD.toString(v.proximo_periodo_abertura),
                ultimo_periodo_valido: Date2YMD.toString(v.ultimo_periodo_valido),
            } satisfies VariavelGlobalCicloDto;
        });

        return rows;
    }

    async patchVariavelCiclo(dto: BatchAnaliseQualitativaDto, user: PessoaFromJwt): Promise<void> {
        const whereFilter = await this.getPermissionSet({}, user);

        const cicloCorrente = await this.prisma.variavelCicloCorrente.findFirst({
            where: {
                AND: whereFilter,
                variavel_id: dto.variavel_id,
            },
            include: {
                variavel: {
                    select: {
                        id: true,
                        titulo: true,
                        variaveis_filhas: {
                            where: { removido_em: null, tipo: 'Global' },
                            select: { id: true },
                        },
                    },
                },
            },
        });
        if (!cicloCorrente) throw new BadRequestException('Variável não encontrada, ou não tem permissão para acessar');

        if (cicloCorrente.fase != 'Preenchimento')
            throw new BadRequestException('Variável não está em fase de preenchimento');

        if (dto.data_referencia.valueOf() != cicloCorrente.ultimo_periodo_valido.valueOf())
            throw new BadRequestException(
                `Data de referência não é a última válida (${Date2YMD.dbDateToDMY(cicloCorrente.ultimo_periodo_valido)})`
            );

        // primeira versão, só tem medicao
        const conferida = false;

        console.log(cicloCorrente, dto);
        this.validaValoresVariaveis(dto, cicloCorrente);

        const now = new Date(Date.now());

        await this.prisma.$transaction(async (prismaTxn: Prisma.TransactionClient): Promise<void> => {
            // Cria uma nova analise qualitativa, marcando primeiro a última como falsa
            await prismaTxn.variavelGlobalCicloAnalise.updateMany({
                where: { variavel_id: dto.variavel_id, ultima_revisao: true },
                data: { ultima_revisao: false },
            });
            await prismaTxn.variavelGlobalCicloAnalise.create({
                data: {
                    variavel_id: dto.variavel_id,
                    referencia_data: dto.data_referencia,
                    informacoes_complementares: dto.analise_qualitativa,
                    criado_por: user.id,
                    ultima_revisao: true,
                    valores: dto.valores as any,
                },
            });

            // uploads se existirem
            if (dto.uploads && dto.uploads.length > 0) {
                for (const uploadToken of dto.uploads) {
                    const uploadId = this.uploadService.checkUploadOrDownloadToken(uploadToken);
                    await prismaTxn.variavelGlobalCicloDocumento.create({
                        data: {
                            variavel_id: dto.variavel_id,
                            referencia_data: new Date(dto.data_referencia),
                            arquivo_id: uploadId,
                            criado_por: user.id,
                        },
                    });
                }
            }

            const variveisIds: number[] = [dto.variavel_id];
            for (const valor of dto.valores) {
                if (valor.variavel_id) variveisIds.push(valor.variavel_id);
                const variavelInfo = await this.variavelService.loadVariavelComCategorica(
                    'Global',
                    prismaTxn,
                    valor.variavel_id ?? dto.variavel_id
                );

                await this.atualizaSerieVariavel(
                    variavelInfo,
                    valor,
                    prismaTxn,
                    now,
                    user,
                    dto.data_referencia,
                    conferida
                );
            }

            await this.variavelService.recalc_series_dependentes(variveisIds, prismaTxn);
            await this.variavelService.recalc_indicador_usando_variaveis(variveisIds, prismaTxn);
        });
    }
    private validaValoresVariaveis(dto: BatchAnaliseQualitativaDto, cicloCorrente: ICicloCorrente) {
        for (const valor of dto.valores) {
            // Remove variavel_id dos valores principais se for o mesmo que a variável sendo analisada
            if (valor.variavel_id && valor.variavel_id == dto.variavel_id) delete valor.variavel_id;
        }

        const valorGlobalOuMae = dto.valores.filter((valor) => !valor.variavel_id);
        const valorFilhas = dto.valores.filter((valor) => valor.variavel_id);

        if (valorGlobalOuMae.length > 0 && cicloCorrente.variavel.variaveis_filhas.length > 0)
            if (valorFilhas.length > 0)
                throw new BadRequestException(
                    'Valores de variáveis mãe e filhas não podem ser fornecidos simultaneamente'
                );

        if (valorGlobalOuMae.length > 1 && cicloCorrente.variavel.variaveis_filhas.length === 0)
            throw new BadRequestException('Apenas um valor pode ser fornecido para uma variável sem filhas');

        const filhasSet = new Set(cicloCorrente.variavel.variaveis_filhas.map((v) => v.id));
        for (const valor of valorFilhas) {
            if (!valor.variavel_id) continue;
            if (!cicloCorrente.variavel.variaveis_filhas.map((v) => v.id).includes(valor.variavel_id))
                throw new BadRequestException('Variável filha não encontrada');
            if (filhasSet.has(valor.variavel_id)) filhasSet.delete(valor.variavel_id);
            else throw new BadRequestException('Variável filha duplicada');
        }
    }

    private async atualizaSerieVariavel(
        variavelInfo: VariavelComCategorica,
        valor: VariavelGlobalAnaliseItemDto,
        prismaTxn: Prisma.TransactionClient,
        now: Date,
        user: PessoaFromJwt,
        dataReferencia: Date,
        conferida: boolean
    ) {
        const valor_nominal = valor.valor_realizado === '' ? '' : valor.valor_realizado;

        let variavel_categorica_valor_id: number | null = null;

        if (variavelInfo.variavel_categorica) {
            const valorExiste = variavelInfo.variavel_categorica.valores.find(
                (v) => v.valor_variavel === +valor_nominal
            );
            if (!valorExiste)
                throw new BadRequestException(`Valor ${valor_nominal} não é permitido para a variável categórica`);
            variavel_categorica_valor_id = valorExiste.id;
        }

        const existeValor = await prismaTxn.serieVariavel.findFirst({
            where: {
                variavel_id: variavelInfo.id,
                serie: 'Realizado',
                data_valor: new Date(dataReferencia),
            },
            select: { id: true, valor_nominal: true },
        });

        if (existeValor && valor_nominal === '') {
            await prismaTxn.serieVariavel.delete({
                where: {
                    id: existeValor.id,
                },
            });
        } else if (!existeValor && valor_nominal !== '') {
            await prismaTxn.serieVariavel.create({
                data: {
                    variavel_id: variavelInfo.id,
                    serie: 'Realizado',
                    data_valor: new Date(dataReferencia),
                    valor_nominal: valor_nominal,
                    atualizado_em: now,
                    atualizado_por: user.id,
                    conferida: conferida,
                    variavel_categorica_id: variavelInfo.variavel_categorica?.id,
                    variavel_categorica_valor_id: variavel_categorica_valor_id,
                },
            });
        } else if (existeValor && valor_nominal !== '') {
            if (existeValor.valor_nominal.toString() !== valor_nominal) {
                await prismaTxn.serieVariavel.update({
                    where: { id: existeValor.id },
                    data: {
                        valor_nominal: valor_nominal,
                        atualizado_em: now,
                        atualizado_por: user.id,
                        conferida: conferida,
                        variavel_categorica_id: variavelInfo.variavel_categorica?.id,
                        variavel_categorica_valor_id: variavel_categorica_valor_id,
                    },
                });
            }
        }

        if (!variavelInfo.acumulativa) {
            await this.atualizaSerieVariavelAcumulada(
                variavelInfo,
                prismaTxn,
                now,
                user,
                dataReferencia,
                valor_nominal,
                conferida
            );
        }
    }

    private async atualizaSerieVariavelAcumulada(
        variavelInfo: VariavelComCategorica,
        prismaTxn: Prisma.TransactionClient,
        now: Date,
        user: PessoaFromJwt,
        dataReferencia: Date,
        valor_nominal: string,
        conferida: boolean
    ) {
        const existeValorAcumulado = await prismaTxn.serieVariavel.findFirst({
            where: {
                variavel_id: variavelInfo.id,
                serie: 'RealizadoAcumulado',
                data_valor: new Date(dataReferencia),
            },
            select: { id: true },
        });

        if (existeValorAcumulado) {
            await prismaTxn.serieVariavel.update({
                where: { id: existeValorAcumulado.id },
                data: {
                    valor_nominal: valor_nominal,
                    atualizado_em: now,
                    atualizado_por: user.id,
                    conferida: conferida,
                },
            });
        } else if (valor_nominal !== '') {
            await prismaTxn.serieVariavel.create({
                data: {
                    variavel_id: variavelInfo.id,
                    serie: 'RealizadoAcumulado',
                    data_valor: new Date(dataReferencia),
                    valor_nominal: valor_nominal,
                    atualizado_em: now,
                    atualizado_por: user.id,
                    conferida: conferida,
                },
            });
        }
    }
}
