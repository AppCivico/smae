import { HttpException, Injectable, Logger } from '@nestjs/common';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { UploadService } from 'src/upload/upload.service';
import { PrismaService } from '../../prisma/prisma.service';
import { OrcamentoService } from '../orcamento/orcamento.service';
import { FileOutput, ParseParametrosDaFonte, ReportableService } from '../utils/utils.service';
import { CreateReportDto } from './dto/CreateReport.dto';
import { FilterRelatorioDto } from './dto/filter-relatorio.dto';
import { RelatorioDto } from './entities/report.entity';


@Injectable()
export class ReportsService {
    private readonly logger = new Logger(ReportsService.name);
    constructor(
        private readonly prisma: PrismaService,
        private readonly orcamentoService: OrcamentoService,
        private readonly uploadService: UploadService

    ) { }

    async runReport(dto: CreateReportDto, user: PessoaFromJwt): Promise<FileOutput[]> {
        let service: ReportableService | null = this.servicoDaFonte(dto);

        // acaba sendo chamado 2x a cada request, pq já rodou 1x na validação, mas blz.
        const parametros = ParseParametrosDaFonte(dto.fonte, dto.parametros);

        const result = await service.create(parametros);

        return await service.getFiles(result);
    }

    async saveReport(dto: CreateReportDto, arquivoId: number, user: PessoaFromJwt): Promise<RecordWithId> {
        const parametros = dto.parametros;
        const pdmId = parametros.pdm_id;
        if (!pdmId) throw new HttpException('parametros.pdm_id é necessário para salvar um relatório', 400);

        const tipo = parametros.tipo;

        const result = await this.prisma.relatorio.create({
            data: {
                pdm_id: +pdmId,
                arquivo_id: arquivoId,
                fonte: dto.fonte,
                tipo: tipo && tipo.length ? tipo : null,
                parametros: parametros,
                criado_por: user.id,
                criado_em: new Date(),
            },
            select: { id: true }
        });
        this.logger.log(`persistido arquivo ${arquivoId} no relatorio ${result.id}`);
        return { id: result.id }
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


    async findAll(filters: FilterRelatorioDto): Promise<RelatorioDto[]> {

        const rows = await this.prisma.relatorio.findMany({
            where: {
                fonte: filters.fonte,
                pdm_id: filters.pdm_id,
                removido_em: null
            },
            select: {
                id: true,
                criado_em: true,
                criador: { select: { nome_exibicao: true } },
                fonte: true,
                arquivo_id: true,
                parametros: true,
                pdm_id: true,
            }
        });

        return rows.map((r) => {
            return {
                ...r,
                criador: { nome_exibicao: r.criador?.nome_exibicao || '(sistema)' },
                arquivo: this.uploadService.getDownloadToken(r.arquivo_id, '1d').download_token,
            }
        });
    }

    async delete(id: number, user: PessoaFromJwt) {
        await this.prisma.relatorio.updateMany({
            where: {
                id: id
            }, data: {
                removido_em: new Date(),
                removido_por: user.id
            }
        });
    }

}
