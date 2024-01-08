import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
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

const roles: ListaDePrivilegios[] = [
    'CadastroGrupoPortfolio.administrador',
    'CadastroGrupoPortfolio.administrador_no_orgao',
];

@ApiTags('Portfólio')
@Controller('grupo-portfolio')
export class GrupoPortfolioController {
    constructor(private readonly grupoPortfolioService: GrupoPortfolioService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    async create(@Body() dto: CreateGrupoPortfolioDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.grupoPortfolioService.create(dto, user);
    }

    @Get()
    async findAll(@Query() filter: FilterGrupoPortfolioDto): Promise<ListGrupoPortfolioDto> {
        return { linhas: await this.grupoPortfolioService.findAll(filter) };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    async update(
        @Param() id: FindOneParams,
        @Body() dto: UpdateGrupoPortfolioDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.grupoPortfolioService.update(id.id, dto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() id: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.grupoPortfolioService.remove(id.id, user);

        return '';
    }

    // TODO criar visão que retorna a lista onde o grupo-port está sendo usado em projetos | portfólios
}
