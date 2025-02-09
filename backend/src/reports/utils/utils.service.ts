import { Injectable } from '@nestjs/common';
import { FonteRelatorio } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRelIndicadorDto } from '../indicadores/dto/create-indicadores.dto';
import { CreateRelMonitoramentoMensalDto } from '../monitoramento-mensal/dto/create-monitoramento-mensal.dto';
import { PdmCreateOrcamentoExecutadoDto as CreateRelPdmOrcamentoExecutadoDto } from '../orcamento/dto/create-orcamento-executado.dto';
import { CreateRelProjetoDto } from '../pp-projeto/dto/create-previsao-custo.dto';
import { CreateRelProjetosDto } from '../pp-projetos/dto/create-projetos.dto';
import { CreateRelObraStatusDto, CreateRelProjetoStatusDto } from '../pp-status/dto/create-projeto-status.dto';
import { CreateRelPrevisaoCustoDto as CreateRelPdmPrevisaoCustoDto } from '../previsao-custo/dto/create-previsao-custo.dto';
import { CreateRelProjetoOrcamentoDto } from '../projeto-orcamento/dto/create-projeto-orcamento.dto';
import { CreateRelProjetoPrevisaoCustoDto } from '../projeto-previsao-custo/dto/create-projeto-previsao-custo.dto';
import { FiltroMetasIniAtividadeDto } from '../relatorios/dto/filtros.dto';
import { CreateRelParlamentaresDto } from '../parlamentares/dto/create-parlamentares.dto';
import { CreateRelTransferenciasDto } from '../transferencias/dto/create-transferencias.dto';
import { WriteStream } from 'fs';
import { CreateRelObrasDto } from '../pp-obras/dto/create-obras.dto';
import { CreateRelTribunalDeContasDto } from '../tribunal-de-contas/dto/create-tribunal-de-contas.dto';
import { CreatePsMonitoramentoMensalFilterDto } from '../ps-monitoramento-mensal/dto/create-ps-monitoramento-mensal-filter.dto';
import { CreateCasaCivilAtividadesPendentesFilterDto } from '../casa-civil-atividades-pendentes/dto/create-casa-civil-atv-pend-filter.dto';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';

@Injectable()
export class UtilsService {
    constructor(private readonly prisma: PrismaService) {}

    async applyFilter(filters: FiltroMetasIniAtividadeDto, getResult: { atividades: boolean; iniciativas: boolean }) {
        const tags = Array.isArray(filters.tags) && filters.tags.length > 0 ? filters.tags : [];

        if (Array.isArray(filters.metas)) filters.metas_ids = filters.metas;

        const metas = await this.prisma.meta.findMany({
            where: {
                pdm: filters.tipo_pdm ? { tipo: filters.tipo_pdm } : undefined,
                pdm_id: filters.pdm_id,
                removido_em: null,
                AND: [
                    { id: filters.meta_id ? filters.meta_id : undefined },
                    { id: filters.metas_ids && filters.metas_ids.length > 0 ? { in: filters.metas_ids } : undefined },
                ],
                meta_tag: tags.length === 0 ? undefined : { some: { tag_id: { in: tags } } },
            },
            select: { id: true },
        });

        // aqui há uma duvida, se devemos buscar as iniciativas q deram match nas metas, ou se pelo filtro
        const iniciativas = getResult.iniciativas
            ? await this.prisma.iniciativa.findMany({
                  where: {
                      meta_id: { in: metas.map((r) => r.id) },
                      removido_em: null,
                      id: filters.meta_id ? filters.meta_id : undefined,
                      iniciativa_tag: tags.length === 0 ? undefined : { some: { tag_id: { in: tags } } },
                  },
                  select: { id: true },
              })
            : [];

        const atividades = getResult.atividades
            ? await this.prisma.atividade.findMany({
                  where: {
                      iniciativa_id: { in: iniciativas.map((r) => r.id) },
                      removido_em: null,
                      id: filters.meta_id ? filters.meta_id : undefined,
                      atividade_tag: tags.length === 0 ? undefined : { some: { tag_id: { in: tags } } },
                  },
                  select: { id: true },
              })
            : [];

        return {
            atividades,
            iniciativas,
            metas,
        };
    }
}

export class FileOutput {
    name: string;
    buffer?: Buffer;
    localFile?: string;
}

export interface ReportContext {
    progress: (progress: number) => Promise<void>;
    cancel: () => void;
    isCancelled: () => boolean;
    getTmpFile: (prefix: string) => { path: string; stream: WriteStream };
}

export interface ReportableService {
    toFileOutput(params: any, ctx: ReportContext, user: PessoaFromJwt | null): Promise<FileOutput[]>;
    asJSON(params: any, user: PessoaFromJwt | null): Promise<any>;
}

export function ParseParametrosDaFonte(fonte: FonteRelatorio, value: any): any {
    let theClass: any = undefined;

    switch (fonte) {
        case 'Orcamento':
            theClass = CreateRelPdmOrcamentoExecutadoDto;
            break;
        case 'ProjetoOrcamento':
        case 'ObrasOrcamento':
        case 'PSOrcamento':
            theClass = CreateRelProjetoOrcamentoDto;
            break;
        case 'Indicadores':
        case 'PSIndicadores':
            theClass = CreateRelIndicadorDto;
            break;
        case 'MonitoramentoMensal':
            theClass = CreateRelMonitoramentoMensalDto;
            break;
        case 'PrevisaoCusto':
            theClass = CreateRelPdmPrevisaoCustoDto;
            break;
        case 'ProjetoPrevisaoCusto':
        case 'ObrasPrevisaoCusto':
        case 'PSPrevisaoCusto':
            theClass = CreateRelProjetoPrevisaoCustoDto;
            break;
        case 'Projeto':
            theClass = CreateRelProjetoDto;
            break;
        case 'Projetos':
            theClass = CreateRelProjetosDto;
            break;
        case 'ProjetoStatus':
            theClass = CreateRelProjetoStatusDto;
            break;
        case 'Parlamentares':
            theClass = CreateRelParlamentaresDto;
            break;
        case 'Transferencias':
            theClass = CreateRelTransferenciasDto;
            break;
        case 'ObraStatus':
            theClass = CreateRelObraStatusDto;
            break;
        case 'Obras':
            theClass = CreateRelObrasDto;
            break;
        case 'TribunalDeContas':
            theClass = CreateRelTribunalDeContasDto;
            break;
        case 'PSMonitoramentoMensal':
            theClass = CreatePsMonitoramentoMensalFilterDto;
            break;
        case 'CasaCivilAtvPendentes':
            theClass = CreateCasaCivilAtividadesPendentesFilterDto;
            break;
        default:
            fonte satisfies never;
    }
    const validatorObject = plainToInstance(theClass, value);

    return validatorObject;
}

export const DefaultCsvOptions = {
    excelStrings: false,
    eol: '\r\n',
    withBOM: false, // dont be evil!
};
