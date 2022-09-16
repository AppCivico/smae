import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { VariavelService } from './variavel.service';
import { CreateVariavelDto } from './dto/create-variavel.dto';
import { UpdateVariavelDto } from './dto/update-variavel.dto';
import { FindOneParams } from 'src/common/decorators/find-params';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { FilterVariavelDto } from 'src/variavel/dto/filter-variavel.dto';
import { ListVariavelDto } from 'src/variavel/dto/list-variavel.dto';

@ApiTags('Indicador')
@Controller('indicador-variavel')
export class VariavelController {
    constructor(private readonly variavelService: VariavelService) { }

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroIndicador.inserir')
    async create(@Body() createVariavelDto: CreateVariavelDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.variavelService.create(createVariavelDto, user);
    }

    @Get()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroIndicador.inserir', 'CadastroIndicador.editar')
    async listAll(@Query() filters: FilterVariavelDto, @CurrentUser() user: PessoaFromJwt): Promise<ListVariavelDto> {
        return { linhas: await this.variavelService.findAll(filters) };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroIndicador.editar')
    async update(@Param() params: FindOneParams, @Body() updateUnidadeMedidaDto: UpdateVariavelDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.variavelService.update(+params.id, updateUnidadeMedidaDto, user);
    }

}
