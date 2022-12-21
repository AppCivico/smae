import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CreateOrcamentoExecutadoDto } from './dto/create-orcamento-executado.dto';
import { ListOrcamentoExecutadoDto } from './entities/orcamento-executado.entity';
import { OrcamentoService } from './orcamento.service';

@ApiTags('Relatórios - API')
@Controller('relatorio/orcamento')
export class OrcamentoController {
    constructor(private readonly orcamentoExecutadoService: OrcamentoService) { }

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('Reports.executar')
    async create(@Body() createOrcamentoExecutadoDto: CreateOrcamentoExecutadoDto): Promise<ListOrcamentoExecutadoDto> {
        return await this.orcamentoExecutadoService.create(createOrcamentoExecutadoDto);
    }
}
