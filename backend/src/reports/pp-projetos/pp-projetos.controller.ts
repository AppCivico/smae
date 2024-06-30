import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CreateRelProjetosDto } from './dto/create-projetos.dto';
import { PPProjetosRelatorioDto } from './entities/projetos.entity';
import { PPProjetosService } from './pp-projetos.service';

@ApiTags('Relatórios - API')
@Controller('relatorio/projetos')
export class PPProjetosController {
    constructor(private readonly projetos: PPProjetosService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['Reports.executar.Projetos'])
    async create(@Body() createProjetosDto: CreateRelProjetosDto): Promise<PPProjetosRelatorioDto> {
        return await this.projetos.asJSON(createProjetosDto);
    }
}
