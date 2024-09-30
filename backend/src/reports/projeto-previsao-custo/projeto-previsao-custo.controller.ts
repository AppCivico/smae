import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ListPrevisaoCustoDto } from '../previsao-custo/entities/previsao-custo.entity';
import {
    CreateRelObrasPrevisaoCustoDto,
    CreateRelProjetoPrevisaoCustoDto,
} from './dto/create-projeto-previsao-custo.dto';
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

@ApiTags('Relatórios - API')
@Controller('relatorio/projeto-previsao-custo-mdo')
export class ProjetoMDOPrevisaoCustoController {
    constructor(private readonly previsaoCustoService: PrevisaoCustoService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['Reports.executar.MDO'])
    async create(@Body() createPrevisaoCustDto: CreateRelObrasPrevisaoCustoDto): Promise<ListPrevisaoCustoDto> {
        return await this.previsaoCustoService.asJSON(createPrevisaoCustDto);
    }
}
