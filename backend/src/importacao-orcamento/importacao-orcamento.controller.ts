import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { ApiPaginatedResponse } from '../auth/decorators/paginated.decorator';
import { PaginatedDto } from '../common/dto/paginated.dto';
import { PortfolioDto } from '../pp/portfolio/entities/portfolio.entity';
import { CreateImportacaoOrcamentoDto, FilterImportacaoOrcamentoDto } from './dto/create-importacao-orcamento.dto';
import { ImportacaoOrcamentoDto } from './entities/importacao-orcamento.entity';
import { ImportacaoOrcamentoService } from './importacao-orcamento.service';
import { PlanoSetorialController } from '../pdm/pdm.controller';

@Controller('importacao-orcamento')
@ApiTags('Importação')
export class ImportacaoOrcamentoController {
    constructor(private readonly importacaoOrcamentoService: ImportacaoOrcamentoService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles([
        'CadastroMeta.orcamento',
        ...PlanoSetorialController.OrcamentoWritePerms,
        'Projeto.orcamento',
        'ProjetoMDO.orcamento',
    ])
    async create(@Body() dto: CreateImportacaoOrcamentoDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return this.importacaoOrcamentoService.create(dto, user);
    }

    @Get()
    @ApiBearerAuth('access-token')
    @Roles([
        'CadastroMeta.orcamento',
        ...PlanoSetorialController.OrcamentoWritePerms,
        'Projeto.orcamento',
        'ProjetoMDO.orcamento',
    ])
    @ApiPaginatedResponse(ImportacaoOrcamentoDto)
    async findAll(
        @Query() filters: FilterImportacaoOrcamentoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<PaginatedDto<ImportacaoOrcamentoDto>> {
        return await this.importacaoOrcamentoService.findAll(filters, user);
    }

    @Get('portfolio')
    @ApiBearerAuth('access-token')
    @Roles([
        'CadastroMeta.orcamento',
        ...PlanoSetorialController.OrcamentoWritePerms,
        'Projeto.orcamento',
        'ProjetoMDO.orcamento',
    ])
    async findAll_portfolio(@CurrentUser() user: PessoaFromJwt): Promise<PortfolioDto[]> {
        return await this.importacaoOrcamentoService.findAll_portfolio(user);
    }
}
