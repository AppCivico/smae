import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { FindOneParams } from 'src/common/decorators/find-params';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { CronogramaEtapaService } from './cronograma-etapas.service';
import { FilterCronogramaEtapaDto } from './dto/filter-cronograma-etapa.dto';
import { ListCronogramaEtapaDto } from './dto/list-cronograma-etapa.dto';
import { RequiredFindParamsDto, UpdateCronogramaEtapaDto } from './dto/update-cronograma-etapa.dto';

@ApiTags('Cronograma-Etapa')
@Controller('cronograma-etapa')
export class CronogramaEtapaController {
    constructor(private readonly cronogramaEtapaService: CronogramaEtapaService) { }

    @ApiBearerAuth('access-token')
    @Get()
    async findAll(@Query() filters: FilterCronogramaEtapaDto): Promise<ListCronogramaEtapaDto> {
        return { 'linhas': await this.cronogramaEtapaService.findAll(filters) };
    }

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroCronograma.editar')
    async update(@Query() findParams: RequiredFindParamsDto, @Body() updateCronogramaEtapaDto: UpdateCronogramaEtapaDto, @CurrentUser() user: PessoaFromJwt) {
        return await this.cronogramaEtapaService.update(findParams, updateCronogramaEtapaDto, user);
    }

}
