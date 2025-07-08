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

import {
    CreateCategoriaAssuntoVariavelDto,
    FilterCategoriaAssuntoVariavelDto,
    ListCategoriaAssuntoVariavelDto,
    CategoriaAssuntoVariavelDto,
    UpdateCategoriaAssuntoVariavelDto,
} from './dto/categoria-assunto-variavel.dto';
import { CategoriaAssuntoVariavelService } from './categoria-assunto-variavel.service';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { FindOneParams } from '../common/decorators/find-params';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Categoria Assunto Variável')
@Controller('categoria-assunto-variavel')
export class CategoriaAssuntoVariavelController {
    constructor(private readonly assuntoService: CategoriaAssuntoVariavelService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['AssuntoVariavel.inserir'])
    async create(@Body() dto: CreateCategoriaAssuntoVariavelDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.assuntoService.create(dto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    async findAll(@Query() filters: FilterCategoriaAssuntoVariavelDto): Promise<ListCategoriaAssuntoVariavelDto> {
        return { linhas: await this.assuntoService.findAll(filters) };
    }

    @ApiBearerAuth('access-token')
    @Get(':id')
    async findOne(@Param() params: FindOneParams): Promise<CategoriaAssuntoVariavelDto> {
        const linhas = await this.assuntoService.findAll({ id: +params.id });
        if (linhas.length === 0) throw new NotFoundException('Registro não encontrado');
        return linhas[0];
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['AssuntoVariavel.editar'])
    async update(
        @Param() params: FindOneParams,
        @Body() dto: UpdateCategoriaAssuntoVariavelDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.assuntoService.update(+params.id, dto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['AssuntoVariavel.remover'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.assuntoService.remove(+params.id, user);
        return '';
    }
}
