import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { FindOneParams } from '../../common/decorators/find-params';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';
import { ListPortfolioDto, PortfolioOneDto } from './entities/portfolio.entity';
import { PortfolioService } from './portfolio.service';

@ApiTags('Portfólio')
@Controller('portfolio')
export class PortfolioController {
    constructor(private readonly portfolioService: PortfolioService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('Projeto.administrar_portfolios')
    async create(
        @Body() createPortfolioDto: CreatePortfolioDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.portfolioService.create(createPortfolioDto, user);
    }

    @Get()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(
        'Projeto.administrar_portfolios',
        'Projeto.administrador',
        'Projeto.administrador_no_orgao',
        'SMAE.gestor_de_projeto',
        'SMAE.colaborador_de_projeto'
    )
    async findAll(@CurrentUser() user: PessoaFromJwt): Promise<ListPortfolioDto> {
        return {
            linhas: await this.portfolioService.findAll(user),
        };
    }

    @Get(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(
        'Projeto.administrar_portfolios',
        'Projeto.administrador_no_orgao',
        'SMAE.gestor_de_projeto',
        'SMAE.colaborador_de_projeto'
    )
    async findOne(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<PortfolioOneDto> {
        return await this.portfolioService.findOne(params.id, user);
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('Projeto.administrar_portfolios')
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
    @Roles('Projeto.administrar_portfolios')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.portfolioService.remove(params.id, user);
        return '';
    }
}
