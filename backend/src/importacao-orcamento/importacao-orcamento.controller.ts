import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { CreateImportacaoOrcamentoDto, FilterImportacaoOrcamentoDto } from './dto/create-importacao-orcamento.dto';
import { ImportacaoOrcamentoService } from './importacao-orcamento.service';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { ImportacaoOrcamentoDto, ListImportacaoOrcamentoDto } from './entities/importacao-orcamento.entity';
import { ApiPaginatedResponse } from '../auth/decorators/paginated.decorator';
import { PaginatedDto } from '../common/dto/paginated.dto';
import { PortfolioDto } from '../pp/portfolio/entities/portfolio.entity';

@Controller('importacao-orcamento')
@ApiTags('Importação')
export class ImportacaoOrcamentoController {
    constructor(private readonly importacaoOrcamentoService: ImportacaoOrcamentoService) { }

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroMeta.orcamento', 'Projeto.orcamento')
    async create(@Body() dto: CreateImportacaoOrcamentoDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return this.importacaoOrcamentoService.create(dto, user);
    }

    @Get()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroMeta.orcamento', 'Projeto.orcamento')
    @ApiPaginatedResponse(ImportacaoOrcamentoDto)
    async findAll(@Query() filters: FilterImportacaoOrcamentoDto, @CurrentUser() user: PessoaFromJwt): Promise<PaginatedDto<ImportacaoOrcamentoDto>> {
        return await this.importacaoOrcamentoService.findAll(filters, user);
    }

    @Get('portfolio')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroMeta.orcamento', 'Projeto.orcamento')
    @ApiPaginatedResponse(ImportacaoOrcamentoDto)
    async findAll_portfolio(@CurrentUser() user: PessoaFromJwt): Promise<PortfolioDto[]> {
        return await this.importacaoOrcamentoService.findAll_portfolio(user);
    }


}
