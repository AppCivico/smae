import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { FindOneParams } from 'src/common/decorators/find-params';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { TaskService } from '../../task/task.service';
import { DemandaService } from './demanda.service';
import { CreateDemandaDto } from './dto/create-demanda.dto';
import { FilterDemandaDto } from './dto/filter-demanda.dto';
import { RefreshCacheDto } from './dto/refresh-cache.dto';
import { UpdateDemandaDto } from './dto/create-demanda.dto';
import { DemandaDetailDto, DemandaHistoricoDto, ListDemandaDto } from './entities/demanda.entity';

@ApiTags('Casa Civil - Demandas')
@Controller('demanda')
export class DemandaController {
    constructor(
        private readonly demandaService: DemandaService,
        private readonly taskService: TaskService
    ) {}

    @Post('')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroDemanda.inserir'])
    async create(@Body() dto: CreateDemandaDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.demandaService.create(dto, user);
    }

    @Get()
    @ApiBearerAuth('access-token')
    @Roles(['CadastroDemanda.listar'])
    async findAll(@Query() filters: FilterDemandaDto, @CurrentUser() user: PessoaFromJwt): Promise<ListDemandaDto> {
        return await this.demandaService.findAll(filters, user);
    }

    @Get(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroDemanda.listar'])
    async findOne(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<DemandaDetailDto> {
        return await this.demandaService.findOne(+params.id, user, 'ReadOnly');
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroDemanda.editar'])
    async update(
        @Param() params: FindOneParams,
        @Body() dto: UpdateDemandaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.demandaService.update(+params.id, dto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroDemanda.remover'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.demandaService.remove(+params.id, user);
        return '';
    }

    @Get(':id/historico')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroDemanda.listar'])
    async getHistorico(
        @Param() params: FindOneParams,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<DemandaHistoricoDto[]> {
        return await this.demandaService.getHistorico(+params.id, user);
    }

    @Post('refresh-cache')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroDemanda.validar'])
    async refreshCache(
        @Body() dto: RefreshCacheDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
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

    @Post(':id/refresh-cache')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroDemanda.validar'])
    async refreshIndividualCache(
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
