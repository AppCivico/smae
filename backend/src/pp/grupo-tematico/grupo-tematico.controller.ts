import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { FindOneParams } from 'src/common/decorators/find-params';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { CreateGrupoTematicoDto } from './dto/create-grupo-tematico.dto';
import { GrupoTematico, ListGrupoTematicoDto } from './entities/grupo-tematico.entity';
import { GrupoTematicoService } from './grupo-tematico.service';


@Controller('grupo-tematico')
@ApiTags('Monitoramento de Obras, Cadastro Básico, Grupo Temático')
export class GrupoTematicoController {
    constructor(private readonly grupoTematicoService: GrupoTematicoService) {}

    @Post('')
    @ApiBearerAuth('access-token')
    @Roles(['GrupoTematicoMDO.inserir'])
    async create(
        @Body() createGrupoTematicoDto: CreateGrupoTematicoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.grupoTematicoService.create(createGrupoTematicoDto, user);
    }

    @Get('')
    @ApiBearerAuth('access-token')
    async findAll(@CurrentUser() user: PessoaFromJwt): Promise<ListGrupoTematicoDto> {
        return { linhas: await this.grupoTematicoService.findAll(user) };
    }

    @Get(':id')
    @ApiBearerAuth('access-token')
    async findOne(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<GrupoTematico> {
        return await this.grupoTematicoService.findOne(params.id, user);
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['GrupoTematicoMDO.editar'])
    async update(
        @Param() params: FindOneParams,
        @Body() updateProjetoDto: CreateGrupoTematicoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.grupoTematicoService.update(params.id, updateProjetoDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['GrupoTematicoMDO.remover'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.grupoTematicoService.remove(params.id, user);
        return '';
    }
}
