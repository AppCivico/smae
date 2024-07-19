import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { FindOneParams } from '../common/decorators/find-params';
import { MetaController } from '../meta/meta.controller';
import { CronogramaEtapaService } from './cronograma-etapas.service';
import { FilterCronogramaEtapaDto } from './dto/filter-cronograma-etapa.dto';
import { ListCronogramaEtapaDto } from './dto/list-cronograma-etapa.dto';
import { UpdateCronogramaEtapaDto } from './dto/update-cronograma-etapa.dto';

@ApiTags('Cronograma-Etapa')
@Controller('cronograma-etapa')
export class CronogramaEtapaController {
    constructor(private readonly cronogramaEtapaService: CronogramaEtapaService) {}

    @ApiBearerAuth('access-token')
    @Get()
    @Roles([...MetaController.ReadPerm])
    async findAll(
        @Query() filters: FilterCronogramaEtapaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListCronogramaEtapaDto> {
        return { linhas: await this.cronogramaEtapaService.findAll(filters, user, false) };
    }

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(MetaController.WritePerm)
    async update(@Body() updateCronogramaEtapaDto: UpdateCronogramaEtapaDto, @CurrentUser() user: PessoaFromJwt) {
        return await this.cronogramaEtapaService.update(updateCronogramaEtapaDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(MetaController.WritePerm)
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.cronogramaEtapaService.delete(+params.id, user);
        return '';
    }
}
