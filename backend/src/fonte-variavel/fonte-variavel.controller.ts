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
    CreateFonteVariavelDto,
    FilterFonteVariavelDto,
    ListFonteVariavelDto,
    FonteVariavelDto,
    UpdateFonteVariavelDto,
} from './dto/fonte-variavel.dto';
import { FonteVariavelService } from './fonte-variavel.service';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { FindOneParams } from '../common/decorators/find-params';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Fonte Variável')
@Controller('fonte-variavel')
export class FonteVariavelController {
    constructor(private readonly fonteService: FonteVariavelService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['FonteVariavel.inserir'])
    async create(@Body() dto: CreateFonteVariavelDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.fonteService.create(dto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    async findAll(@Query() filters: FilterFonteVariavelDto): Promise<ListFonteVariavelDto> {
        return { linhas: await this.fonteService.findAll(filters) };
    }

    @ApiBearerAuth('access-token')
    @Get(':id')
    async findOne(@Param() params: FindOneParams): Promise<FonteVariavelDto> {
        const linhas = await this.fonteService.findAll({ id: +params.id });
        if (linhas.length === 0) throw new NotFoundException('Registro não encontrado');
        return linhas[0];
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['FonteVariavel.editar'])
    async update(
        @Param() params: FindOneParams,
        @Body() dto: UpdateFonteVariavelDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.fonteService.update(+params.id, dto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['FonteVariavel.remover'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.fonteService.remove(+params.id, user);
        return '';
    }
}
