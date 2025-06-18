import { Injectable } from '@nestjs/common';
import { FonteRelatorio, ParlamentarCargo, TipoRelatorio } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { MetasGetPermissionSet } from '../../meta/meta.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCasaCivilAtividadesPendentesFilterDto } from '../casa-civil-atividades-pendentes/dto/create-casa-civil-atv-pend-filter.dto';
import { CreateRelIndicadorDto } from '../indicadores/dto/create-indicadores.dto';
import { CreateRelMonitoramentoMensalDto } from '../monitoramento-mensal/dto/create-monitoramento-mensal.dto';
import { PdmCreateOrcamentoExecutadoDto as CreateRelPdmOrcamentoExecutadoDto } from '../orcamento/dto/create-orcamento-executado.dto';
import { CreateRelParlamentaresDto } from '../parlamentares/dto/create-parlamentares.dto';
import { CreateRelObrasDto } from '../pp-obras/dto/create-obras.dto';
import { CreateRelProjetoDto } from '../pp-projeto/dto/create-previsao-custo.dto';
import { CreateRelProjetosDto } from '../pp-projetos/dto/create-projetos.dto';
import { CreateRelObraStatusDto, CreateRelProjetoStatusDto } from '../pp-status/dto/create-projeto-status.dto';
import { CreateRelPrevisaoCustoDto as CreateRelPdmPrevisaoCustoDto } from '../previsao-custo/dto/create-previsao-custo.dto';
import { CreateRelProjetoOrcamentoDto } from '../projeto-orcamento/dto/create-projeto-orcamento.dto';
import { CreateRelProjetoPrevisaoCustoDto } from '../projeto-previsao-custo/dto/create-projeto-previsao-custo.dto';
import { CreatePsMonitoramentoMensalFilterDto } from '../ps-monitoramento-mensal/dto/create-ps-monitoramento-mensal-filter.dto';
import { FiltroMetasIniAtividadeDto } from '../relatorios/dto/filtros.dto';
import { CreateRelTransferenciasDto } from '../transferencias/dto/create-transferencias.dto';
import { CreateRelTribunalDeContasDto } from '../tribunal-de-contas/dto/create-tribunal-de-contas.dto';
import { ReportContext } from '../relatorios/helpers/reports.contexto';

@Injectable()
export class UtilsService {
    constructor(private readonly prisma: PrismaService) {}

    async applyFilter(
        filters: FiltroMetasIniAtividadeDto,
        getResult: { atividades: boolean; iniciativas: boolean },
        user: PessoaFromJwt | null
    ) {
        const tags = Array.isArray(filters.tags) && filters.tags.length > 0 ? filters.tags : [];

        if (Array.isArray(filters.metas)) filters.metas_ids = filters.metas;

        let whereSet: Awaited<ReturnType<typeof MetasGetPermissionSet>> | undefined = undefined;
        if (user) {
            const sistema = user.modulo_sistema[0];
            if (!sistema) throw new Error('Usuário sem sistema');

            whereSet = await MetasGetPermissionSet(
                filters?.tipo_pdm == 'PS' ? '_PS' : sistema == 'PDM' ? '_PDM' : 'PDM_AS_PS',
                user,
                this.prisma
            );
        }

        const metas = await this.prisma.meta.findMany({
            where: {
                pdm: filters.tipo_pdm ? { tipo: filters.tipo_pdm } : undefined,
                pdm_id: filters.pdm_id,
                removido_em: null,
                AND: [
                    { id: filters.meta_id ? filters.meta_id : undefined },
                    { id: filters.metas_ids && filters.metas_ids.length > 0 ? { in: filters.metas_ids } : undefined },
                    { AND: whereSet ? whereSet : {} },
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

export interface ReportableService {
    toFileOutput(params: any, ctx: ReportContext, user: PessoaFromJwt | null): Promise<FileOutput[]>;
    asJSON(params: any, user: PessoaFromJwt | null): Promise<any>;
}

export function ParseParametrosDaFonte(fonte: FonteRelatorio, value: any): any {
    let theClass: any = undefined;

    switch (fonte) {
        case 'ProjetoOrcamento':
        case 'ObrasOrcamento':
            theClass = CreateRelProjetoOrcamentoDto;
            break;
        case 'Orcamento':
        case 'PSOrcamento':
            theClass = CreateRelPdmOrcamentoExecutadoDto;
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
            console.log('CreateRelProjetosDto');
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
        case 'AtvPendentes':
            theClass = CreateCasaCivilAtividadesPendentesFilterDto;
            break;
        default:
            fonte satisfies never;
    }
    const validatorObject = plainToInstance(theClass, value, {
        enableCircularCheck: false,
        enableImplicitConversion: false,
        excludeExtraneousValues: true,
        excludePrefixes: undefined,
        exposeDefaultValues: false,
        exposeUnsetFields: true,
        groups: undefined,
        ignoreDecorators: false,
        strategy: undefined,
        targetMaps: undefined,
        version: undefined,
    });

    return validatorObject;
}

export const DefaultCsvOptions = {
    excelStrings: false,
    eol: '\r\n',
    withBOM: false, // dont be evil!
};

export function EnumHumano(enumType: typeof ParlamentarCargo | typeof TipoRelatorio, value: string): string {
    const normalizedValue = value.trim();

    if (enumType === ParlamentarCargo) {
        if (normalizedValue === 'DeputadoFederal') return 'Deputado Federal';
        if (normalizedValue === 'DeputadoEstadual') return 'Deputado Estadual';
    }

    if (enumType === TipoRelatorio) {
        if (normalizedValue === 'Analitico') return 'Analítico';
    }

    return normalizedValue;
}
