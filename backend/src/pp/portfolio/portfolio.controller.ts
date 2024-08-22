import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { FindOneParams } from '../../common/decorators/find-params';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { PROJETO_READONLY_ROLES, PROJETO_READONLY_ROLES_MDO } from '../projeto/projeto.controller';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';
import { ListPortfolioDto, PortfolioOneDto } from './entities/portfolio.entity';
import { PortfolioService } from './portfolio.service';
import { ListaDePrivilegios } from '../../common/ListaDePrivilegios';

export const PORT_ROLES: ListaDePrivilegios[] = [
    'Projeto.administrar_portfolios',
    'Projeto.administrar_portfolios_no_orgao',
];

export const PORT_ROLES_MDO: ListaDePrivilegios[] = [
    'ProjetoMDO.administrar_portfolios',
    'ProjetoMDO.administrar_portfolios_no_orgao',
];
@ApiTags('Portfólio')
@Controller('portfolio')
export class PortfolioController {
    constructor(private readonly portfolioService: PortfolioService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles([...PORT_ROLES])
    async create(
        @Body() createPortfolioDto: CreatePortfolioDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.portfolioService.create('PP', createPortfolioDto, user);
    }

    @Get()
    @ApiBearerAuth('access-token')
    @Roles([...PORT_ROLES])
    async findAll(@CurrentUser() user: PessoaFromJwt): Promise<ListPortfolioDto> {
        return {
            linhas: await this.portfolioService.findAll('PP', user, false),
        };
    }

    @Get('para-projetos')
    @ApiBearerAuth('access-token')
    @Roles([...PORT_ROLES, 'Projeto.administrador', 'Projeto.administrador_no_orgao', ...PROJETO_READONLY_ROLES])
    async findAllParaProjetos(@CurrentUser() user: PessoaFromJwt): Promise<ListPortfolioDto> {
        return {
            linhas: await this.portfolioService.findAll('PP', user, true),
        };
    }

    @Get(':id')
    @ApiBearerAuth('access-token')
    @Roles([...PORT_ROLES, 'Projeto.administrador', 'Projeto.administrador_no_orgao', ...PROJETO_READONLY_ROLES])
    async findOne(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<PortfolioOneDto> {
        return await this.portfolioService.findOne('PP', params.id, user);
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles([...PORT_ROLES])
    async update(
        @Param() params: FindOneParams,
        @Body() updatePortfolioDto: UpdatePortfolioDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.portfolioService.update('PP', params.id, updatePortfolioDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles([...PORT_ROLES])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.portfolioService.remove('PP', params.id, user);
        return '';
    }
}

@ApiTags('Portfólio de Obras')
@Controller('portfolio-mdo')
export class PortfolioMDOController {
    constructor(private readonly portfolioService: PortfolioService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles([...PORT_ROLES_MDO])
    async create(
        @Body() createPortfolioDto: CreatePortfolioDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.portfolioService.create('MDO', createPortfolioDto, user);
    }

    @Get()
    @ApiBearerAuth('access-token')
    @Roles([...PORT_ROLES_MDO])
    async findAll(@CurrentUser() user: PessoaFromJwt): Promise<ListPortfolioDto> {
        return {
            linhas: await this.portfolioService.findAll('MDO', user, false),
        };
    }

    @Get('para-obras')
    @ApiBearerAuth('access-token')
    @Roles([
        ...PORT_ROLES_MDO,
        'ProjetoMDO.administrador',
        'ProjetoMDO.administrador_no_orgao',
        ...PROJETO_READONLY_ROLES_MDO,
    ])
    async findAllParaObras(@CurrentUser() user: PessoaFromJwt): Promise<ListPortfolioDto> {
        return {
            linhas: await this.portfolioService.findAll('MDO', user, true),
        };
    }

    @Get(':id')
    @ApiBearerAuth('access-token')
    @Roles([
        ...PORT_ROLES_MDO,
        'ProjetoMDO.administrador',
        'ProjetoMDO.administrador_no_orgao',
        ...PROJETO_READONLY_ROLES_MDO,
    ])
    async findOne(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<PortfolioOneDto> {
        return await this.portfolioService.findOne('MDO', params.id, user);
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles([...PORT_ROLES_MDO])
    async update(
        @Param() params: FindOneParams,
        @Body() updatePortfolioDto: UpdatePortfolioDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.portfolioService.update('MDO', params.id, updatePortfolioDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles([...PORT_ROLES_MDO])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.portfolioService.remove('MDO', params.id, user);
        return '';
    }
}
