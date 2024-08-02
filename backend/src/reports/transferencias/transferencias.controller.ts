import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CreateRelTransferenciasDto } from './dto/create-transferencias.dto';
import { TransferenciasService } from './transferencias.service';
import { TransferenciasRelatorioDto } from './entities/transferencias.entity';

@ApiTags('Relatórios - API')
@Controller('relatorio/transferencias')
export class TransferenciasController {
    constructor(private readonly transferencias: TransferenciasService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['Reports.executar.CasaCivil'])
    async create(@Body() createTransferenciasDto: CreateRelTransferenciasDto): Promise<TransferenciasRelatorioDto> {
        return await this.transferencias.asJSON(createTransferenciasDto);
    }
}
