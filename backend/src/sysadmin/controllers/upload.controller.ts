import { Body, Controller, Get, Inject, Logger, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { UploadService } from '../../upload/upload.service';
import { RestaurarDescricaoResponseDto } from '../../upload/dto/restaurar-descricao-response.dto';
import { ProcessarThumbnailsQueryDto } from '../dto/upload/processar-thumbnails-query.dto';
import { SolicitarPreviewDto, SolicitarPreviewResponseDto } from '../dto/upload/solicitar-preview.dto';
import { SolicitarThumbnailDto, SolicitarThumbnailResponseDto } from '../dto/upload/solicitar-thumbnail.dto';

class RestoreDescriptionResponseDto extends RestaurarDescricaoResponseDto {
    message: string;
}

@ApiTags('SysAdmin - Operações de Reprocessamento e Sincronização')
@ApiBearerAuth('access-token')
@Controller()
export class SysadminUploadController {
    constructor(
        @Inject(UploadService)
        private readonly uploadService: UploadService
    ) {}

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
    @Roles(['SMAE.superadmin'])
    @ApiQuery({
        name: 'batchSize',
        required: false,
        type: Number,
        description: 'Número de registros a processar por lote',
    })
    @ApiOperation({
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
}
