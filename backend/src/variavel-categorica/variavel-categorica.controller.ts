import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { FindOneParams } from '../common/decorators/find-params';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import {
    CreateVariavelCategoricaDto,
    FilterVariavelCategoricaDto,
    ListVariavelCategoricaDto,
    UpdateVariavelCategoricaDto,
} from './dto/variavel-categorica.dto';
import { VariavelCategoricaService } from './variavel-categorica.service';
import { ROLES_ACESSO_VARIAVEL_PDM } from '../variavel/variavel.controller';

@ApiTags('Variavel Categórica')
@Controller('variavel-categorica')
export class VariavelCategoricaController {
    constructor(private readonly variavelCatService: VariavelCategoricaService) {}

    @Post('')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroVariavelCategorica.administrador'])
    async create(@Body() dto: CreateVariavelCategoricaDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.variavelCatService.create(dto, user);
    }

    @Get('')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroVariavelCategorica.administrador', ...ROLES_ACESSO_VARIAVEL_PDM])
    async listAll(
        @Query() filters: FilterVariavelCategoricaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListVariavelCategoricaDto> {
        return { linhas: await this.variavelCatService.findAll(filters) };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroVariavelCategorica.administrador'])
    async update(
        @Param() params: FindOneParams,
        @Body() dto: UpdateVariavelCategoricaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.variavelCatService.update(+params.id, dto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroVariavelCategorica.administrador'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.variavelCatService.remove(+params.id, user);
        return '';
    }
}
