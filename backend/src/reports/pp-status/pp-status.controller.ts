import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PPStatusService } from './pp-status.service';
import { CreateRelObraStatusDto, CreateRelProjetoStatusDto } from './dto/create-projeto-status.dto';
import { PPProjetoStatusRelatorioDto } from './entities/projeto-status.dto';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@ApiTags('Relatórios - API')
@Controller('relatorio/projeto-status')
export class PPStatusController {
    constructor(private readonly projetoStatusService: PPStatusService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['Reports.executar.Projetos'])
    @ApiExtraModels(CreateRelObraStatusDto)
    async create(
        @Body() createProjetoStatusDto: CreateRelProjetoStatusDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<PPProjetoStatusRelatorioDto> {
        createProjetoStatusDto.tipo_pdm = 'PP';
        return await this.projetoStatusService.asJSON(createProjetoStatusDto, user);
    }
}

@ApiTags('Relatórios - API')
@Controller('relatorio/mdo-projeto-status')
export class MDOStatusController {
    constructor(private readonly projetoStatusService: PPStatusService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['Reports.executar.MDO'])
    async create(
        @Body() createProjetoStatusDto: CreateRelProjetoStatusDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<PPProjetoStatusRelatorioDto> {
        createProjetoStatusDto.tipo_pdm = 'MDO';
        return await this.projetoStatusService.asJSON(createProjetoStatusDto, user);
    }
}
