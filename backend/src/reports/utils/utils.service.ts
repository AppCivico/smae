import { Injectable } from '@nestjs/common';
import { FonteRelatorio } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRelIndicadorDto } from '../indicadores/dto/create-indicadore.dto';
import { CreateOrcamentoExecutadoDto } from '../orcamento/dto/create-orcamento-executado.dto';
import { FiltroMetasIniAtividadeDto } from '../relatorios/dto/filtros.dto';

@Injectable()
export class UtilsService {

    constructor(
        private readonly prisma: PrismaService,
    ) { }

    async applyFilter(filters: FiltroMetasIniAtividadeDto, getResult: { atividades: boolean, iniciativas: boolean }) {

        const tags = Array.isArray(filters.tags) && filters.tags.length > 0 ? filters.tags : [];

        const metas = await this.prisma.meta.findMany({
            where: {
                pdm_id: filters.pdm_id,
                removido_em: null,
                id: filters.meta_id ? filters.meta_id : undefined,
                meta_tag: tags.length === 0 ? undefined : { some: { tag_id: { in: tags } } }
            },
            select: { id: true }
        });

        // aqui há uma duvida, se devemos buscar as iniciativas q deram match nas metas, ou se pelo filtro
        const iniciativas = getResult.iniciativas ? await this.prisma.meta.findMany({
            where: {
                pdm_id: filters.pdm_id,
                removido_em: null,
                id: filters.meta_id ? filters.meta_id : undefined,
                meta_tag: tags.length === 0 ? undefined : { some: { tag_id: { in: tags } } }
            },
            select: { id: true }
        }) : [];

        const atividades = getResult.atividades ? await this.prisma.meta.findMany({
            where: {
                pdm_id: filters.pdm_id,
                removido_em: null,
                id: filters.meta_id ? filters.meta_id : undefined,
                meta_tag: tags.length === 0 ? undefined : { some: { tag_id: { in: tags } } }
            },
            select: { id: true }
        }) : [];

        return {
            atividades,
            iniciativas,
            metas
        }
    }
}

export class FileOutput {
    name: string
    buffer: Buffer
}

export interface ReportableService {
    getFiles(output: any, pdm_id: number, params: any): Promise<FileOutput[]>
    create(params: any): Promise<any>
}

export function ParseParametrosDaFonte(fonte: FonteRelatorio, value: any): any {
    let theClass: any = undefined;

    switch (fonte) {
        case 'Orcamento': theClass = CreateOrcamentoExecutadoDto; break;
        case 'IndicadoresAnual': theClass = CreateRelIndicadorDto; break;
        case 'IndicadoresSemestral': theClass = CreateRelIndicadorDto; break;
        default:
            return false;
    }
    const validatorObject = plainToInstance(theClass, value);

    return validatorObject;
}

export const DefaultCsvOptions = {
    excelStrings: false,
    eol: "\r\n",
    withBOM: false,// dont be evil!
}