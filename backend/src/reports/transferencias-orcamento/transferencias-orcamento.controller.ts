import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CreateRelTransferenciasOrcamentoDto } from './dto/create-transferencias-orcamento.dto';
import { RelatorioTransferenciasOrcamentoDto } from './entities/transferencias-orcamento.entity';
import { TransferenciasOrcamentoService } from './transferencias-orcamento.service';

@ApiTags('Relatórios - API')
@Controller('relatorio/transferencias-orcamento')
export class TransferenciasOrcamentoController {
    constructor(private readonly service: TransferenciasOrcamentoService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['Reports.executar.CasaCivil'])
    async create(@Body() dto: CreateRelTransferenciasOrcamentoDto): Promise<RelatorioTransferenciasOrcamentoDto> {
        return await this.service.asJSON(dto);
    }
}
