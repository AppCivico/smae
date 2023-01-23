import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { RecordWithId } from '../../common/dto/record-with-id.dto';

@ApiTags('Portfolio')
@Controller('portfolio')
export class PortfolioController {
    constructor(private readonly portfolioService: PortfolioService) { }

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('SMAE.admin_portfolio')
    async create(@Body() createPortfolioDto: CreatePortfolioDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.portfolioService.create(createPortfolioDto, user);
    }

    @Get()
    @Roles('SMAE.admin_portfolio', 'SMAE.gestor_de_projeto')
    async findAll(@CurrentUser() user: PessoaFromJwt): Promise<ListPortfolioDto> {
        return {
            linhas: await this.portfolioService.findAll(user)
        };
    }

    @Patch(':id')
    @ApiUnauthorizedResponse()
    @Roles('SMAE.admin_portfolio')
    async update(@Param('id') id: string, @Body() updatePortfolioDto: UpdatePortfolioDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.portfolioService.update(+id, updatePortfolioDto, user);
    }

    @Delete(':id')
    @ApiUnauthorizedResponse()
    @Roles('SMAE.admin_portfolio')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param('id') id: string, @CurrentUser() user: PessoaFromJwt) {
        await this.portfolioService.remove(+id, user);
        return '';
    }
}
