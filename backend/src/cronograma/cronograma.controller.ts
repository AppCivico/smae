import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { FindOneParams } from 'src/common/decorators/find-params';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { CreateEtapaDto } from 'src/etapa/dto/create-etapa.dto';
import { FilterEtapaDto } from 'src/etapa/dto/filter-etapa.dto';
import { ListEtapaDto } from 'src/etapa/dto/list-etapa.dto';
import { EtapaService } from 'src/etapa/etapa.service';
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
    ) { }

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroCronograma.inserir')
    async create(@Body() createCronogramaDto: CreateCronogramaDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.cronogramaService.create(createCronogramaDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    async findAll(@Query() filters: FilterCronogramaDto): Promise<ListCronogramaDto> {
        return { 'linhas': await this.cronogramaService.findAll(filters) };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroCronograma.editar')
    async update(@Param() params: FindOneParams, @Body() updateCronogramaDto: UpdateCronogramaDto, @CurrentUser() user: PessoaFromJwt) {
        return await this.cronogramaService.update(+params.id, updateCronogramaDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroCronograma.remover')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.cronogramaService.remove(+params.id, user);
        return '';
    }

    @Post(':id/etapa')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroCronograma.inserir')
    async createEtapa(@Body() createEtapaDto: CreateEtapaDto, @Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        createEtapaDto.cronograma_id = +params.id;
        return await this.etapaService.create(createEtapaDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get(':id/etapa')
    async findAllEtapas(@Query() filters: FilterEtapaDto, @Param() params: FindOneParams): Promise<ListEtapaDto> {
        filters.cronograma_id = +params.id;
        return { 'linhas': await this.etapaService.findAll(filters) };
    }

}
