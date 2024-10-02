import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CasaCivilAtividadesPendentesService } from './casa-civil-atividades-pendentes.service';
import { CreateCasaCivilAtividadesPendentesFilter } from './dto/create-casa-civil-atv-pend-filter.dto';
import { RelCasaCivilAtividadesPendentes } from './entities/casa-civil-atividaes-pendentes.entity';

@ApiTags('Relatórios - API')
@Controller('relatorio/casa-civil-atividades-pendentes')
export class CasaCivilAtividadesPendentesController {
    constructor(private readonly casaCivilAtividadesPendentes: CasaCivilAtividadesPendentesService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['Reports.executar.CasaCivil'])
    async create(
        @Body() createOrcamentoExecutadoDto: CreateCasaCivilAtividadesPendentesFilter
    ): Promise<RelCasaCivilAtividadesPendentes[]> {
        return await this.casaCivilAtividadesPendentes.asJSON(createOrcamentoExecutadoDto);
    }
}
