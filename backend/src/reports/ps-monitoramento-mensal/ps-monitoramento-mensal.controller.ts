import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { CreatePsMonitoramentoMensalFilterDto } from './dto/create-ps-monitoramento-mensal-filter.dto';
import { RelPsMonitRetorno } from './entities/ps-monitoramento-mensal.entity';
import { PSMonitoramentoMensal } from './ps-monitoramento-mensal.service';

@ApiTags('Relatórios - API')
@Controller('relatorio/planos-setoriais-monitoramento-mensal')
export class PsMonitoramentoMensalController {
    constructor(private readonly monitoramentoMensalPsService: PSMonitoramentoMensal) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['Reports.executar.PlanoSetorial', 'Reports.executar.ProgramaDeMetas'])
    async create(
        @Body() createOrcamentoExecutadoDto: CreatePsMonitoramentoMensalFilterDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RelPsMonitRetorno> {
        return await this.monitoramentoMensalPsService.asJSON(createOrcamentoExecutadoDto, user);
    }
}
