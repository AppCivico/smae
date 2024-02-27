import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { FindOneParams } from '../common/decorators/find-params';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { CurrentUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorator';
import { CreatePerfilAcessoDto, ListaPerfilAcessoDto, UpdatePerfilAcessoDto } from './models/PerfilAcesso.dto';
import { PessoaFromJwt } from './models/PessoaFromJwt';
import { PerfilAcessoService } from './perfilAcesso.service';

@ApiTags('Privilégios / perfil de acesso')
@Controller('perfil-acesso')
export class PerfilAcessoController {
    constructor(private readonly perfilAcessoService: PerfilAcessoService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('PerfilAcesso.administrador')
    async create(@Body() dto: CreatePerfilAcessoDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.perfilAcessoService.create(dto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    async findAll(): Promise<ListaPerfilAcessoDto> {
        return { linhas: await this.perfilAcessoService.findAll() };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('PerfilAcesso.administrador')
    async update(
        @Param() params: FindOneParams,
        @Body() dto: UpdatePerfilAcessoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.perfilAcessoService.update(+params.id, dto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('PerfilAcesso.administrador')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.perfilAcessoService.remove(+params.id, user);
        return '';
    }
}
