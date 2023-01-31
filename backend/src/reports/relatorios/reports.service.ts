import { HttpException, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { PaginatedDto } from '../../common/dto/paginated.dto';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadService } from '../../upload/upload.service';
import { IndicadoresService } from '../indicadores/indicadores.service';
import { MonitoramentoMensalService } from '../monitoramento-mensal/monitoramento-mensal.service';
import { OrcamentoService } from '../orcamento/orcamento.service';
import { PPProjetoService } from '../pp-projeto/pp-projeto.service';
import { PrevisaoCustoService } from '../previsao-custo/previsao-custo.service';
import { FileOutput, ParseParametrosDaFonte, ReportableService } from '../utils/utils.service';
import { CreateReportDto } from './dto/create-report.dto';
import { FilterRelatorioDto } from './dto/filter-relatorio.dto';
import { RelatorioDto } from './entities/report.entity';

class NextPageTokenJwtBody {
    offset: number;
    ipp: number;
}

@Injectable()
export class ReportsService {
    private readonly logger = new Logger(ReportsService.name);
    constructor(
        private readonly jwtService: JwtService,
        private readonly prisma: PrismaService,
        private readonly orcamentoService: OrcamentoService,
        private readonly uploadService: UploadService,
        private readonly indicadoresService: IndicadoresService,
        private readonly mmService: MonitoramentoMensalService,
        private readonly previsaoCustoService: PrevisaoCustoService,
        private readonly ppProjetoService: PPProjetoService,
    ) { }

    async runReport(dto: CreateReportDto, user: PessoaFromJwt): Promise<FileOutput[]> {
        const service: ReportableService | null = this.servicoDaFonte(dto);

        // acaba sendo chamado 2x a cada request, pq já rodou 1x na validação, mas blz.
        const parametros = ParseParametrosDaFonte(dto.fonte, dto.parametros);

        const pdmId = parametros.pdm_id !== undefined ? parametros.pdm_id : null;

        const result = await service.create(parametros);

        return await service.getFiles(result, pdmId, dto.parametros);
    }

    async saveReport(dto: CreateReportDto, arquivoId: number, user: PessoaFromJwt): Promise<RecordWithId> {
        const parametros = dto.parametros;
        const pdmId = parametros.pdm_id !== undefined ? Number(parametros.pdm_id) : null;
        //if (!pdmId) throw new HttpException('parametros.pdm_id é necessário para salvar um relatório', 400);

        const tipo = parametros.tipo;

        const result = await this.prisma.relatorio.create({
            data: {
                pdm_id: pdmId,
                arquivo_id: arquivoId,
                fonte: dto.fonte,
                tipo: tipo && tipo.length ? tipo : null,
                parametros: parametros,
                criado_por: user.id,
                criado_em: new Date(),
            },
            select: { id: true },
        });
        this.logger.log(`persistido arquivo ${arquivoId} no relatório ${result.id}`);
        return { id: result.id };
    }

    private servicoDaFonte(dto: CreateReportDto) {
        let service: ReportableService | null = null;
        switch (dto.fonte) {
            case 'Orcamento':
                service = this.orcamentoService;
                break;
            case 'Indicadores':
                service = this.indicadoresService;
                break;
            case 'MonitoramentoMensal':
                service = this.mmService;
                break;
            case 'PrevisaoCusto':
                service = this.previsaoCustoService;
                break;
            case 'Projeto':
                service = this.ppProjetoService;
                break;
        }
        if (service === null) throw new HttpException(`Fonte ${dto.fonte} ainda não foi implementada`, 500);
        return service;
    }

    async findAll(filters: FilterRelatorioDto): Promise<PaginatedDto<RelatorioDto>> {
        let tem_mais = false;
        let token_proxima_pagina: string | null = null;

        let ipp = filters.ipp ? filters.ipp : 25;
        let offset = 0;
        const decodedPageToken = this.decodeNextPageToken(filters.token_proxima_pagina);

        if (decodedPageToken) {
            offset = decodedPageToken.offset;
            ipp = decodedPageToken.ipp;
        }

        const rows = await this.prisma.relatorio.findMany({
            where: {
                fonte: filters.fonte,
                pdm_id: filters.pdm_id,
                removido_em: null,
            },
            select: {
                id: true,
                criado_em: true,
                criador: { select: { nome_exibicao: true } },
                fonte: true,
                arquivo_id: true,
                parametros: true,
                pdm_id: true,
            },
            orderBy: {
                criado_em: 'desc',
            },
            skip: offset,
            take: ipp + 1,
        });

        if (rows.length > ipp) {
            tem_mais = true;
            rows.pop();
            token_proxima_pagina = this.encodeNextPageToken({ ipp: ipp, offset: offset + ipp });
        }

        return {
            linhas: rows.map(r => {
                return {
                    ...r,
                    criador: { nome_exibicao: r.criador?.nome_exibicao || '(sistema)' },
                    arquivo: this.uploadService.getDownloadToken(r.arquivo_id, '1d').download_token,
                };
            }),
            tem_mais: tem_mais,
            token_proxima_pagina: token_proxima_pagina,
        };
    }

    async delete(id: number, user: PessoaFromJwt) {
        await this.prisma.relatorio.updateMany({
            where: {
                id: id,
            },
            data: {
                removido_em: new Date(),
                removido_por: user.id,
            },
        });
    }

    decodeNextPageToken(jwt: string | undefined): NextPageTokenJwtBody | null {
        let tmp: NextPageTokenJwtBody | null = null;
        try {
            if (jwt) tmp = this.jwtService.decode(jwt) as NextPageTokenJwtBody;
        } catch {
            throw new HttpException('Param next_page_token is invalid', 400);
        }
        return tmp;
    }

    encodeNextPageToken(opt: NextPageTokenJwtBody): string {
        return this.jwtService.sign(opt);
    }
}
