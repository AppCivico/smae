import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CreateRelProjetoDto } from './dto/create-previsao-custo.dto';
import { PPProjetoRelatorioDto } from './entities/previsao-custo.entity';
import { PPProjetoService } from './pp-projeto.service';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@ApiTags('Relatórios - API')
@Controller('relatorio/projeto')
export class PPProjetoController {
    constructor(private readonly projeto: PPProjetoService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['Reports.executar.Projetos'])
    async create(
        @Body() createPrevisaoCustDto: CreateRelProjetoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<PPProjetoRelatorioDto> {
        return await this.projeto.asJSON(createPrevisaoCustDto, user);
    }
}
