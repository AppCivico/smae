import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { TipoPdm } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { FindOneParams } from '../common/decorators/find-params';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { CreateEtapaDto } from '../etapa/dto/create-etapa.dto';
import { EtapaService } from '../etapa/etapa.service';
import { MetaController, MetaSetorialController } from '../meta/meta.controller';
import { CronogramaService } from './cronograma.service';
import { CreateCronogramaDto } from './dto/create-cronograma.dto';
import { FilterCronogramaDto } from './dto/fillter-cronograma.dto';
import { ListCronogramaDto } from './dto/list-cronograma.dto';
import { UpdateCronogramaDto } from './dto/update-cronograma.dto';

export const API_TAGS_CRONOGRAMA = 'Cronograma - PDM e PS';
@ApiTags(API_TAGS_CRONOGRAMA)
@Controller('cronograma')
export class CronogramaController {
    private tipo: TipoPdm = 'PDM';
    constructor(
        private readonly cronogramaService: CronogramaService,
        private readonly etapaService: EtapaService
    ) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(MetaController.WritePerm)
    async create(
        @Body() createCronogramaDto: CreateCronogramaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.cronogramaService.create(this.tipo, createCronogramaDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    @Roles(MetaController.ReadPerm)
    async findAll(
        @Query() filters: FilterCronogramaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListCronogramaDto> {
        return { linhas: await this.cronogramaService.findAll(this.tipo, filters, user) };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(MetaController.WritePerm)
    async update(
        @Param() params: FindOneParams,
        @Body() updateCronogramaDto: UpdateCronogramaDto,
        @CurrentUser() user: PessoaFromJwt
    ) {
        return await this.cronogramaService.update(this.tipo, +params.id, updateCronogramaDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(MetaController.WritePerm)
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.cronogramaService.remove(this.tipo, +params.id, user);
        return '';
    }

    @Post(':id/etapa')
    @ApiBearerAuth('access-token')
    @Roles(MetaController.WritePerm)
    async createEtapa(
        @Body() createEtapaDto: CreateEtapaDto,
        @Param() params: FindOneParams,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.etapaService.create(this.tipo, +params.id, createEtapaDto, user);
    }

}

@ApiTags(API_TAGS_CRONOGRAMA)
@Controller(['plano-setorial-cronograma', 'programa-de-metas-cronograma'])
export class CronogramaPSController {
    private tipo: TipoPdm = 'PS';
    constructor(
        private readonly cronogramaService: CronogramaService,
        private readonly etapaService: EtapaService
    ) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(MetaSetorialController.WritePerm)
    async create(
        @Body() createCronogramaDto: CreateCronogramaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.cronogramaService.create(this.tipo, createCronogramaDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    @Roles(MetaSetorialController.ReadPerm)
    async findAll(
        @Query() filters: FilterCronogramaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListCronogramaDto> {
        return { linhas: await this.cronogramaService.findAll(this.tipo, filters, user) };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(MetaSetorialController.WritePerm)
    async update(
        @Param() params: FindOneParams,
        @Body() updateCronogramaDto: UpdateCronogramaDto,
        @CurrentUser() user: PessoaFromJwt
    ) {
        return await this.cronogramaService.update(this.tipo, +params.id, updateCronogramaDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(MetaSetorialController.WritePerm)
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.cronogramaService.remove(this.tipo, +params.id, user);
        return '';
    }

    @Post(':id/etapa')
    @ApiBearerAuth('access-token')
    @Roles(MetaSetorialController.WritePerm)
    async createEtapa(
        @Body() createEtapaDto: CreateEtapaDto,
        @Param() params: FindOneParams,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.etapaService.create(this.tipo, +params.id, createEtapaDto, user);
    }
}
