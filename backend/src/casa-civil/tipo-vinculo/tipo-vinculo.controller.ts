import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { CreateTipoVinculoDto } from './dto/create-tipo-vinculo.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { FindOneParams } from 'src/common/decorators/find-params';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { ListTipoVinculoDto, TipoVinculoDto } from './entities/tipo-vinculo.entity';
import { TipoVinculoService } from './tipo-vinculo.service';

@ApiTags('TipoVinculo')
@Controller('tipo-vinculo')
export class TipoVinculoController {
    constructor(private readonly tipoVinculoService: TipoVinculoService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['CadastroTipoVinculo.inserir'])
    async create(@Body() dto: CreateTipoVinculoDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.tipoVinculoService.upsert(dto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    async findAll(): Promise<ListTipoVinculoDto> {
        return { linhas: await this.tipoVinculoService.findAll() };
    }

    @Get(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroTipoVinculo.editar', 'CadastroTipoVinculo.inserir'])
    async findOne(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<TipoVinculoDto> {
        return await this.tipoVinculoService.findOne(params.id, user);
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroTipoVinculo.editar'])
    async update(
        @Param() params: FindOneParams,
        @Body() dto: CreateTipoVinculoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.tipoVinculoService.upsert(dto, user, +params.id);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroTipoVinculo.remover'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.tipoVinculoService.remove(+params.id, user);
        return '';
    }
}
