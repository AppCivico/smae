import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PPStatusService } from './pp-status.service';
import { CreateRelObraStatusDto, CreateRelProjetoStatusDto } from './dto/create-projeto-status.dto';
import { PPProjetoStatusRelatorioDto } from './entities/projeto-status.dto';

@ApiTags('Relatórios - API')
@Controller('relatorio/projeto-status')
export class PPStatusController {
    constructor(private readonly projetoStatusService: PPStatusService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['Reports.executar.Projetos'])
    @ApiExtraModels(CreateRelObraStatusDto)
    async create(@Body() createProjetoStatusDto: CreateRelProjetoStatusDto): Promise<PPProjetoStatusRelatorioDto> {
        createProjetoStatusDto.tipo = 'PP';
        return await this.projetoStatusService.asJSON(createProjetoStatusDto);
    }
}

@ApiTags('Relatórios - API')
@Controller('relatorio/mdo-projeto-status')
export class MDOStatusController {
    constructor(private readonly projetoStatusService: PPStatusService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['Reports.executar.MDO'])
    async create(@Body() createProjetoStatusDto: CreateRelProjetoStatusDto): Promise<PPProjetoStatusRelatorioDto> {
        createProjetoStatusDto.tipo = 'MDO';
        return await this.projetoStatusService.asJSON(createProjetoStatusDto);
    }
}
