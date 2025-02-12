import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CreateRelProjetosDto } from './dto/create-projetos.dto';
import { PPProjetosRelatorioDto } from './entities/projetos.entity';
import { PPProjetosService } from './pp-projetos.service';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@ApiTags('Relatórios - API')
@Controller('relatorio/projetos')
export class PPProjetosController {
    constructor(private readonly projetos: PPProjetosService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['Reports.executar.MDO'])
    async create(
        @Body() createProjetosDto: CreateRelProjetosDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<PPProjetosRelatorioDto> {
        return await this.projetos.asJSON(createProjetosDto, user);
    }
}
