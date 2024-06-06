import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { ListaDePrivilegios } from '../../common/ListaDePrivilegios';
import { FindOneParams } from '../../common/decorators/find-params';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { CreateGrupoPortfolioDto } from './dto/create-grupo-portfolio.dto';
import { UpdateGrupoPortfolioDto } from './dto/update-grupo-portfolio.dto';
import { FilterGrupoPortfolioDto, ListGrupoPortfolioDto } from './entities/grupo-portfolio.entity';
import { GrupoPortfolioService } from './grupo-portfolio.service';
import { PROJETO_READONLY_ROLES, PROJETO_READONLY_ROLES_MDO } from '../projeto/projeto.controller';

const roles: ListaDePrivilegios[] = [
    'CadastroGrupoPortfolio.administrador',
    'CadastroGrupoPortfolio.administrador_no_orgao',
];
const rolesMDO: ListaDePrivilegios[] = [
    'CadastroGrupoPortfolioMDO.administrador',
    'CadastroGrupoPortfolioMDO.administrador_no_orgao',
];

@ApiTags('Portfólio')
@Controller('grupo-portfolio')
export class GrupoPortfolioController {
    constructor(private readonly grupoPortfolioService: GrupoPortfolioService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles([...roles])
    async create(@Body() dto: CreateGrupoPortfolioDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.grupoPortfolioService.create('PP', dto, user);
    }

    @Get()
    @ApiBearerAuth('access-token')
    @Roles([...roles, ...PROJETO_READONLY_ROLES])
    async findAll(@Query() filter: FilterGrupoPortfolioDto): Promise<ListGrupoPortfolioDto> {
        return { linhas: await this.grupoPortfolioService.findAll('PP', filter) };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles([...roles])
    async update(
        @Param() id: FindOneParams,
        @Body() dto: UpdateGrupoPortfolioDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.grupoPortfolioService.update('PP', id.id, dto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles([...roles])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() id: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.grupoPortfolioService.remove('PP', id.id, user);

        return '';
    }
}

@ApiTags('Portfólio de obras')
@Controller('grupo-portfolio-mdo')
export class GrupoPortfolioMDOController {
    constructor(private readonly grupoPortfolioService: GrupoPortfolioService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    async create(@Body() dto: CreateGrupoPortfolioDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.grupoPortfolioService.create('MDO', dto, user);
    }

    @Get()
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO, ...PROJETO_READONLY_ROLES_MDO])
    async findAll(@Query() filter: FilterGrupoPortfolioDto): Promise<ListGrupoPortfolioDto> {
        return { linhas: await this.grupoPortfolioService.findAll('MDO', filter) };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    async update(
        @Param() id: FindOneParams,
        @Body() dto: UpdateGrupoPortfolioDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.grupoPortfolioService.update('MDO', id.id, dto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() id: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.grupoPortfolioService.remove('MDO', id.id, user);

        return '';
    }
}
