import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import AdmZip from 'adm-zip';

import { Response } from 'express';
import { DateTime } from 'luxon';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { ApiPaginatedResponse } from '../../auth/decorators/paginated.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { FindOneParams } from '../../common/decorators/find-params';
import { PaginatedDto } from '../../common/dto/paginated.dto';
import { UploadService } from '../../upload/upload.service';
import { CreateReportDto } from './dto/create-report.dto';
import { FilterRelatorioDto } from './dto/filter-relatorio.dto';
import { RelatorioDto } from './entities/report.entity';
import { ReportsService } from './reports.service';
const XLSX = require('xlsx');
const { parse } = require('csv-parse');
const XLSX_ZAHL_PAYLOAD = require('xlsx/dist/xlsx.zahl');

@ApiTags('Relatórios')
@Controller('relatorios')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService, private readonly uploadService: UploadService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('Reports.executar')
    @ApiOkResponse({
        description: 'Recebe o arquivo do relatório, ou msg de erro em JSON',
        type: '',
    })
    async create(@Body() dto: CreateReportDto, @CurrentUser() user: PessoaFromJwt, @Res() res: Response) {
        const contentType = 'application/zip';
        const filename = [
            dto.fonte,
            (dto.parametros as any)['tipo'],
            (dto.parametros as any)['ano'],
            ,
            (dto.parametros as any)['mes'],
            (dto.parametros as any)['periodo'],
            (dto.parametros as any)['semestre'],
            DateTime.local({ zone: 'America/Sao_Paulo' }).toISO(),
            '.zip',
        ]
            .filter(r => r !== undefined)
            .join('-');
        const files = await this.reportsService.runReport(dto, user);

        const zip = new AdmZip();

        for (const file of files) {
            zip.addFile(file.name, file.buffer);

            if (file.name.endsWith('.csv')) {
                const readCsv: any[] = await new Promise((resolve, reject) => {
                    parse(file.buffer, { columns: true }, (err: any, data: any) => {
                        if (err) throw reject(err);
                        resolve(data);
                    });
                });

                // converte o que se parece com números automaticamente
                for (let i = 0; i < readCsv.length; i++) {
                    const element = readCsv[i];
                    for (const k in element) {
                        if (/^\d+(:?\.\d+)?$/.test(element[k])) {
                            element[k] *= 1;
                        }
                    }
                }

                const csvDataArray = XLSX.utils.json_to_sheet(readCsv);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, csvDataArray, 'Sheet1');

                zip.addFile(file.name.replace(/\.csv$/, '.xlsx'), XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx', numbers: XLSX_ZAHL_PAYLOAD, compression: true }));
            }
        }
        const zipBuffer = zip.toBuffer();

        if (dto.salvar_arquivo) {
            const arquivoId = await this.uploadService.uploadReport(dto.fonte, filename, zipBuffer, contentType, user);

            await this.reportsService.saveReport(dto, arquivoId, user);
        }

        res.set({
            'Content-Type': contentType,
            'Content-Disposition': 'attachment; filename="' + filename.replace(/"/g, '-') + '"',
            'Access-Control-Expose-Headers': 'content-disposition',
        });
        res.write(zipBuffer);
        res.send();
    }

    @ApiBearerAuth('access-token')
    @Get()
    @Roles('Reports.executar')
    @ApiPaginatedResponse(RelatorioDto)
    async findAll(@Query() filters: FilterRelatorioDto): Promise<PaginatedDto<RelatorioDto>> {
        return await this.reportsService.findAll(filters);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles('Reports.remover')
    @ApiUnauthorizedResponse()
    @ApiResponse({ description: 'sucesso ao remover', status: 204 })
    @HttpCode(HttpStatus.NO_CONTENT)
    async remover(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.reportsService.delete(params.id, user);
        return null;
    }
}
