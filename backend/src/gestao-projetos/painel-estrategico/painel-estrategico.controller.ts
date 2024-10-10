import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Post } from '@nestjs/common';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { PainelEstrategicoResponseDto } from './entities/painel-estrategico-responses.dto';
import { PainelEstrategicoService } from './painel-estrategico.service';
import { PainelEstrategicoFilterDto } from './dto/painel-estrategico-filter.dto';

@ApiTags('Dashboard')
@Controller('painel-estrategico')
export class PainelEstrategicoController {
    constructor(private readonly painelEstrategicoService: PainelEstrategicoService) {}
    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['Reports.dashboard_pdm', 'Reports.dashboard_portfolios', 'SMAE.espectador_de_painel_externo'])
    async create(
        @Body() filtro: PainelEstrategicoFilterDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<PainelEstrategicoResponseDto> {
        return await this.painelEstrategicoService.buildPainel(filtro,user);
    }

}
