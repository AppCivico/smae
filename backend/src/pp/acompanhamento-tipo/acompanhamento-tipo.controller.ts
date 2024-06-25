import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { ListaDePrivilegios } from 'src/common/ListaDePrivilegios';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { FindOneParams } from '../../common/decorators/find-params';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { AcompanhamentoTipoService } from './acompanhamento-tipo.service';
import { CreateTipoAcompanhamentoDto } from './dto/create-acompanhamento-tipo.dto';
import { UpdateAcompanhamentoTipoDto } from './dto/update-acompanhamento-tipo.dto';
import { ListAcompanhamentoTipoDto } from './entities/acompanhament-tipo.entities.dto';
import { PROJETO_READONLY_ROLES, PROJETO_READONLY_ROLES_MDO } from '../projeto/projeto.controller';

// provavelmente não é pra PROJETO_READONLY_ROLES criar esse tipo de objeto, conferir com o Lucas/FGV
const roles: ListaDePrivilegios[] = ['Projeto.administrador', 'Projeto.administrador_no_orgao'];
const rolesMDO: ListaDePrivilegios[] = ['ProjetoMDO.administrador', 'ProjetoMDO.administrador_no_orgao'];

@Controller('acompanhamento-tipo')
@ApiTags('Acompanhamento - Tipo')
export class AcompanhamentoTipoController {
    constructor(private readonly acompanhamentoTipoService: AcompanhamentoTipoService) {}

    @Post('')
    @ApiBearerAuth('access-token')
    @Roles([...roles])
    async create(
        @Body() createAcompanhamentoTipoDto: CreateTipoAcompanhamentoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.acompanhamentoTipoService.create('PP', createAcompanhamentoTipoDto, user);
    }

    @Get('')
    @ApiBearerAuth('access-token')
    @Roles([...roles, ...PROJETO_READONLY_ROLES])
    async findAll(@CurrentUser() user: PessoaFromJwt): Promise<ListAcompanhamentoTipoDto> {
        return {
            linhas: await this.acompanhamentoTipoService.findAll('PP', user),
        };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles([...roles])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async update(
        @Param() params: FindOneParams,
        @Body() dto: UpdateAcompanhamentoTipoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.acompanhamentoTipoService.update('PP', params.id, dto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles([...roles])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.acompanhamentoTipoService.remove('PP', params.id, user);
        return '';
    }
}

@Controller('acompanhamento-tipo-mdo')
@ApiTags('Acompanhamento - Tipo de Obras')
export class AcompanhamentoTipoMDOController {
    constructor(private readonly acompanhamentoTipoService: AcompanhamentoTipoService) {}

    @Post('')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    async create(
        @Body() createAcompanhamentoTipoDto: CreateTipoAcompanhamentoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.acompanhamentoTipoService.create('MDO', createAcompanhamentoTipoDto, user);
    }

    @Get('')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO, ...PROJETO_READONLY_ROLES_MDO])
    async findAll(@CurrentUser() user: PessoaFromJwt): Promise<ListAcompanhamentoTipoDto> {
        return {
            linhas: await this.acompanhamentoTipoService.findAll('MDO', user),
        };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async update(
        @Param() params: FindOneParams,
        @Body() dto: UpdateAcompanhamentoTipoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.acompanhamentoTipoService.update('MDO', params.id, dto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.acompanhamentoTipoService.remove('MDO', params.id, user);
        return '';
    }
}
