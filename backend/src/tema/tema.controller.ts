import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { FindOneParams } from '../common/decorators/find-params';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { CreateObjetivoEstrategicoDto } from './dto/create-tema.dto';
import { FilterObjetivoEstrategicoDto } from './dto/filter-tema.dto';
import { ListObjetivoEstrategicoDto } from './dto/list-tema.dto';
import { UpdateObjetivoEstrategicoDto } from './dto/update-tema.dto';
import { TemaService } from './tema.service';
import { TipoPdm } from '@prisma/client';

@ApiTags('Tema para PDM (Antigo Objetivo Estratégico)')
@Controller('tema')
export class TemaController {
    private tipoPdm: TipoPdm = 'PDM';
    constructor(private readonly objetivoEstrategicoService: TemaService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['CadastroTema.inserir'])
    async create(
        @Body() createObjetivoEstrategicoDto: CreateObjetivoEstrategicoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.objetivoEstrategicoService.create(this.tipoPdm, createObjetivoEstrategicoDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    async findAll(@Query() filters: FilterObjetivoEstrategicoDto): Promise<ListObjetivoEstrategicoDto> {
        return { linhas: await this.objetivoEstrategicoService.findAll(this.tipoPdm, filters) };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroTema.editar'])
    async update(
        @Param() params: FindOneParams,
        @Body() dto: UpdateObjetivoEstrategicoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.objetivoEstrategicoService.update(this.tipoPdm, +params.id, dto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroTema.remover'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.objetivoEstrategicoService.remove(this.tipoPdm, +params.id, user);
        return '';
    }
}

@ApiTags('Tema para Plano Setorial (Antigo Objetivo Estratégico)')
@Controller('plano-setorial-tema')
export class TemaControllerPS {
    private tipoPdm: TipoPdm = 'PS';
    constructor(private readonly objetivoEstrategicoService: TemaService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['CadastroTema.inserir'])
    async create(
        @Body() createObjetivoEstrategicoDto: CreateObjetivoEstrategicoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.objetivoEstrategicoService.create(this.tipoPdm, createObjetivoEstrategicoDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    async findAll(@Query() filters: FilterObjetivoEstrategicoDto): Promise<ListObjetivoEstrategicoDto> {
        return { linhas: await this.objetivoEstrategicoService.findAll(this.tipoPdm, filters) };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroTema.editar'])
    async update(
        @Param() params: FindOneParams,
        @Body() dto: UpdateObjetivoEstrategicoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.objetivoEstrategicoService.update(this.tipoPdm, +params.id, dto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroTema.remover'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.objetivoEstrategicoService.remove(this.tipoPdm, +params.id, user);
        return '';
    }
}
