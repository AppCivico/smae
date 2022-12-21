import { HttpException, Injectable } from '@nestjs/common';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { PrismaService } from '../../prisma/prisma.service';
import { OrcamentoService } from '../orcamento/orcamento.service';
import { FileOutput, ParseParametrosDaFonte, ReportableService } from '../utils/utils.service';
import { CreateReportDto } from './dto/CreateReport.dto';


@Injectable()
export class ReportsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly orcamentoService: OrcamentoService,

    ) { }

    async runReport(dto: CreateReportDto, user: PessoaFromJwt): Promise<FileOutput[]> {
        let service: ReportableService | null = this.servicoDaFonte(dto);

        // acaba sendo chamado 2x a cada request, pq já rodou 1x na validação, mas blz.
        const parametros = ParseParametrosDaFonte(dto.fonte, dto.parametros);

        const result = await service.create(parametros);

        return await service.getFiles(result);
    }


    private servicoDaFonte(dto: CreateReportDto) {
        let service: ReportableService | null = null;
        switch (dto.fonte) {
            case 'Orcamento': service = this.orcamentoService; break;
        }
        if (service === null)
            throw new HttpException(`Fonte ${dto.fonte} ainda não foi implementada`, 500);
        return service;
    }
}
