import { Controller, Post, Body, Get, Param, Patch, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiNoContentResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { FindOneParams, FindTwoParams } from 'src/common/decorators/find-params';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { UpdateProjetoDto } from '../projeto/dto/update-projeto.dto';
import { ProjetoService } from '../projeto/projeto.service';
import { TipoIntervencaoService } from './tipo-intervencao.service';
import { CreateTipoIntervencaoDto } from './dto/create-tipo-intervencao.dto';
import { ListaDePrivilegios } from 'src/common/ListaDePrivilegios';
import { PROJETO_READONLY_ROLES_MDO } from '../projeto/projeto.controller';
import { TipoIntervencao, ListTipoIntervencaoDto } from './entities/tipo-intervencao.entity';

const rolesMDO: ListaDePrivilegios[] = [
    'ProjetoMDO.administrador',
    'ProjetoMDO.administrador_no_orgao',
    ...PROJETO_READONLY_ROLES_MDO,
];

@Controller('mdo')
@ApiTags('Projeto - MdO')
export class TipoIntervencaoController {
    constructor(
        private readonly grupoTematicoService: TipoIntervencaoService,
        private readonly projetoService: ProjetoService
    ) {}

    @Post(':id/tipo-intervencao')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    async create(
        @Body() createTipoIntervencaoDto: CreateTipoIntervencaoDto,
        @Param() params: FindOneParams,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        const projeto = await this.projetoService.findOne('MDO', params.id, user, 'ReadWrite');

        return await this.grupoTematicoService.create(projeto.id, createTipoIntervencaoDto, user);
    }

    @Get(':id/tipo-intervencao')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    async findAll(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<ListTipoIntervencaoDto> {
        const projeto = await this.projetoService.findOne('MDO', params.id, user, 'ReadWrite');

        return { linhas: await this.grupoTematicoService.findAll(projeto.id, user) };
    }

    @Get(':id/tipo-intervencao/:id2')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    async findOne(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt): Promise<TipoIntervencao> {
        const projeto = await this.projetoService.findOne('MDO', params.id, user, 'ReadWrite');

        return await this.grupoTematicoService.findOne(projeto.id, params.id2, user);
    }

    @Patch(':id/tipo-intervencao/:id2')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    async update(
        @Param() params: FindOneParams,
        @Body() updateProjetoDto: UpdateProjetoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        const projeto = await this.projetoService.findOne('MDO', params.id, user, 'ReadWrite');

        return await this.grupoTematicoService.update(projeto.id, updateProjetoDto, user);
    }

    @Delete(':id/tipo-intervencao/:id2')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt) {
        const projeto = await this.projetoService.findOne('MDO', params.id, user, 'ReadWrite');

        await this.grupoTematicoService.remove(projeto.id, params.id2, user);
        return '';
    }
}
