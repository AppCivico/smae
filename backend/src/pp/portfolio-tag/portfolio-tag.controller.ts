import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { FindOneParams } from 'src/common/decorators/find-params';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { PortfolioTagService } from './portfolio-tag.service';
import { ListPortfolioTagDto } from './dto/list-portfolio-tag.dto';
import { PortfolioTagDto } from './entities/portfolio-tag.entity';
import { UpsertPortfolioTagDto } from './dto/upsert-portfolio-tag.dto';
import { FilterPortfolioTagDto } from './dto/filter-portfolio-tag.dto';

@ApiTags('Portfolio Tag')
@Controller('portfolio-tag')
export class PortfolioTagController {
    constructor(private readonly portfolioTagService: PortfolioTagService) {}

    @Post()
    @ApiBearerAuth('access-token')
    //@Roles(['CadastroPortfolioTag.inserir'])
    async create(@Body() dto: UpsertPortfolioTagDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.portfolioTagService.upsert(dto, user);
    }

    @ApiBearerAuth('access-token')
    //@Roles(['CadastroPortfolioTag.editar', 'CadastroPortfolioTag.inserir'])
    @Get()
    async findAll(@Query() filters: FilterPortfolioTagDto): Promise<ListPortfolioTagDto> {
        return await this.portfolioTagService.findAll(filters);
    }

    @Get(':id')
    @ApiBearerAuth('access-token')
    //@Roles(['CadastroPortfolioTag.editar', 'CadastroPortfolioTag.inserir'])
    async findOne(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<PortfolioTagDto> {
        return await this.portfolioTagService.findOne(params.id, user);
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    //@Roles(['CadastroPortfolioTag.editar'])
    async update(
        @Param() params: FindOneParams,
        @Body() dto: UpsertPortfolioTagDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.portfolioTagService.upsert(dto, user, +params.id);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    //@Roles(['CadastroPortfolioTag.remover'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.portfolioTagService.remove(+params.id, user);
        return '';
    }
}
