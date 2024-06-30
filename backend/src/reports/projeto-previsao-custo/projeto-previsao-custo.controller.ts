import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ListPrevisaoCustoDto } from '../previsao-custo/entities/previsao-custo.entity';
import { CreateRelProjetoPrevisaoCustoDto } from './dto/create-projeto-previsao-custo.dto';
import { PrevisaoCustoService } from '../previsao-custo/previsao-custo.service';

@ApiTags('Relatórios - API')
@Controller('relatorio/projeto-previsao-custo')
export class ProjetoPrevisaoCustoController {
    constructor(private readonly previsaoCustoService: PrevisaoCustoService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['Reports.executar.Projetos'])
    async create(@Body() createPrevisaoCustDto: CreateRelProjetoPrevisaoCustoDto): Promise<ListPrevisaoCustoDto> {
        return await this.previsaoCustoService.asJSON(createPrevisaoCustDto);
    }
}
