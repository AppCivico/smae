import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
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
        @Body() createOrcamentoExecutadoDto: PdmCreateOrcamentoExecutadoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListOrcamentoExecutadoDto> {
        return await this.orcamentoExecutadoService.asJSON(createOrcamentoExecutadoDto, user);
    }
}

@ApiTags('Relatórios - API')
@Controller('relatorio/plano-setorial-orcamento')
export class PSOrcamentoController {
    constructor(private readonly orcamentoExecutadoService: OrcamentoService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['Reports.executar.PlanoSetorial'])
    async create(
        @Body() createOrcamentoExecutadoDto: PdmCreateOrcamentoExecutadoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListOrcamentoExecutadoDto> {
        return await this.orcamentoExecutadoService.asJSON(createOrcamentoExecutadoDto, user);
    }
}
