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
import { ListaDePrivilegios } from 'src/common/ListaDePrivilegios';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { FindOneParams } from '../common/decorators/find-params';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { CreateSubTemaDto } from './dto/create-subtema.dto';
import { FilterSubTemaDto } from './dto/filter-subtema.dto';
import { ListSubTemaDto } from './dto/list-subtema.dto';
import { UpdateSubTemaDto } from './dto/update-subtema.dto';
import { SubTemaDto } from './entities/subtema.entity';
import { SubTemaService } from './subtema.service';

@ApiTags('SubTema para PDM')
@Controller('subtema')
export class SubTemaController {
    private tipoPdm: TipoPdm = 'PDM';

    constructor(private readonly subTemaService: SubTemaService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['CadastroSubTema.inserir'])
    async create(
        @Body() createSubTemaDto: CreateSubTemaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.subTemaService.create(this.tipoPdm, createSubTemaDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    async findAll(@Query() filters: FilterSubTemaDto): Promise<ListSubTemaDto> {
        return { linhas: await this.subTemaService.findAll(this.tipoPdm, filters) };
    }

    @ApiBearerAuth('access-token')
    @Get(':id')
    async findOne(@Param() params: FindOneParams): Promise<SubTemaDto> {
        const linhas = await this.subTemaService.findAll(this.tipoPdm, { id: +params.id });
        if (linhas.length === 0) throw new NotFoundException('Registro não encontrado');
        return linhas[0];
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroSubTema.editar'])
    async update(
        @Param() params: FindOneParams,
        @Body() updateSubTemaDto: UpdateSubTemaDto,
        @CurrentUser() user: PessoaFromJwt
    ) {
        return await this.subTemaService.update(this.tipoPdm, +params.id, updateSubTemaDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroSubTema.remover'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.subTemaService.remove(this.tipoPdm, +params.id, user);
        return '';
    }
}

const PermsPS: ListaDePrivilegios[] = [
    'CadastroSubTemaPS.inserir',
    'CadastroSubTemaPS.editar',
    'CadastroSubTemaPS.remover',
];

@ApiTags('SubTema para Plano Setorial')
@Controller('plano-setorial-subtema')
export class PlanoSetorialSubTemaController {
    private tipoPdm: TipoPdm = 'PS';
    constructor(private readonly subTemaService: SubTemaService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(PermsPS)
    async create(
        @Body() createSubTemaDto: CreateSubTemaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.subTemaService.create(this.tipoPdm, createSubTemaDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    async findAll(@Query() filters: FilterSubTemaDto): Promise<ListSubTemaDto> {
        return { linhas: await this.subTemaService.findAll(this.tipoPdm, filters) };
    }

    @ApiBearerAuth('access-token')
    @Get(':id')
    async findOne(@Param() params: FindOneParams): Promise<SubTemaDto> {
        const linhas = await this.subTemaService.findAll(this.tipoPdm, { id: +params.id });
        if (linhas.length === 0) throw new NotFoundException('Registro não encontrado');
        return linhas[0];
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(PermsPS)
    async update(
        @Param() params: FindOneParams,
        @Body() updateSubTemaDto: UpdateSubTemaDto,
        @CurrentUser() user: PessoaFromJwt
    ) {
        return await this.subTemaService.update(this.tipoPdm, +params.id, updateSubTemaDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(PermsPS)
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.subTemaService.remove(this.tipoPdm, +params.id, user);
        return '';
    }
}
