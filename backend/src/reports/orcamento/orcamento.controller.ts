import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PdmCreateOrcamentoExecutadoDto } from './dto/create-orcamento-executado.dto';
import { ListOrcamentoExecutadoDto } from './entities/orcamento-executado.entity';
import { OrcamentoService } from './orcamento.service';

@ApiTags('Relatórios - API')
@Controller('relatorio/orcamento')
export class OrcamentoController {
    constructor(private readonly orcamentoExecutadoService: OrcamentoService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['Reports.executar.PDM'])
    async create(
        @Body() createOrcamentoExecutadoDto: PdmCreateOrcamentoExecutadoDto
    ): Promise<ListOrcamentoExecutadoDto> {
        return await this.orcamentoExecutadoService.asJSON(createOrcamentoExecutadoDto);
    }
}
