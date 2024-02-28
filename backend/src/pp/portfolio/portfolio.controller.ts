import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { FindOneParams } from '../../common/decorators/find-params';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { PROJETO_READONLY_ROLES } from '../projeto/projeto.controller';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';
import { ListPortfolioDto, PortfolioOneDto } from './entities/portfolio.entity';
import { PortfolioService } from './portfolio.service';
import { ListaDePrivilegios } from '../../common/ListaDePrivilegios';

export const PORT_ROLES: ListaDePrivilegios[] = [
    'Projeto.administrar_portfolios',
    'Projeto.administrar_portfolios_no_orgao',
];
@ApiTags('Portfólio')
@Controller('portfolio')
export class PortfolioController {
    constructor(private readonly portfolioService: PortfolioService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...PORT_ROLES)
    async create(
        @Body() createPortfolioDto: CreatePortfolioDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.portfolioService.create(createPortfolioDto, user);
    }

    @Get()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...PORT_ROLES)
    async findAll(@CurrentUser() user: PessoaFromJwt): Promise<ListPortfolioDto> {
        return {
            linhas: await this.portfolioService.findAll(user, false),
        };
    }

    @Get('para-projetos')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...PORT_ROLES, 'Projeto.administrador', 'Projeto.administrador_no_orgao', ...PROJETO_READONLY_ROLES)
    async findAllParaProjetos(@CurrentUser() user: PessoaFromJwt): Promise<ListPortfolioDto> {
        return {
            linhas: await this.portfolioService.findAll(user, true),
        };
    }

    @Get(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...PORT_ROLES, 'Projeto.administrador', 'Projeto.administrador_no_orgao', ...PROJETO_READONLY_ROLES)
    async findOne(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<PortfolioOneDto> {
        return await this.portfolioService.findOne(params.id, user);
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...PORT_ROLES)
    async update(
        @Param() params: FindOneParams,
        @Body() updatePortfolioDto: UpdatePortfolioDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.portfolioService.update(params.id, updatePortfolioDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...PORT_ROLES)
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.portfolioService.remove(params.id, user);
        return '';
    }
}
