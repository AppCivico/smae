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
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { FindOneParams } from '../../common/decorators/find-params';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { CreateProjetoTagDto } from './dto/create-tag.dto';
import { FilterProjetoTagDto } from './dto/filter-tag.dto';
import { ListProjetoTagDto } from './dto/list-tag.dto';
import { ProjetoUpdateTagDto } from './dto/update-tag.dto';
import { ProjetoTagService } from './tag.service';
import { TipoProjeto } from '@prisma/client';
import { ProjetoTagDto } from './entities/tag.entity';

@ApiTags('Projeto Tag')
@Controller('projeto-tag')
export class ProjetoTagController {
    private tipo: TipoProjeto = 'PP';
    constructor(private readonly tagService: ProjetoTagService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['ProjetoTag.inserir'])
    async create(@Body() createTagDto: CreateProjetoTagDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.tagService.create(this.tipo, createTagDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    async findAll(@Query() filters: FilterProjetoTagDto): Promise<ListProjetoTagDto> {
        return { linhas: await this.tagService.findAll(this.tipo, filters) };
    }

    @ApiBearerAuth('access-token')
    @Get(':id')
    async findOne(@Param() params: FindOneParams): Promise<ProjetoTagDto> {
        const linhas = await this.tagService.findAll(this.tipo, { id: +params.id });
        if (linhas.length === 0) throw new NotFoundException('Registro não encontrado');
        return linhas[0];
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['ProjetoTag.editar'])
    async update(
        @Param() params: FindOneParams,
        @Body() updateTagDto: ProjetoUpdateTagDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.tagService.update(this.tipo, +params.id, updateTagDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['ProjetoTag.remover'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.tagService.remove(this.tipo, +params.id, user);
        return '';
    }
}

@ApiTags('Projeto Tag de Obras (Etiquetas)')
@Controller('projeto-tag-mdo')
export class ProjetoTagMDOController {
    private tipo: TipoProjeto = 'MDO';
    constructor(private readonly tagService: ProjetoTagService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['ProjetoTagMDO.inserir'])
    async create(@Body() createTagDto: CreateProjetoTagDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.tagService.create(this.tipo, createTagDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    async findAll(@Query() filters: FilterProjetoTagDto): Promise<ListProjetoTagDto> {
        return { linhas: await this.tagService.findAll(this.tipo, filters) };
    }

    @ApiBearerAuth('access-token')
    @Get(':id')
    async findOne(@Param() params: FindOneParams): Promise<ProjetoTagDto> {
        const linhas = await this.tagService.findAll(this.tipo, { id: +params.id });
        if (linhas.length === 0) throw new NotFoundException('Registro não encontrado');
        return linhas[0];
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['ProjetoTagMDO.editar'])
    async update(
        @Param() params: FindOneParams,
        @Body() updateTagDto: ProjetoUpdateTagDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.tagService.update(this.tipo, +params.id, updateTagDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['ProjetoTagMDO.remover'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.tagService.remove(this.tipo, +params.id, user);
        return '';
    }
}
