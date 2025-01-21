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
import { FindOneParams } from '../common/decorators/find-params';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { CreateTagDto } from './dto/create-tag.dto';
import { FilterTagDto } from './dto/filter-tag.dto';
import { ListTagDto } from './dto/list-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { TagService } from './tag.service';
import { TipoPdm } from '@prisma/client';
import { TagDto } from './entities/tag.entity';
import { TipoPDM, TipoPdmType } from '../common/decorators/current-tipo-pdm';

@ApiTags('Tag')
@Controller('tag')
export class TagController {
    private tipoPdm: TipoPdm = 'PDM';
    constructor(private readonly tagService: TagService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['CadastroTag.inserir'])
    async create(@Body() createTagDto: CreateTagDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.tagService.create(this.tipoPdm, createTagDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    async findAll(@Query() filters: FilterTagDto): Promise<ListTagDto> {
        return { linhas: await this.tagService.findAll(this.tipoPdm, filters) };
    }

    @ApiBearerAuth('access-token')
    @Get(':id')
    async findOne(@Param() params: FindOneParams): Promise<TagDto> {
        const linhas = await this.tagService.findAll(this.tipoPdm, { id: [+params.id] });
        if (linhas.length === 0) throw new NotFoundException('Registro não encontrado');
        return linhas[0];
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroTag.editar'])
    async update(
        @Param() params: FindOneParams,
        @Body() updateTagDto: UpdateTagDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.tagService.update(this.tipoPdm, +params.id, updateTagDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroTag.remover'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.tagService.remove(this.tipoPdm, +params.id, user);
        return '';
    }
}

@ApiTags('Tag Plano Setorial')
@Controller('plano-setorial-tag')
export class TagPSController {
    constructor(private readonly tagService: TagService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['CadastroTagPS.inserir', 'CadastroTagPDM.inserir'])
    async create(
        @Body() createTagDto: CreateTagDto,
        @CurrentUser() user: PessoaFromJwt,
        @TipoPDM() tipo: TipoPdmType
    ): Promise<RecordWithId> {
        return await this.tagService.create(tipo, createTagDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    async findAll(
        @Query() filters: FilterTagDto,
        @TipoPDM() tipo: TipoPdmType
    ): Promise<ListTagDto> {
        return { linhas: await this.tagService.findAll(tipo, filters) };
    }

    @ApiBearerAuth('access-token')
    @Get(':id')
    async findOne(
        @Param() params: FindOneParams,
        @TipoPDM() tipo: TipoPdmType
    ): Promise<TagDto> {
        const linhas = await this.tagService.findAll(tipo, { id: [+params.id] });
        if (linhas.length === 0) throw new NotFoundException('Registro não encontrado');
        return linhas[0];
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroTagPS.editar', 'CadastroTagPDM.editar'])
    async update(
        @Param() params: FindOneParams,
        @Body() updateTagDto: UpdateTagDto,
        @CurrentUser() user: PessoaFromJwt,
        @TipoPDM() tipo: TipoPdmType
    ): Promise<RecordWithId> {
        return await this.tagService.update(tipo, +params.id, updateTagDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroTagPS.remover', 'CadastroTagPDM.remover'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(
        @Param() params: FindOneParams,
        @CurrentUser() user: PessoaFromJwt,
        @TipoPDM() tipo: TipoPdmType
    ) {
        await this.tagService.remove(tipo, +params.id, user);
        return '';
    }
}
