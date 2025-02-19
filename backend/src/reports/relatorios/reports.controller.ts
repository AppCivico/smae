import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { ApiPaginatedResponse } from '../../auth/decorators/paginated.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { FindOneParams } from '../../common/decorators/find-params';
import { PaginatedDto } from '../../common/dto/paginated.dto';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { UploadService } from '../../upload/upload.service';
import { CreateReportDto } from './dto/create-report.dto';
import { FilterRelatorioDto } from './dto/filter-relatorio.dto';
import { RelatorioDto } from './entities/report.entity';
import { ReportsService } from './reports.service';

@ApiTags('Relatórios')
@Controller('relatorios')
export class ReportsController {
    constructor(
        private readonly reportsService: ReportsService,
        private readonly uploadService: UploadService
    ) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles([
        'Reports.executar.CasaCivil',
        'Reports.executar.PDM',
        'Reports.executar.Projetos',
        'Reports.executar.MDO',
        'Reports.executar.PlanoSetorial',
    ])
    @ApiOkResponse({
        description: 'Recebe o arquivo do relatório, ou msg de erro em JSON',
        type: '',
    })
    async create(
        @Body() dto: CreateReportDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        const sistema = user.assertOneModuloSistema('criar', 'Relatórios');

        return await this.reportsService.saveReport(dto, null, user, sistema);
    }

    @ApiBearerAuth('access-token')
    @Get()
    @Roles([
        'Reports.executar.CasaCivil',
        'Reports.executar.PDM',
        'Reports.executar.Projetos',
        'Reports.executar.MDO',
        'Reports.executar.PlanoSetorial',
    ])
    @ApiPaginatedResponse(RelatorioDto)
    async findAll(
        @Query() filters: FilterRelatorioDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<PaginatedDto<RelatorioDto>> {
        return await this.reportsService.findAll(filters, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles([
        'Reports.remover.CasaCivil',
        'Reports.remover.PDM',
        'Reports.remover.Projetos',
        'Reports.remover.MDO',
        'Reports.remover.PlanoSetorial',
    ])
    @ApiResponse({ description: 'sucesso ao remover', status: 204 })
    @HttpCode(HttpStatus.NO_CONTENT)
    async remover(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.reportsService.delete(params.id, user);
        return null;
    }

    @Get('sync-parametros')
    @ApiBearerAuth('access-token')
    async syncParametros(@CurrentUser() user: PessoaFromJwt) {
        await this.reportsService.syncRelatoriosParametros();
        return '';
    }
}
