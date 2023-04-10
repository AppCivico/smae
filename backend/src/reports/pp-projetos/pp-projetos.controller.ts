import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PPProjetosService } from './pp-projetos.service';
import { CreateRelProjetoDto } from '../pp-projeto/dto/create-previsao-custo.dto';
import { PPProjetosRelatorioDto } from './entities/projetos.entity';
import { CreateRelProjetosDto } from './dto/create-projetos.dto';

@ApiTags('Relatórios - API')
@Controller('relatorio/projetos')
export class PPProjetosController {
    constructor(private readonly projetos: PPProjetosService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('Reports.executar')
    async create(@Body() createProjetosDto: CreateRelProjetosDto): Promise<PPProjetosRelatorioDto> {
        return await this.projetos.create(createProjetosDto);
    }
}
