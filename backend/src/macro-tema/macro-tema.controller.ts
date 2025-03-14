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
import { CreateEixoDto } from './dto/create-macro-tema.dto';
import { FilterEixoDto } from './dto/filter-macro-tema.dto';
import { ListEixoDto } from './dto/list-macro-tema.dto';
import { UpdateEixoDto } from './dto/update-macro-tema.dto';
import { MacroTemaDto } from './entities/macro-tema.entity';
import { MacroTemaService } from './macro-tema.service';
import { MetaSetorialController } from '../meta/meta.controller';

@ApiTags('Macro Tema para PDM (Antigo Eixo)')
@Controller('macrotema')
export class MacroTemaController {
    private tipoPdm: TipoPdmType = '_PDM';
    constructor(private readonly eixoService: MacroTemaService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['CadastroMacroTema.inserir'])
    async create(@Body() createEixoDto: CreateEixoDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.eixoService.create(this.tipoPdm, createEixoDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    async findAll(@Query() filters: FilterEixoDto): Promise<ListEixoDto> {
        return { linhas: await this.eixoService.findAll(this.tipoPdm, filters) };
    }

    @ApiBearerAuth('access-token')
    @Get(':id')
    async findOne(@Param() params: FindOneParams): Promise<MacroTemaDto> {
        const linhas = await this.eixoService.findAll(this.tipoPdm, { id: +params.id });
        if (linhas.length === 0) throw new NotFoundException('Registro não encontrado');
        return linhas[0];
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroMacroTema.editar'])
    async update(
        @Param() params: FindOneParams,
        @Body() updateEixoDto: UpdateEixoDto,
        @CurrentUser() user: PessoaFromJwt
    ) {
        return await this.eixoService.update(this.tipoPdm, +params.id, updateEixoDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroMacroTema.remover'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.eixoService.remove(this.tipoPdm, +params.id, user);
        return '';
    }
}

@ApiTags('Macro Tema para Plano Setorial (Antigo Eixo)')
@Controller('plano-setorial-macrotema')
export class PlanoSetorialMacroTemaController {
    constructor(private readonly eixoService: MacroTemaService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['CadastroMacroTemaPS.inserir', 'CadastroMacroTemaPDM.inserir', ...MetaSetorialController.ReadPerm])
    async create(
        @Body() createEixoDto: CreateEixoDto,
        @CurrentUser() user: PessoaFromJwt,
        @TipoPDM() tipo: TipoPdmType
    ): Promise<RecordWithId> {
        return await this.eixoService.create(tipo, createEixoDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    async findAll(@Query() filters: FilterEixoDto, @TipoPDM() tipo: TipoPdmType): Promise<ListEixoDto> {
        return { linhas: await this.eixoService.findAll(tipo, filters) };
    }

    @ApiBearerAuth('access-token')
    @Get(':id')
    async findOne(@Param() params: FindOneParams, @TipoPDM() tipo: TipoPdmType): Promise<MacroTemaDto> {
        const linhas = await this.eixoService.findAll(tipo, { id: +params.id });
        if (linhas.length === 0) throw new NotFoundException('Registro não encontrado');
        return linhas[0];
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroMacroTemaPS.editar', 'CadastroMacroTemaPDM.editar', ...MetaSetorialController.ReadPerm])
    async update(
        @Param() params: FindOneParams,
        @Body() updateEixoDto: UpdateEixoDto,
        @CurrentUser() user: PessoaFromJwt,
        @TipoPDM() tipo: TipoPdmType
    ) {
        return await this.eixoService.update(tipo, +params.id, updateEixoDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroMacroTemaPS.remover', 'CadastroMacroTemaPDM.remover', ...MetaSetorialController.ReadPerm])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt, @TipoPDM() tipo: TipoPdmType) {
        await this.eixoService.remove(tipo, +params.id, user);
        return '';
    }
}
