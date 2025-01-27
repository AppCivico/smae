import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    NotFoundException,
    Param,
    Patch,
    Post,
    Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { TipoPDM, TipoPdmType } from '../common/decorators/current-tipo-pdm';
import { FindOneParams } from '../common/decorators/find-params';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { CreateObjetivoEstrategicoDto } from './dto/create-tema.dto';
import { FilterObjetivoEstrategicoDto } from './dto/filter-tema.dto';
import { ListObjetivoEstrategicoDto } from './dto/list-tema.dto';
import { UpdateObjetivoEstrategicoDto } from './dto/update-tema.dto';
import { ObjetivoEstrategicoDto } from './entities/objetivo-estrategico.entity';
import { TemaService } from './tema.service';

@ApiTags('Tema para PDM (Antigo Objetivo Estratégico)')
@Controller('tema')
export class TemaController {
    private tipoPdm: TipoPdmType = '_PDM';
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

    @ApiBearerAuth('access-token')
    @Get(':id')
    async findOne(@Param() params: FindOneParams): Promise<ObjetivoEstrategicoDto> {
        const linhas = await this.objetivoEstrategicoService.findAll(this.tipoPdm, { id: +params.id });
        if (linhas.length === 0) throw new NotFoundException('Registro não encontrado');
        return linhas[0];
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
    constructor(private readonly objetivoEstrategicoService: TemaService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['CadastroTemaPS.inserir', 'CadastroTemaPDM.inserir'])
    async create(
        @Body() createObjetivoEstrategicoDto: CreateObjetivoEstrategicoDto,
        @CurrentUser() user: PessoaFromJwt,
        @TipoPDM() tipo: TipoPdmType
    ): Promise<RecordWithId> {
        return await this.objetivoEstrategicoService.create(tipo, createObjetivoEstrategicoDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    async findAll(
        @Query() filters: FilterObjetivoEstrategicoDto,
        @TipoPDM() tipo: TipoPdmType
    ): Promise<ListObjetivoEstrategicoDto> {
        return { linhas: await this.objetivoEstrategicoService.findAll(tipo, filters) };
    }

    @ApiBearerAuth('access-token')
    @Get(':id')
    async findOne(@Param() params: FindOneParams, @TipoPDM() tipo: TipoPdmType): Promise<ObjetivoEstrategicoDto> {
        const linhas = await this.objetivoEstrategicoService.findAll(tipo, { id: +params.id });
        if (linhas.length === 0) throw new NotFoundException('Registro não encontrado');
        return linhas[0];
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroTemaPS.editar', 'CadastroTemaPDM.editar'])
    async update(
        @Param() params: FindOneParams,
        @Body() dto: UpdateObjetivoEstrategicoDto,
        @CurrentUser() user: PessoaFromJwt,
        @TipoPDM() tipo: TipoPdmType
    ): Promise<RecordWithId> {
        return await this.objetivoEstrategicoService.update(tipo, +params.id, dto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroTemaPS.remover', 'CadastroTemaPDM.remover'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt, @TipoPDM() tipo: TipoPdmType) {
        await this.objetivoEstrategicoService.remove(tipo, +params.id, user);
        return '';
    }
}
