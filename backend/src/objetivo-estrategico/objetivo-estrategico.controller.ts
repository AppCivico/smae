import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { ListObjetivoEstrategicoDto } from './dto/list-objetivo-estrategico.dto';
import { ObjetivoEstrategicoService } from './objetivo-estrategico.service';
import { CreateObjetivoEstrategicoDto } from './dto/create-objetivo-estrategico.dto';
import { UpdateObjetivoEstrategicoDto } from './dto/update-objetivo-estrategico.dto';
import { FindOneParams } from '../common/decorators/find-params';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { filter } from 'rxjs';
import { FilterObjetivoEstrategicoDto } from './dto/filter-objetivo-estrategico.dto';

@ApiTags('Objetivo Estratégico (Acessa via Tema)')
@Controller('objetivo-estrategico')
export class ObjetivoEstrategicoController {
    constructor(private readonly objetivoEstrategicoService: ObjetivoEstrategicoService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroTema.inserir')
    async create(@Body() createObjetivoEstrategicoDto: CreateObjetivoEstrategicoDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.objetivoEstrategicoService.create(createObjetivoEstrategicoDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    async findAll(@Query() filters: FilterObjetivoEstrategicoDto): Promise<ListObjetivoEstrategicoDto> {
        return { linhas: await this.objetivoEstrategicoService.findAll(filters) };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroTema.editar')
    async update(@Param() params: FindOneParams, @Body() updateObjetivoEstrategicoDto: UpdateObjetivoEstrategicoDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.objetivoEstrategicoService.update(+params.id, updateObjetivoEstrategicoDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroTema.remover')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.objetivoEstrategicoService.remove(+params.id, user);
        return '';
    }
}

@ApiTags('Tema (Antigo Objetivo Estratégico)')
@Controller('tema')
export class ObjetivoEstrategicoController2 {
    constructor(private readonly objetivoEstrategicoService: ObjetivoEstrategicoService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroTema.inserir')
    async create(@Body() createObjetivoEstrategicoDto: CreateObjetivoEstrategicoDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.objetivoEstrategicoService.create(createObjetivoEstrategicoDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    async findAll(@Query() filters: FilterObjetivoEstrategicoDto): Promise<ListObjetivoEstrategicoDto> {
        return { linhas: await this.objetivoEstrategicoService.findAll(filters) };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroTema.editar')
    async update(@Param() params: FindOneParams, @Body() updateObjetivoEstrategicoDto: UpdateObjetivoEstrategicoDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.objetivoEstrategicoService.update(+params.id, updateObjetivoEstrategicoDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroTema.remover')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.objetivoEstrategicoService.remove(+params.id, user);
        return '';
    }
}
