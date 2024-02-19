import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { FindOneParams } from '../common/decorators/find-params';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { CreateEtapaDto } from '../etapa/dto/create-etapa.dto';
import { FilterEtapaSemCronoIdDto } from '../etapa/dto/filter-etapa.dto';
import { ListEtapaDto } from '../etapa/dto/list-etapa.dto';
import { EtapaService } from '../etapa/etapa.service';
import { CronogramaService } from './cronograma.service';
import { CreateCronogramaDto } from './dto/create-cronograma.dto';
import { FilterCronogramaDto } from './dto/fillter-cronograma.dto';
import { ListCronogramaDto } from './dto/list-cronograma.dto';
import { UpdateCronogramaDto } from './dto/update-cronograma.dto';

@ApiTags('Cronograma')
@Controller('cronograma')
export class CronogramaController {
    constructor(
        private readonly cronogramaService: CronogramaService,
        private readonly etapaService: EtapaService
    ) {}

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroCronograma.inserir', 'CadastroMeta.inserir')
    async create(
        @Body() createCronogramaDto: CreateCronogramaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.cronogramaService.create(createCronogramaDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    @Roles(
        'CadastroCronograma.editar',
        'CadastroMeta.inserir',
        'PDM.admin_cp',
        'PDM.coordenador_responsavel_cp',
        'PDM.ponto_focal'
    )
    async findAll(@Query() filters: FilterCronogramaDto): Promise<ListCronogramaDto> {
        return { linhas: await this.cronogramaService.findAll(filters) };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroCronograma.editar', 'CadastroMeta.inserir')
    async update(
        @Param() params: FindOneParams,
        @Body() updateCronogramaDto: UpdateCronogramaDto,
        @CurrentUser() user: PessoaFromJwt
    ) {
        return await this.cronogramaService.update(+params.id, updateCronogramaDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroCronograma.remover', 'CadastroMeta.inserir')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.cronogramaService.remove(+params.id, user);
        return '';
    }

    @Post(':id/etapa')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroCronograma.inserir', 'CadastroMeta.inserir')
    async createEtapa(
        @Body() createEtapaDto: CreateEtapaDto,
        @Param() params: FindOneParams,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.etapaService.create(+params.id, createEtapaDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get(':id/etapa')
    @Roles(
        'CadastroCronograma.editar',
        'CadastroMeta.inserir',
        'PDM.admin_cp',
        'PDM.coordenador_responsavel_cp',
        'PDM.ponto_focal'
    )
    async findAllEtapas(
        @Query() filters: FilterEtapaSemCronoIdDto,
        @Param() params: FindOneParams
    ): Promise<ListEtapaDto> {
        return {
            linhas: await this.etapaService.findAll({
                ...filters,
                cronograma_id: +params.id,
            }),
        };
    }
}
