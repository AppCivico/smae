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
import { TipoPdm } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { FindOneParams } from '../common/decorators/find-params';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { CreateEixoDto } from './dto/create-macro-tema.dto';
import { FilterEixoDto } from './dto/filter-macro-tema.dto';
import { ListEixoDto } from './dto/list-macro-tema.dto';
import { UpdateEixoDto } from './dto/update-macro-tema.dto';
import { MacroTemaDto } from './entities/macro-tema.entity';
import { MacroTemaService } from './macro-tema.service';

@ApiTags('Macro Tema para PDM (Antigo Eixo)')
@Controller('macrotema')
export class MacroTemaController {
    private tipoPdm: TipoPdm = 'PDM';
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
    private tipoPdm: TipoPdm = 'PS';
    constructor(private readonly eixoService: MacroTemaService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['CadastroMacroTemaPS.inserir'])
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
    @Roles(['CadastroMacroTemaPS.editar'])
    async update(
        @Param() params: FindOneParams,
        @Body() updateEixoDto: UpdateEixoDto,
        @CurrentUser() user: PessoaFromJwt
    ) {
        return await this.eixoService.update(this.tipoPdm, +params.id, updateEixoDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroMacroTemaPS.remover'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.eixoService.remove(this.tipoPdm, +params.id, user);
        return '';
    }
}
