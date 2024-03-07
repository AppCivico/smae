import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PPStatusService } from './pp-status.service';
import { CreateRelProjetoStatusDto } from './dto/create-projeto-status.dto';
import { PPProjetoStatusRelatorioDto } from './entities/projeto-status.dto';

@ApiTags('Relatórios - API')
@Controller('relatorio/projeto-status')
export class PPStatusController {
    constructor(private readonly projetoStatusService: PPStatusService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('Reports.executar.Projetos')
    async create(@Body() createProjetoStatusDto: CreateRelProjetoStatusDto): Promise<PPProjetoStatusRelatorioDto> {
        return await this.projetoStatusService.create(createProjetoStatusDto);
    }
}
