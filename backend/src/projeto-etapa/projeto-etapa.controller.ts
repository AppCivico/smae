import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { FindOneParams } from '../common/decorators/find-params';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { CreateProjetoEtapaDto } from './dto/create-projeto-etapa.dto';
import { ListProjetoEtapaDto } from './dto/list-projeto-etapa.dto';
import { UpdateProjetoEtapaDto } from './dto/update-projeto-etapa.dto';
import { ProjetoEtapaService } from './projeto-etapa.service';
import { TipoProjeto } from 'src/generated/prisma/client';

@ApiTags('Projeto Etapa')
@Controller('projeto-etapa')
export class ProjetoEtapaController {
    private tipo: TipoProjeto = 'PP';
    constructor(private readonly projetoEtapaService: ProjetoEtapaService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['CadastroProjetoEtapa.inserir'])
    async create(
        @Body() createTagDto: CreateProjetoEtapaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.projetoEtapaService.create(this.tipo, createTagDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    async findAll(): Promise<ListProjetoEtapaDto> {
        return { linhas: await this.projetoEtapaService.findAll(this.tipo) };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroProjetoEtapa.editar'])
    async update(
        @Param() params: FindOneParams,
        @Body() updateTagDto: UpdateProjetoEtapaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.projetoEtapaService.update(this.tipo, +params.id, updateTagDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroProjetoEtapa.remover'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.projetoEtapaService.remove(this.tipo, +params.id, user);
        return '';
    }
}

@ApiTags('Projeto Etapa de Obras')
@Controller('projeto-etapa-mdo')
export class ProjetoEtapaMDOController {
    private tipo: TipoProjeto = 'MDO';
    constructor(private readonly projetoEtapaService: ProjetoEtapaService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['CadastroProjetoEtapaMDO.inserir'])
    async create(
        @Body() createTagDto: CreateProjetoEtapaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.projetoEtapaService.create(this.tipo, createTagDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    async findAll(): Promise<ListProjetoEtapaDto> {
        return { linhas: await this.projetoEtapaService.findAll(this.tipo) };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroProjetoEtapaMDO.editar'])
    async update(
        @Param() params: FindOneParams,
        @Body() updateTagDto: UpdateProjetoEtapaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.projetoEtapaService.update(this.tipo, +params.id, updateTagDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroProjetoEtapaMDO.remover'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.projetoEtapaService.remove(this.tipo, +params.id, user);
        return '';
    }
}
