import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { UnidadeMedidaService } from './unidade-medida.service';
import { CreateUnidadeMedidaDto } from './dto/create-unidade-medida.dto';
import { UpdateUnidadeMedidaDto } from './dto/update-unidade-medida.dto';
import { FindOneParams } from 'src/common/decorators/find-params';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { ListUnidadeMedidaDto } from 'src/unidade-medida/dto/list-unidade-medida.dto';

@ApiTags('Unidade de Órgão')
@Controller('unidade-medida')
export class UnidadeMedidaController {
    constructor(private readonly unidadeMedidaService: UnidadeMedidaService) { }

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroUnidadeMedida.inserir')
    async create(@Body() createUnidadeMedidaDto: CreateUnidadeMedidaDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.unidadeMedidaService.create(createUnidadeMedidaDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    async findAll(): Promise<ListUnidadeMedidaDto> {
        return { 'linhas': await this.unidadeMedidaService.findAll() };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroUnidadeMedida.editar')
    async update(@Param() params: FindOneParams, @Body() updateUnidadeMedidaDto: UpdateUnidadeMedidaDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.unidadeMedidaService.update(+params.id, updateUnidadeMedidaDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroUnidadeMedida.remover')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.unidadeMedidaService.remove(+params.id, user);
        return '';
    }
}
