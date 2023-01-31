import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CreateRelMonitoramentoMensalDto } from './dto/create-monitoramento-mensal.dto';
import { RetMonitoramentoMensal } from './entities/monitoramento-mensal.entity';
import { MonitoramentoMensalService } from './monitoramento-mensal.service';

@ApiTags('Relatórios - API')
@Controller('relatorio/monitoramento-mensal')
export class MonitoramentoMensalController {
    constructor(private readonly monitoramentoMensalService: MonitoramentoMensalService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('Reports.executar')
    async create(@Body() createOrcamentoExecutadoDto: CreateRelMonitoramentoMensalDto): Promise<RetMonitoramentoMensal> {
        return await this.monitoramentoMensalService.create(createOrcamentoExecutadoDto);
    }
}
