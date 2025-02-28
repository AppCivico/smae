import { ForbiddenException, Injectable } from '@nestjs/common';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { Date2YMD } from '../common/date2ymd';
import { TipoPdmType } from '../common/decorators/current-tipo-pdm';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { MetaService } from '../meta/meta.service';
import { AnaliseQualitativaDocumentoDto, CreateAnaliseQualitativaDto } from '../mf/metas/dto/mf-meta-analise-quali.dto';
import { FechamentoDto } from '../mf/metas/dto/mf-meta-fechamento.dto';
import { RiscoDto } from '../mf/metas/dto/mf-meta-risco.dto';
import { MetasAnaliseQualiService } from '../mf/metas/metas-analise-quali.service';
import { MetasFechamentoService } from '../mf/metas/metas-fechamento.service';
import { MetasRiscoService } from '../mf/metas/metas-risco.service';
import { PrismaService } from '../prisma/prisma.service';
import { FilterPsCiclo } from './dto/update-pdm-ciclo.dto';
import {
    CicloFisicoPSDto,
    CicloRevisaoDto,
    CiclosRevisaoDto,
    DocumentoEditavelTipo,
    ListPSCicloDto,
    PsListAnaliseQualitativaDto,
    PsListFechamentoDto,
    PsListRiscoDto,
} from './entities/pdm-ciclo.entity';

/**
 * Gerencia ciclos do Planejamento Estratégico e controla permissões
 */
@Injectable()
export class PsCicloService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly metaService: MetaService,
        private readonly riscoService: MetasRiscoService,
        private readonly fechamentoService: MetasFechamentoService,
        private readonly analiseService: MetasAnaliseQualiService
    ) {}

    /**
     * Busca ciclos disponíveis com base nos filtros
     */
    async findAll(tipo: TipoPdmType, params: FilterPsCiclo, user?: PessoaFromJwt): Promise<ListPSCicloDto> {
        if (params.meta_id && user) {
            await this.metaService.assertMetaWriteOrThrow(tipo, params.meta_id, user, 'monitoramento', 'readonly');
        }

        const ciclos = await this.prisma.cicloFisico.findMany({
            where: {
                pdm_id: params.pdm_id,
                data_ciclo: {
                    gt: params.apenas_futuro ? new Date(Date.now()) : undefined,
                },
            },
            orderBy: [{ data_ciclo: 'desc' }],
        });

        const retorno = ciclos.map((ciclo) => {
            return {
                id: ciclo.id,
                data_ciclo: Date2YMD.toString(ciclo.data_ciclo),
                ativo: ciclo.ativo,
            } satisfies CicloFisicoPSDto;
        });

        let ultimaRevisao = null;
        let documentos_editaveis: DocumentoEditavelTipo[] = [];

        if (params.meta_id) {
            const latestCycle = ciclos.length > 0 ? ciclos[0] : null;

            if (latestCycle) {
                const [analiseData, riscoData, fechamentoData] = await Promise.all([
                    this.analiseService.getMetaAnaliseQualitativa(
                        {
                            ciclo_fisico_id: latestCycle.id,
                            meta_id: params.meta_id,
                            apenas_ultima_revisao: true,
                        },
                        null,
                        null
                    ),

                    this.riscoService.getMetaRisco(
                        {
                            ciclo_fisico_id: latestCycle.id,
                            meta_id: params.meta_id,
                            apenas_ultima_revisao: true,
                        },
                        null,
                        null
                    ),

                    this.fechamentoService.getMetaFechamento(
                        {
                            ciclo_fisico_id: latestCycle.id,
                            meta_id: params.meta_id,
                            apenas_ultima_revisao: true,
                        },
                        null,
                        null
                    ),
                ]);

                const analise = analiseData.analises.length > 0 ? analiseData.analises[0] : null;
                const risco = riscoData.riscos.length > 0 ? riscoData.riscos[0] : null;
                const fechamento = fechamentoData.fechamentos.length > 0 ? fechamentoData.fechamentos[0] : null;

                ultimaRevisao = { analise, risco, fechamento };

                // Determina documentos editáveis para o ciclo ativo
                if (latestCycle.ativo) {
                    documentos_editaveis = await this.determinaDocumentosEditaveis(
                        params.meta_id,
                        latestCycle.id,
                        latestCycle.ativo
                    );
                }
            }
        }

        return {
            linhas: retorno,
            ultima_revisao: ultimaRevisao,
            documentos_editaveis,
        };
    }

    /**
     * Verifica ciclo ativo e retorna estado
     */
    private async verificaCicloAtivo(cicloId: number): Promise<boolean> {
        const ciclo = await this.prisma.cicloFisico.findUnique({
            where: { id: cicloId },
        });

        if (!ciclo) {
            throw new ForbiddenException('Ciclo não encontrado');
        }

        return ciclo.ativo;
    }

    /**
     * Verifica se existe fechamento para a meta
     */
    private async verificaFechamento(metaId: number, cicloId: number): Promise<void> {
        const fechamentoExistente = await this.prisma.metaCicloFisicoFechamento.findFirst({
            where: {
                meta_id: metaId,
                ciclo_fisico_id: cicloId,
            },
        });

        if (fechamentoExistente) {
            throw new ForbiddenException('Não é possível editar a análise após o fechamento do ciclo para esta meta');
        }
    }

    /**
     * Determina quais documentos podem ser editados com base no fluxo
     */
    private async determinaDocumentosEditaveis(
        metaId: number,
        cicloId: number,
        cicloAtivo: boolean
    ): Promise<DocumentoEditavelTipo[]> {
        if (!cicloAtivo) return [];

        const [analiseExistente, riscoExistente, fechamentoExistente] = await Promise.all([
            this.prisma.metaCicloFisicoAnalise.count({
                where: { meta_id: metaId, ciclo_fisico_id: cicloId, ultima_revisao: true, removido_em: null },
            }),
            this.prisma.metaCicloFisicoRisco.count({
                where: { meta_id: metaId, ciclo_fisico_id: cicloId, ultima_revisao: true, removido_em: null },
            }),
            this.prisma.metaCicloFisicoFechamento.count({
                where: { meta_id: metaId, ciclo_fisico_id: cicloId, ultima_revisao: true, removido_em: null },
            }),
        ]);

        // Se o fechamento já existe, nada mais pode ser editado
        if (fechamentoExistente) return [];

        // Documentos editáveis baseados no fluxo
        const documentosEditaveis: DocumentoEditavelTipo[] = [];

        // Análise pode ser editada se não houver fechamento
        documentosEditaveis.push('analise');

        // Risco pode ser editado se houver análise e não houver fechamento
        if (analiseExistente) {
            documentosEditaveis.push('risco');
        }

        // Fechamento pode ser editado se houver risco e análise
        if (analiseExistente && riscoExistente) {
            documentosEditaveis.push('fechamento');
        }

        return documentosEditaveis;
    }

    /**
     * Verifica permissão de escrita e estado do ciclo
     */
    private async verificaPermissaoEscritaBase(
        tipo: TipoPdmType,
        metaId: number,
        cicloId: number,
        user: PessoaFromJwt,
        verificarFechamento = false,
        tipoDocumento?: DocumentoEditavelTipo
    ): Promise<boolean> {
        await this.metaService.assertMetaWriteOrThrow(tipo, metaId, user, 'monitoramento', 'readwrite');

        const cicloAtivo = await this.verificaCicloAtivo(cicloId);
        if (!cicloAtivo) {
            throw new ForbiddenException('Não é possível editar um ciclo inativo');
        }

        if (verificarFechamento) {
            await this.verificaFechamento(metaId, cicloId);
        }

        if (tipoDocumento) {
            const documentosEditaveis = await this.determinaDocumentosEditaveis(metaId, cicloId, cicloAtivo);

            if (!documentosEditaveis.includes(tipoDocumento)) {
                const mensagens = {
                    analise: 'Não é possível editar a análise no estado atual do ciclo',
                    risco: 'É necessário realizar a análise qualitativa antes do risco',
                    fechamento:
                        'É necessário realizar a análise qualitativa e a avaliação de risco antes do fechamento',
                };
                throw new ForbiddenException(mensagens[tipoDocumento]);
            }
        }

        return true;
    }

    async getCicloRevisoes(
        tipo: TipoPdmType,
        metaId: number,
        cicloId: number,
        user: PessoaFromJwt
    ): Promise<CiclosRevisaoDto> {
        await this.metaService.assertMetaWriteOrThrow(tipo, metaId, user, 'monitoramento', 'readonly');

        const cicloAtual = await this.prisma.cicloFisico.findUnique({
            where: { id: cicloId },
        });

        if (!cicloAtual) {
            throw new ForbiddenException('Ciclo não encontrado');
        }

        // Get all monitoring documents for this meta and cycle
        const [analiseAtual, riscoAtual, fechamentoAtual] = await Promise.all([
            this.analiseService.getMetaAnaliseQualitativa(
                {
                    ciclo_fisico_id: cicloId,
                    meta_id: metaId,
                    apenas_ultima_revisao: true,
                },
                null,
                null
            ),

            this.riscoService.getMetaRisco(
                {
                    ciclo_fisico_id: cicloId,
                    meta_id: metaId,
                    apenas_ultima_revisao: true,
                },
                null,
                null
            ),

            this.fechamentoService.getMetaFechamento(
                {
                    ciclo_fisico_id: cicloId,
                    meta_id: metaId,
                    apenas_ultima_revisao: true,
                },
                null,
                null
            ),
        ]);

        // Determine quais documentos podem ser editados
        const documentosEditaveis = await this.determinaDocumentosEditaveis(metaId, cicloId, cicloAtual.ativo);

        const atual: CicloRevisaoDto = {
            analise: analiseAtual.analises.length > 0 ? analiseAtual.analises[0] : null,
            risco: riscoAtual.riscos.length > 0 ? riscoAtual.riscos[0] : null,
            fechamento: fechamentoAtual.fechamentos.length > 0 ? fechamentoAtual.fechamentos[0] : null,
        };

        const cicloAnterior = await this.prisma.cicloFisico.findFirst({
            where: {
                pdm_id: cicloAtual.pdm_id,
                data_ciclo: {
                    lt: cicloAtual.data_ciclo,
                },
            },
            orderBy: {
                data_ciclo: 'desc',
            },
        });

        let anterior: CicloRevisaoDto | null = null;

        if (cicloAnterior) {
            const [analiseAnterior, riscoAnterior, fechamentoAnterior] = await Promise.all([
                this.analiseService.getMetaAnaliseQualitativa(
                    {
                        ciclo_fisico_id: cicloAnterior.id,
                        meta_id: metaId,
                        apenas_ultima_revisao: true,
                    },
                    null,
                    null
                ),

                this.riscoService.getMetaRisco(
                    {
                        ciclo_fisico_id: cicloAnterior.id,
                        meta_id: metaId,
                        apenas_ultima_revisao: true,
                    },
                    null,
                    null
                ),

                this.fechamentoService.getMetaFechamento(
                    {
                        ciclo_fisico_id: cicloAnterior.id,
                        meta_id: metaId,
                        apenas_ultima_revisao: true,
                    },
                    null,
                    null
                ),
            ]);

            anterior = {
                analise: analiseAnterior.analises.length > 0 ? analiseAnterior.analises[0] : null,
                risco: riscoAnterior.riscos.length > 0 ? riscoAnterior.riscos[0] : null,
                fechamento: fechamentoAnterior.fechamentos.length > 0 ? fechamentoAnterior.fechamentos[0] : null,
            };
        }

        return {
            atual,
            anterior,
            documentos_editaveis: documentosEditaveis,
        };
    }

    /**
     * Adiciona análise qualitativa
     */
    async addMetaAnaliseQualitativa(
        tipo: TipoPdmType,
        pdmId: number,
        cicloId: number,
        metaId: number,
        dto: CreateAnaliseQualitativaDto,
        user: PessoaFromJwt
    ): Promise<RecordWithId> {
        await this.verificaPermissaoEscritaBase(tipo, metaId, cicloId, user, true, 'analise');

        return await this.analiseService.addMetaAnaliseQualitativaInterno(dto, user);
    }

    /**
     * Adiciona documento à análise
     */
    async addMetaAnaliseQualitativaDocumento(
        tipo: TipoPdmType,
        pdmId: number,
        cicloId: number,
        metaId: number,
        dto: AnaliseQualitativaDocumentoDto,
        user: PessoaFromJwt
    ): Promise<RecordWithId> {
        await this.verificaPermissaoEscritaBase(tipo, metaId, cicloId, user, true, 'analise');
        return await this.analiseService.addMetaAnaliseQualitativaDocumentoInterno(dto, user);
    }

    /**
     * Remove documento da análise
     */
    async deleteMetaAnaliseQualitativaDocumento(
        tipo: TipoPdmType,
        pdmId: number,
        cicloId: number,
        metaId: number,
        documentoId: number,
        user: PessoaFromJwt
    ): Promise<void> {
        await this.verificaPermissaoEscritaBase(tipo, metaId, cicloId, user, true, 'analise');
        await this.analiseService.deleteMetaAnaliseQualitativaDocumentoInterno(documentoId, user);
    }

    /**
     * Adiciona registro de risco
     */
    async addMetaRisco(
        tipo: TipoPdmType,
        pdmId: number,
        cicloId: number,
        metaId: number,
        dto: RiscoDto,
        user: PessoaFromJwt
    ): Promise<RecordWithId> {
        await this.verificaPermissaoEscritaBase(tipo, metaId, cicloId, user, true, 'risco');
        return await this.riscoService.addMetaRiscoInterno(dto, user);
    }

    /**
     * Adiciona registro de fechamento
     */
    async addMetaFechamento(
        tipo: TipoPdmType,
        pdmId: number,
        cicloId: number,
        metaId: number,
        dto: FechamentoDto,
        user: PessoaFromJwt
    ): Promise<RecordWithId> {
        await this.verificaPermissaoEscritaBase(tipo, metaId, cicloId, user, false, 'fechamento');
        return await this.fechamentoService.addMetaFechamentoInterno(dto, user);
    }

    private async findPreviousCycle(currentCycleId: number, pdmId: number): Promise<number | null> {
        const currentCycle = await this.prisma.cicloFisico.findUnique({
            where: { id: currentCycleId },
            select: { data_ciclo: true },
        });

        if (!currentCycle) return null;

        const previousCycle = await this.prisma.cicloFisico.findFirst({
            where: {
                pdm_id: pdmId,
                data_ciclo: {
                    lt: currentCycle.data_ciclo,
                },
            },
            orderBy: { data_ciclo: 'desc' },
        });

        return previousCycle ? previousCycle.id : null;
    }

    /**
     * Obtém análise qualitativa atual e anterior
     */
    async getMetaAnaliseQualitativaWithPrevious(
        tipo: TipoPdmType,
        pdmId: number,
        cicloId: number,
        metaId: number,
        user: PessoaFromJwt
    ): Promise<PsListAnaliseQualitativaDto> {
        await this.metaService.assertMetaWriteOrThrow(
            tipo,
            metaId,
            user,
            'monitoramento de análise qualitativa',
            'readonly'
        );

        const currentData = await this.analiseService.getMetaAnaliseQualitativa(
            {
                ciclo_fisico_id: cicloId,
                meta_id: metaId,
                apenas_ultima_revisao: false,
            },
            null,
            null
        );

        const previousCycleId = await this.findPreviousCycle(cicloId, pdmId);

        let previousData = null;
        if (previousCycleId) {
            previousData = await this.analiseService.getMetaAnaliseQualitativa(
                {
                    ciclo_fisico_id: previousCycleId,
                    meta_id: metaId,
                    apenas_ultima_revisao: false,
                },
                null,
                null
            );
        }

        // Determina documentos editáveis
        const cicloAtivo = await this.verificaCicloAtivo(cicloId);
        const documentos_editaveis = await this.determinaDocumentosEditaveis(metaId, cicloId, cicloAtivo);

        return {
            corrente: currentData,
            anterior: previousData,
            documentos_editaveis,
        };
    }

    /**
     * Obtém riscos atual e anterior
     */
    async getMetaRiscoWithPrevious(
        tipo: TipoPdmType,
        pdmId: number,
        cicloId: number,
        metaId: number,
        user: PessoaFromJwt
    ): Promise<PsListRiscoDto> {
        await this.metaService.assertMetaWriteOrThrow(tipo, metaId, user, 'monitoramento de risco', 'readonly');

        const currentData = await this.riscoService.getMetaRisco(
            {
                ciclo_fisico_id: cicloId,
                meta_id: metaId,
                apenas_ultima_revisao: false,
            },
            null,
            null
        );

        const previousCycleId = await this.findPreviousCycle(cicloId, pdmId);

        let previousData = null;
        if (previousCycleId) {
            previousData = await this.riscoService.getMetaRisco(
                {
                    ciclo_fisico_id: previousCycleId,
                    meta_id: metaId,
                    apenas_ultima_revisao: false,
                },
                null,
                null
            );
        }

        // Determina documentos editáveis
        const cicloAtivo = await this.verificaCicloAtivo(cicloId);
        const documentos_editaveis = await this.determinaDocumentosEditaveis(metaId, cicloId, cicloAtivo);

        return {
            corrente: currentData,
            anterior: previousData,
            documentos_editaveis,
        };
    }

    /**
     * Obtém fechamentos atual e anterior
     */
    async getMetaFechamentoWithPrevious(
        tipo: TipoPdmType,
        pdmId: number,
        cicloId: number,
        metaId: number,
        user: PessoaFromJwt
    ): Promise<PsListFechamentoDto> {
        await this.metaService.assertMetaWriteOrThrow(tipo, metaId, user, 'monitoramento de fechamento', 'readonly');

        const currentData = await this.fechamentoService.getMetaFechamento(
            {
                ciclo_fisico_id: cicloId,
                meta_id: metaId,
                apenas_ultima_revisao: false,
            },
            null,
            null
        );

        const previousCycleId = await this.findPreviousCycle(cicloId, pdmId);

        let previousData = null;
        if (previousCycleId) {
            previousData = await this.fechamentoService.getMetaFechamento(
                {
                    ciclo_fisico_id: previousCycleId,
                    meta_id: metaId,
                    apenas_ultima_revisao: false,
                },
                null,
                null
            );
        }

        // Determina documentos editáveis
        const cicloAtivo = await this.verificaCicloAtivo(cicloId);
        const documentos_editaveis = await this.determinaDocumentosEditaveis(metaId, cicloId, cicloAtivo);

        return {
            corrente: currentData,
            anterior: previousData,
            documentos_editaveis,
        };
    }
}
