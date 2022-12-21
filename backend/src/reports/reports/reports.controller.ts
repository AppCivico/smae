import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
const AdmZip = require("adm-zip");

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { CreateReportDto } from './dto/CreateReport.dto';
import { ReportsService } from './reports.service';
import { Response } from 'express';
import { UploadService } from 'src/upload/upload.service';
import { Date2YMD } from 'src/common/date2ymd';
import { FilterRelatorioDto } from './dto/filter-relatorio.dto';
import { ListRelatorioDto, RelatorioDto } from './entities/report.entity';

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
    constructor(
        private readonly reportsService: ReportsService,
        private readonly uploadService: UploadService
    ) { }

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('Reports.executar')
    @ApiOkResponse({
        description: 'Recebe o arquivo do relatório, ou msg de erro em JSON',
        type: ''
    })
    async create(
        @Body() dto: CreateReportDto,
        @CurrentUser() user: PessoaFromJwt,
        @Res() res: Response) {
        const contentType = 'application/zip';
        const filename = [dto.fonte, Date2YMD.tzSp2UTC(new Date()), '.zip'].join('');
        const files = await this.reportsService.runReport(dto, user);

        const zip = new AdmZip();

        files.forEach(file => {
            zip.addFile(file.name, file.buffer);
        });
        const zipBuffer = zip.toBuffer();

        if (dto.salvar_arquivo) {
            const arquivoId = await this.uploadService.uploadReport(
                dto.fonte,
                filename,
                zipBuffer,
                contentType,
                user
            );

            await this.reportsService.saveReport(dto, arquivoId, user);
        }

        res.set({
            'Content-Type': contentType,
            'Content-Disposition': 'attachment; filename=' + filename
        });
        res.write(zipBuffer);
        res.send()
    }


    @ApiBearerAuth('access-token')
    @Get()
    @Roles('Reports.executar')
    async findAll(@Query() filters: FilterRelatorioDto): Promise<ListRelatorioDto> {
        const linhas = await this.reportsService.findAll(filters);
        return {
            'linhas': linhas,
        };
    }

}
