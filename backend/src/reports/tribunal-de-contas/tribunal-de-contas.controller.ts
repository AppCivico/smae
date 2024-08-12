import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { TribunalDeContasService } from './tribunal-de-contas.service';
import { CreateRelTribunalDeContasDto } from './dto/create-tribunal-de-contas.dto';
import { RelatorioTribunalDeContasDto } from './entities/tribunal-de-contas.entity';

@ApiTags('Relatórios - API')
@Controller('relatorio/tribunal-de-contas')
export class TribunalDeContasController {
    constructor(private readonly tribunalDeContas: TribunalDeContasService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['Reports.executar.CasaCivil'])
    async create(
        @Body() createTribunalDeContasDto: CreateRelTribunalDeContasDto
    ): Promise<RelatorioTribunalDeContasDto> {
        return await this.tribunalDeContas.asJSON(createTribunalDeContasDto);
    }
}
