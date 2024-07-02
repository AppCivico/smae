import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CreateRelParlamentaresDto } from './dto/create-parlamentares.dto';
import { ParlamentaresRelatorioDto } from './entities/parlamentares.entity';
import { ParlamentaresService } from './parlamentares.service';

@ApiTags('Relatórios - API')
@Controller('relatorio/parlamentares')
export class ParlamentaresController {
    constructor(private readonly parlamentares: ParlamentaresService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['Reports.executar.CasaCivil'])
    async create(@Body() createParlamentaresDto: CreateRelParlamentaresDto): Promise<ParlamentaresRelatorioDto> {
        return await this.parlamentares.asJSON(createParlamentaresDto);
    }
}
