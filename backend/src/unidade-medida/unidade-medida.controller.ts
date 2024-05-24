import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { FindOneParams } from '../common/decorators/find-params';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { CreateUnidadeMedidaDto } from './dto/create-unidade-medida.dto';
import { ListUnidadeMedidaDto } from './dto/list-unidade-medida.dto';
import { UpdateUnidadeMedidaDto } from './dto/update-unidade-medida.dto';
import { UnidadeMedidaService } from './unidade-medida.service';

@ApiTags('Unidade de Órgão')
@Controller('unidade-medida')
export class UnidadeMedidaController {
    constructor(private readonly unidadeMedidaService: UnidadeMedidaService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['CadastroUnidadeMedida.inserir'])
    async create(
        @Body() createUnidadeMedidaDto: CreateUnidadeMedidaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.unidadeMedidaService.create(createUnidadeMedidaDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    async findAll(): Promise<ListUnidadeMedidaDto> {
        return { linhas: await this.unidadeMedidaService.findAll() };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroUnidadeMedida.editar'])
    async update(
        @Param() params: FindOneParams,
        @Body() updateUnidadeMedidaDto: UpdateUnidadeMedidaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.unidadeMedidaService.update(+params.id, updateUnidadeMedidaDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroUnidadeMedida.remover'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.unidadeMedidaService.remove(+params.id, user);
        return '';
    }
}
