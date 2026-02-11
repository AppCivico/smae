import { Body, Controller, Get, Logger, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { task_type } from '@prisma/client';
import { ApiLogRestoreService } from '../api-logs/restore/api-log-restore.service';
import { AtualizacaoEmLoteService } from '../atualizacao-em-lote/atualizacao-em-lote.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { FindOneParams } from '../common/decorators/find-params';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { ReportsService } from '../reports/relatorios/reports.service';
import { TaskService } from '../task/task.service';
import { TransfereGovSyncService } from '../transfere-gov-sync/transfere-gov-sync.service';
import { RestaurarDescricaoResponseDto } from '../upload/dto/restaurar-descricao-response.dto';
import { UploadService } from '../upload/upload.service';
import { CreateApiLogDayDto } from './dto/api-log/create-api-log-day.dto';
import { RefreshCacheDto } from './dto/demanda/refresh-cache.dto';
import { TransfereGovSyncDto } from './dto/transfere-gov/transfere-gov-sync.dto';
import { ProcessarThumbnailsQueryDto } from './dto/upload/processar-thumbnails-query.dto';
import { SolicitarPreviewDto, SolicitarPreviewResponseDto } from './dto/upload/solicitar-preview.dto';
import { SolicitarThumbnailDto, SolicitarThumbnailResponseDto } from './dto/upload/solicitar-thumbnail.dto';

class RestoreDescriptionResponseDto extends RestaurarDescricaoResponseDto {
    message: string;
}

/**
 * Controller centralizado para operações administrativas de sistema
 * Consolida endpoints de reprocessamento, sincronização e restauração de dados
 */
@Controller()
@ApiTags('SysAdmin - Operações de Reprocessamento e Sincronização')
@ApiBearerAuth('access-token')
export class SysadminController {
    constructor(
        private readonly taskService: TaskService,
        private readonly uploadService: UploadService,
        private readonly transfereGovSyncService: TransfereGovSyncService,
        private readonly apiRestoreService: ApiLogRestoreService,
        private readonly reportsService: ReportsService,
        private readonly atualizacaoEmLoteService: AtualizacaoEmLoteService
    ) {}

    // ============================================================
    // ENDPOINTS DE DEMANDA - Cache de demandas
    // ============================================================

    /**
     * Atualiza o cache de demandas (todas ou por tipo específico)
     * Gera task assíncrona para atualização de geocamadas, geopontos, resumo, etc.
     */
    @Post('demanda/refresh-cache')
    @Roles(['CadastroDemanda.validar'])
    @ApiOperation({
        summary: 'Atualiza cache de demandas',
        description:
            'Dispara atualização do cache de demandas. Pode atualizar tudo ou apenas um tipo específico (geocamadas, geopoints, summary, full, individual).',
    })
    @ApiResponse({ status: 201, description: 'Task de atualização criada com sucesso' })
    async refreshDemandaCache(@Body() dto: RefreshCacheDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.taskService.create(
            {
                type: 'refresh_demanda',
                params: {
                    cache_type: dto.tipo,
                    force_all: !dto.tipo,
                    force_geocamadas: dto.force_geocamadas,
                },
            },
            user
        );
    }

    /**
     * Atualiza o cache de uma demanda específica
     */
    @Post('demanda/:id/refresh-cache')
    @Roles(['CadastroDemanda.validar'])
    @ApiOperation({
        summary: 'Atualiza cache de demanda específica',
        description: 'Dispara atualização do cache para uma única demanda identificada pelo ID',
    })
    @ApiResponse({ status: 201, description: 'Task de atualização criada com sucesso' })
    async refreshIndividualDemandaCache(
        @Param() params: FindOneParams,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.taskService.create(
            {
                type: 'refresh_demanda',
                params: {
                    demanda_id: +params.id,
                },
            },
            user
        );
    }

    // ============================================================
    // ENDPOINTS DE UPLOAD - Processamento de thumbnails e previews
    // ============================================================

    /**
     * Processa thumbnails pendentes em lote
     * Agenda geração de miniaturas para arquivos de imagem
     */
    @Post('processar-thumbnails-pendentes')
    @Roles(['SMAE.superadmin'])
    @ApiOperation({
        summary: 'Processa thumbnails pendentes em lote',
        description:
            'Agenda tarefas de geração de thumbnails para arquivos que ainda não possuem miniatura. Pode filtrar por tipo e forçar reprocessamento.',
    })
    @ApiResponse({ status: 201, description: 'Processamento iniciado' })
    async processarThumbnailsPendentes(
        @CurrentUser() user: PessoaFromJwt,
        @Query() dto: ProcessarThumbnailsQueryDto
    ): Promise<{ total: number; agendados: number; pulados: number; message: string }> {
        const result = await this.uploadService.processarThumbnailsPendentes(user.id, dto.tipo, dto.reprocessar);

        return {
            ...result,
            message: `Processados ${result.total} arquivos. Agendados: ${result.agendados}, Pulados: ${result.pulados}.`,
        };
    }

    /**
     * Solicita geração de thumbnail para um arquivo específico
     */
    @Post('solicitar-thumbnail')
    @Roles(['SMAE.superadmin'])
    @ApiOperation({
        summary: 'Solicita geração de thumbnail para arquivo específico',
        description: 'Agenda a geração de miniatura para um arquivo identificado pelo token',
    })
    @ApiResponse({ status: 201, description: 'Solicitação aceita' })
    async solicitarThumbnail(
        @Body() dto: SolicitarThumbnailDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<SolicitarThumbnailResponseDto> {
        return await this.uploadService.solicitarThumbnail(dto.token, user.id);
    }

    /**
     * Solicita geração de preview para um documento específico
     */
    @Post('solicitar-preview')
    @Roles(['SMAE.superadmin'])
    @ApiOperation({
        summary: 'Solicita geração de preview para documento específico',
        description: 'Agenda a geração de preview (conversão para PDF ou redimensionamento) para um documento',
    })
    @ApiResponse({ status: 201, description: 'Solicitação aceita' })
    async solicitarPreview(
        @Body() dto: SolicitarPreviewDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<SolicitarPreviewResponseDto> {
        return await this.uploadService.solicitarPreview(dto.token, user.id);
    }

    /**
     * Processa previews pendentes em lote
     * Agenda geração de previews para documentos
     */
    @Post('processar-previews-pendentes')
    @Roles(['SMAE.superadmin'])
    @ApiOperation({
        summary: 'Processa previews pendentes em lote',
        description: 'Agenda tarefas de geração de previews para documentos que ainda não possuem preview gerado.',
    })
    @ApiResponse({ status: 201, description: 'Processamento iniciado' })
    async processarPreviewsPendentes(
        @CurrentUser() user: PessoaFromJwt
    ): Promise<{ total: number; agendados: number; pulados: number; message: string }> {
        const result = await this.uploadService.processarPreviewsPendentes(user.id);

        return {
            ...result,
            message: `Processados ${result.total} arquivos. Agendados: ${result.agendados}, Pulados: ${result.pulados}.`,
        };
    }

    /**
     * Restaura descrições de arquivos a partir dos metadados
     */
    @Post('admin/restore-descriptions')
    @Roles(['SMAE.sysadmin'])
    @ApiOperation({
        deprecated: true,
        summary: 'Restaura descrições de arquivos',
        description: 'Restaura as descrições dos arquivos a partir dos metadados armazenados',
    })
    @ApiResponse({ status: 201, description: 'Restauração concluída' })
    async restoreDescriptions(
        @Query('batchSize') batchSize = 50,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RestoreDescriptionResponseDto> {
        Logger.log(
            `User ${user.id} (${user.nome_exibicao}) initiated description restoration process with batchSize=${batchSize} `
        );

        const result = await this.uploadService.restauraDescricaoPeloMetadado(parseInt(String(batchSize), 10));

        return {
            ...result,
            message: `Successfully restored ${result.restored} descriptions of ${result.total} records. Skipped: ${result.skipped}, Errors: ${result.errors}.`,
        };
    }

    // ============================================================
    // ENDPOINTS DE TRANSFERE GOV - Sincronização de dados externos
    // ============================================================

    /**
     * Sincroniza comunicados do TransfereGov manualmente
     */
    @Post('transfere-gov/sync')
    @Roles(['TransfereGov.sincronizar'])
    @ApiOperation({
        summary: 'Sincroniza comunicados do TransfereGov',
        description: 'Executa sincronização manual dos comunicados da plataforma TransfereGov',
    })
    @ApiResponse({ status: 201, description: 'Sincronização concluída' })
    async manualSync(): Promise<TransfereGovSyncDto> {
        const newItems = await this.transfereGovSyncService.manualSync();
        return { novos_itens: newItems.map((item) => item.id) };
    }

    /**
     * Sincroniza transferências especiais do TransfereGov
     */
    @Post('transfere-gov/sync-transferencias-especiais')
    @Roles(['TransfereGov.sincronizar'])
    @ApiOperation({
        summary: 'Sincroniza transferências especiais do TransfereGov',
        description: 'Executa sincronização manual das transferências especiais (oportunidades especiais)',
    })
    @ApiResponse({ status: 201, description: 'Sincronização concluída' })
    async manualSyncOportunidadesEspeciais(): Promise<TransfereGovSyncDto> {
        const newItems = await this.transfereGovSyncService.manualSyncOportunidadesEspeciais();
        return { novos_itens: newItems.map((item) => item.id) };
    }

    /**
     * Sincroniza todas as transferências do TransfereGov
     */
    @Post('transfere-gov/sync-transferencias-completo')
    @Roles(['TransfereGov.sincronizar'])
    @ApiOperation({
        summary: 'Sincroniza todas as transferências do TransfereGov',
        description: 'Executa sincronização completa de todas as transferências disponíveis',
    })
    @ApiResponse({ status: 201, description: 'Sincronização concluída' })
    async manualSyncTransferencias(): Promise<TransfereGovSyncDto> {
        const newItems = await this.transfereGovSyncService.manualSyncTransferencias();
        return { novos_itens: newItems.map((item) => item.id) };
    }

    // ============================================================
    // ENDPOINTS DE API LOGS - Restauração e gerenciamento de logs
    // ============================================================

    /**
     * Restaura logs de API de um dia específico
     * Cria task assíncrona para restauração dos logs do DuckDB
     */
    @Post('logs/restore')
    @Roles(['SMAE.sysadmin'])
    @ApiOkResponse({
        description: 'ID da task criada para restauração.',
        schema: {
            example: { taskId: 123 },
        },
    })
    @ApiOperation({
        summary: 'Restaura logs de API de um dia específico',
        description: 'Cria task assíncrona para restaurar logs de API do DuckDB para o PostgreSQL',
    })
    @ApiResponse({ status: 201, description: 'Task de restauração criada com sucesso' })
    async restoreApiLogs(
        @Body() dto: CreateApiLogDayDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<{ taskId: number }> {
        const task = await this.taskService.create(
            {
                type: task_type.restore_api_log_day,
                params: {
                    date: dto.date,
                },
            },
            user
        );
        return { taskId: task.id };
    }

    /**
     * Remove logs restaurados de um dia específico
     */
    @Post('logs/drop')
    @Roles(['SMAE.sysadmin'])
    @ApiOperation({
        summary: 'Remove logs restaurados de um dia específico',
        description: 'Dropa dados restaurados do dia informado (UTC)',
    })
    @ApiResponse({
        status: 200,
        description: 'Drop concluído com sucesso.',
        schema: {
            example: {},
        },
    })
    @ApiResponse({
        status: 404,
        description: 'Nenhum log restaurado encontrado para o dia especificado.',
    })
    @ApiResponse({
        status: 400,
        description: 'Requisição inválida ou status incorreto.',
    })
    async dropApiLogs(@Body() dto: CreateApiLogDayDto): Promise<void> {
        await this.apiRestoreService.dropDay(dto);
    }

    // ============================================================
    // ENDPOINTS DE RELATÓRIOS - Sincronização de parâmetros
    // ============================================================

    /**
     * Sincroniza parâmetros dos relatórios
     * Atualiza a configuração de parâmetros disponíveis para geração de relatórios
     */
    @Get('relatorios/sync-parametros')
    @Roles(['SMAE.superadmin'])
    @ApiOperation({
        summary: 'Sincroniza parâmetros dos relatórios',
        description: 'Atualiza a configuração de parâmetros disponíveis para geração de relatórios no sistema',
    })
    @ApiResponse({ status: 200, description: 'Sincronização concluída' })
    async syncParametros() {
        await this.reportsService.syncRelatoriosParametros();
        return '';
    }

    // ============================================================
    // ENDPOINTS DE ATUALIZAÇÃO EM LOTE - Sincronização de operações
    // ============================================================

    /**
     * Sincroniza campo operacao_processada para registros de atualização em lote
     * Atualiza registros que não possuem este campo preenchido
     */
    @Post('atualizacao-em-lote/sync-operacoes-processadas')
    @Roles(['SMAE.superadmin'])
    @ApiOperation({
        summary: 'Sincroniza operações processadas de atualização em lote',
        description:
            'Sincroniza o campo operacao_processada para todos os registros que não possuem este campo preenchido',
    })
    @ApiResponse({ status: 201, description: 'Sincronização concluída' })
    async syncOperacoesProcessadas(
        @CurrentUser() user: PessoaFromJwt
    ): Promise<{ message: string; stats: { total: number; updated: number; errors: number } }> {
        const stats = await this.atualizacaoEmLoteService.syncOperacoesProcessadas();

        return {
            message: `Sincronização completa. ${stats.updated} de ${stats.total} registros foram atualizados com sucesso. ${stats.errors} erros ocorreram.`,
            stats,
        };
    }
}
