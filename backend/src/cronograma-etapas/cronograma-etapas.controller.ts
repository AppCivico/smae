import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { FindOneParams } from '../common/decorators/find-params';
import { CronogramaEtapaService } from './cronograma-etapas.service';
import { FilterCronogramaEtapaDto } from './dto/filter-cronograma-etapa.dto';
import { ListCronogramaEtapaDto } from './dto/list-cronograma-etapa.dto';
import { UpdateCronogramaEtapaDto } from './dto/update-cronograma-etapa.dto';

@ApiTags('Cronograma-Etapa')
@Controller('cronograma-etapa')
export class CronogramaEtapaController {
    constructor(private readonly cronogramaEtapaService: CronogramaEtapaService) { }

    @ApiBearerAuth('access-token')
    @Get()
    @Roles('CadastroCronograma.editar', 'CadastroMeta.inserir', 'PDM.admin_cp', 'PDM.coordenador_responsavel_cp', 'PDM.ponto_focal')
    async findAll(@Query() filters: FilterCronogramaEtapaDto): Promise<ListCronogramaEtapaDto> {
        return { 'linhas': await this.cronogramaEtapaService.findAll(filters) };
    }

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroCronograma.editar', 'CadastroMeta.inserir')
    async update(@Body() updateCronogramaEtapaDto: UpdateCronogramaEtapaDto, @CurrentUser() user: PessoaFromJwt) {
        return await this.cronogramaEtapaService.update(updateCronogramaEtapaDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroMeta.remover', 'CadastroMeta.inserir')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.cronogramaEtapaService.delete(+params.id, user);
        return '';
    }

}
