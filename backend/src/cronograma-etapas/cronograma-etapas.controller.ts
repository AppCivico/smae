import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { FindOneParams } from '../common/decorators/find-params';
import { MetaController, MetaSetorialController } from '../meta/meta.controller';
import { CronogramaEtapaService } from './cronograma-etapas.service';
import { FilterCronogramaEtapaDto } from './dto/filter-cronograma-etapa.dto';
import { ListCronogramaEtapaDto } from './dto/list-cronograma-etapa.dto';
import { UpdateCronogramaEtapaDto } from './dto/update-cronograma-etapa.dto';
import { TipoPdm } from '@prisma/client';
import { API_TAGS_CRONOGRAMA } from '../cronograma/cronograma.controller';

@ApiTags(API_TAGS_CRONOGRAMA)
@Controller('cronograma-etapa')
export class CronogramaEtapaController {
    private tipo: TipoPdm = 'PDM';
    constructor(private readonly cronogramaEtapaService: CronogramaEtapaService) {}

    @ApiBearerAuth('access-token')
    @Get()
    @Roles(MetaController.ReadPerm)
    async findAll(
        @Query() filters: FilterCronogramaEtapaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListCronogramaEtapaDto> {
        return { linhas: await this.cronogramaEtapaService.findAll(this.tipo, filters, user, false) };
    }

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(MetaController.WritePerm)
    async update(@Body() updateCronogramaEtapaDto: UpdateCronogramaEtapaDto, @CurrentUser() user: PessoaFromJwt) {
        return await this.cronogramaEtapaService.update(this.tipo, updateCronogramaEtapaDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(MetaController.WritePerm)
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.cronogramaEtapaService.delete(this.tipo, +params.id, user);
        return '';
    }
}

@ApiTags(API_TAGS_CRONOGRAMA)
@Controller(['plano-setorial-cronograma-etapa', 'programa-de-metas-cronograma-etapa'])
export class CronogramaEtapaPSController {
    private tipo: TipoPdm = 'PS';
    constructor(private readonly cronogramaEtapaService: CronogramaEtapaService) {}

    @ApiBearerAuth('access-token')
    @Get()
    @Roles(MetaSetorialController.ReadPerm)
    async findAll(
        @Query() filters: FilterCronogramaEtapaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListCronogramaEtapaDto> {
        return { linhas: await this.cronogramaEtapaService.findAll(this.tipo, filters, user, false) };
    }

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(MetaSetorialController.WritePerm)
    async update(@Body() updateCronogramaEtapaDto: UpdateCronogramaEtapaDto, @CurrentUser() user: PessoaFromJwt) {
        return await this.cronogramaEtapaService.update(this.tipo, updateCronogramaEtapaDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(MetaSetorialController.WritePerm)
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.cronogramaEtapaService.delete(this.tipo, +params.id, user);
        return '';
    }
}
