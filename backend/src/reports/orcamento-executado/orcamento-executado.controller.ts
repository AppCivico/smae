import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CreateOrcamentoExecutadoDto } from './dto/create-orcamento-executado.dto';
import { ListOrcamentoExecutadoDto } from './entities/orcamento-executado.entity';
import { OrcamentoExecutadoService } from './orcamento-executado.service';

@ApiTags('Reports')
@Controller('reports/orcamento-executado')
export class OrcamentoExecutadoController {
    constructor(private readonly orcamentoExecutadoService: OrcamentoExecutadoService) { }

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('Reports.executar')
    async create(@Body() createOrcamentoExecutadoDto: CreateOrcamentoExecutadoDto): Promise<ListOrcamentoExecutadoDto> {
        return this.orcamentoExecutadoService.create(createOrcamentoExecutadoDto);
    }

}
