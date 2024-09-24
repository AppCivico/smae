import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { OrcamentoService } from '../orcamento/orcamento.service';
import { CreateRelProjetoOrcamentoDto } from './dto/create-projeto-orcamento.dto';
import { ListOrcamentoExecutadoDto } from '../orcamento/entities/orcamento-executado.entity';

@ApiTags('Relatórios - API')
@Controller('relatorio/projeto-orcamento')
export class ProjetoOrcamentoController {
    constructor(private readonly orcamentoExecutadoService: OrcamentoService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['Reports.executar.Projetos'])
    async create(@Body() createPrevisaoCustDto: CreateRelProjetoOrcamentoDto): Promise<ListOrcamentoExecutadoDto> {
        return await this.orcamentoExecutadoService.asJSON(createPrevisaoCustDto);
    }
}

@ApiTags('Relatórios - API')
@Controller('relatorio/projeto-orcamento-mdo')
export class ProjetoMDOOrcamentoController {
    constructor(private readonly orcamentoExecutadoService: OrcamentoService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['Reports.executar.MDO'])
    async create(@Body() createPrevisaoCustDto: CreateRelProjetoOrcamentoDto): Promise<ListOrcamentoExecutadoDto> {
        return await this.orcamentoExecutadoService.asJSON(createPrevisaoCustDto);
    }
}
