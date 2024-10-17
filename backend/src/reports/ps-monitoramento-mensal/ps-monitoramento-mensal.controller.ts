import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CreatePsMonitoramentoMensalFilterDto } from './dto/create-ps-monitoramento-mensal-filter.dto';
import { RelPsMonitRetorno } from './entities/ps-monitoramento-mensal.entity';
import { PSMonitoramentoMensal } from './ps-monitoramento-mensal.service';

@ApiTags('Relatórios - API')
@Controller('relatorio/planos-setoriais-monitoramento-mensal')
export class PsMonitoramentoMensalController {
    constructor(private readonly monitoramentoMensalPsService: PSMonitoramentoMensal) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['Reports.executar.PlanoSetorial'])
    async create(
        @Body() createOrcamentoExecutadoDto: CreatePsMonitoramentoMensalFilterDto
    ): Promise<RelPsMonitRetorno> {
        return await this.monitoramentoMensalPsService.asJSON(createOrcamentoExecutadoDto);
    }
}
