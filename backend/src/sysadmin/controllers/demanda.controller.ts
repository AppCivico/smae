import { Body, Controller, Inject, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { FindOneParams } from '../../common/decorators/find-params';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { TaskService } from '../../task/task.service';
import { RefreshCacheDto } from '../dto/demanda/refresh-cache.dto';

@ApiTags('SysAdmin - Operações de Reprocessamento e Sincronização')
@ApiBearerAuth('access-token')
@Controller()
export class SysadminDemandaController {
    constructor(
        @Inject(TaskService)
        private readonly taskService: TaskService
    ) {}

    /**
     * Atualiza o cache de demandas (todas ou por tipo específico)
     * Gera task assíncrona para atualização de geocamadas, geopontos, resumo, etc.
     */
    @Post('demanda/refresh-cache')
    @Roles(['CadastroDemanda.validar'], 'Atualiza cache de demandas')
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
    @Roles(['CadastroDemanda.validar'], 'Atualiza cache de demanda específica')
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
}
