import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { FindOneParams } from 'src/common/decorators/find-params';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { CicloFisicoService } from './ciclo-fisico.service';
import { CreateCicloFisicoDto } from './dto/create-ciclo-fisico.dto';
import { FilterCicloFisicoDto } from './dto/filter-ciclo-fisico.dto';
import { ListCicloFisicoDto } from './dto/list-ciclo-fisico.dto';
import { UpdateCicloFisicoDto } from './dto/update-ciclo-fisico.dto';

@ApiTags('Ciclo-Fisico')
@Controller('ciclo-fisico')
export class CicloFisicoController {
    constructor(private readonly cicloFisicoService: CicloFisicoService) { }

    @ApiBearerAuth('access-token')
    @Get()
    async findAll(@Query() filters: FilterCicloFisicoDto): Promise<ListCicloFisicoDto> {
        return { 'linhas': await this.cicloFisicoService.findAll(filters) };
    }

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroCicloFisico.inserir')
    async create(@Body() createCicloFisico: CreateCicloFisicoDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.cicloFisicoService.create(createCicloFisico, user);
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroCicloFisico.editar')
    async update(@Param() params: FindOneParams, @Body() updateCicloFisicoDto: UpdateCicloFisicoDto, @CurrentUser() user: PessoaFromJwt) {
        return await this.cicloFisicoService.update(+params.id, updateCicloFisicoDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroCicloFisico.remover')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.cicloFisicoService.remove(+params.id, user);
        return '';
    }

}
