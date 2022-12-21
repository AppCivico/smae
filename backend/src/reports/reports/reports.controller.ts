import { Body, Controller, Post, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
const AdmZip = require("adm-zip");

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { CreateReportDto } from './dto/CreateReport.dto';
import { ReportsService } from './reports.service';
import { Response } from 'express';

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

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

        const files = await this.reportsService.runReport(dto, user);

        const zip = new AdmZip();

        files.forEach(file => {
            zip.addFile(file.name, file.buffer);
        });
        const zipBuffer = zip.toBuffer();

        //if (dto.)

        res.set({
            'Content-Type': 'application/zip',
            'Content-Disposition': 'attachment; filename=files.zip'
        });
        res.write(zipBuffer);
        res.send()
    }

}
