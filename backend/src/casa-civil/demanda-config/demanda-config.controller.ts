import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { FindOneParams, FindTwoParams } from 'src/common/decorators/find-params';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { DemandaConfigService } from './demanda-config.service';
import { CreateDemandaConfigDto } from './dto/create-demanda-config.dto';
import { AppendDemandaConfigAnexoDto } from './dto/demanda-config-anexo.dto';
import { FilterDemandaConfigDto } from './dto/filter-demanda-config.dto';
import { UpdateDemandaConfigDto } from './dto/update-demanda-config.dto';
import { DemandaConfigAnexoDto, DemandaConfigDetailDto, ListDemandaConfigDto } from './entities/demanda-config.entity';

@ApiTags('Configurações - Demandas')
@Controller('demanda-config')
export class DemandaConfigController {
    constructor(private readonly demandaConfigService: DemandaConfigService) {}

    @Post('')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroDemandaConfig.inserir'])
    async create(@Body() dto: CreateDemandaConfigDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.demandaConfigService.create(dto, user);
    }

    @Get()
    @ApiBearerAuth('access-token')
    @Roles(['CadastroDemandaConfig.listar'])
    async findAll(
        @Query() filters: FilterDemandaConfigDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListDemandaConfigDto> {
        return { linhas: await this.demandaConfigService.findAll(filters, user) };
    }

    @Get('ativo')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroDemandaConfig.listar'])
    async getActiveConfig(@CurrentUser() user: PessoaFromJwt): Promise<DemandaConfigDetailDto | null> {
        return await this.demandaConfigService.getActiveConfig();
    }

    @Get(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroDemandaConfig.listar'])
    async findOne(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<DemandaConfigDetailDto> {
        return await this.demandaConfigService.findOne(+params.id, user);
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroDemandaConfig.editar'])
    async update(
        @Param() params: FindOneParams,
        @Body() dto: UpdateDemandaConfigDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.demandaConfigService.update(+params.id, dto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroDemandaConfig.remover'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.demandaConfigService.remove(+params.id, user);
        return '';
    }

    @Post(':id/anexo')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroDemandaConfig.inserir'])
    async appendAnexo(
        @Param() params: FindOneParams,
        @Body() dto: AppendDemandaConfigAnexoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.demandaConfigService.appendAnexo(+params.id, dto, user);
    }

    @Get(':id/anexo')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroDemandaConfig.listar'])
    async listAnexos(
        @Param() params: FindOneParams,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<DemandaConfigAnexoDto[]> {
        return await this.demandaConfigService.listAnexos(+params.id, user);
    }
}
