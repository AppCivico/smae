import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CreateRelProjetoDto } from './dto/create-previsao-custo.dto';
import { PPProjetoRelatorioDto } from './entities/previsao-custo.entity';
import { PPProjetoService } from './pp-projeto.service';

@ApiTags('Relatórios - API')
@Controller('relatorio/projeto')
export class PPProjetoController {
    constructor(private readonly projeto: PPProjetoService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('Reports.executar.Projetos')
    async create(@Body() createPrevisaoCustDto: CreateRelProjetoDto): Promise<PPProjetoRelatorioDto> {
        return await this.projeto.create(createPrevisaoCustDto);
    }
}
