import { HttpException, Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { MetaOrcamentoService } from 'src/meta-orcamento/meta-orcamento.service';
import { Date2YMD } from '../../common/date2ymd';
import { DotacaoService } from '../../dotacao/dotacao.service';
import { PrismaService } from '../../prisma/prisma.service';

import { DefaultCsvOptions, FileOutput, ReportableService, UtilsService } from '../utils/utils.service';
import { CreateRelPrevisaoCustoDto, PeriodoRelatorioPrevisaoCustoDto } from './dto/create-previsao-custo.dto';
import { ListPrevisaoCustoDto, RelPrevisaoCustoDto } from './entities/previsao-custo.entity';

const {
    Parser,
    transforms: { flatten },
} = require('json2csv');
const defaultTransform = [flatten({ paths: [] })];

@Injectable()
export class PrevisaoCustoService implements ReportableService {
    constructor(private readonly utils: UtilsService, private readonly prisma: PrismaService, private readonly dotacaoService: DotacaoService) {}

    async create(dto: CreateRelPrevisaoCustoDto): Promise<ListPrevisaoCustoDto> {
        let ano: number;

        if (dto.periodo_ano === PeriodoRelatorioPrevisaoCustoDto.Corrente) {
            ano = DateTime.now().year;
        } else {
            if (!dto.ano) throw new HttpException('Ano deve ser enviado', 400);

            ano = dto.ano;
        }

        const metaOrcamentos = await this.prisma.metaOrcamento.findMany({
            where: {
                AND: [{ meta_id: dto?.meta_id }],
                ano_referencia: ano,
                removido_em: null,
            },
            select: {
                id: true,
                criador: { select: { nome_exibicao: true } },
                meta: { select: { id: true, codigo: true, titulo: true } },
                atividade: { select: { id: true, codigo: true, titulo: true } },
                iniciativa: { select: { id: true, codigo: true, titulo: true } },
                versao_anterior_id: true,
                criado_em: true,
                ano_referencia: true,
                custo_previsto: true,
                parte_dotacao: true,
                atualizado_em: true,
            },
            orderBy: [{ meta_id: 'asc' }, { criado_em: 'desc' }],
        });

        const list = metaOrcamentos.map(r => {
            return {
                ...r,
                custo_previsto: r.custo_previsto.toFixed(2),
                projeto_atividade: '',
                parte_dotacao: this.expandirParteDotacao(r.parte_dotacao),
            };
        });
        await this.dotacaoService.setManyProjetoAtividade(list);

        return {
            linhas: list,
        };
    }

    private expandirParteDotacao(parte_dotacao: string): string {
        const partes = parte_dotacao.split('.');
        if ((partes[1] = '*')) partes[1] = '**';
        if ((partes[4] = '*')) partes[4] = '****';
        if ((partes[7] = '*')) partes[7] = '********';
        return partes.join('.');
    }

    async getFiles(myInput: any, pdm_id: number, params: any): Promise<FileOutput[]> {
        const dados = myInput as ListPrevisaoCustoDto;

        const pdm = await this.prisma.pdm.findUniqueOrThrow({ where: { id: pdm_id } });

        const out: FileOutput[] = [];

        const camposMetaIniAtv = [
            { value: 'meta.codigo', label: 'Código da Meta' },
            { value: 'meta.titulo', label: 'Título da Meta' },
            { value: 'meta.id', label: 'ID da Meta' },
            { value: 'iniciativa.codigo', label: 'Código da ' + pdm.rotulo_iniciativa },
            { value: 'iniciativa.titulo', label: 'Título da ' + pdm.rotulo_iniciativa },
            { value: 'iniciativa.id', label: 'ID da ' + pdm.rotulo_iniciativa },
            { value: 'atividade.codigo', label: 'Código da ' + pdm.rotulo_atividade },
            { value: 'atividade.titulo', label: 'Título da ' + pdm.rotulo_atividade },
            { value: 'atividade.id', label: 'ID da ' + pdm.rotulo_atividade },
        ];

        if (dados.linhas.length) {
            const json2csvParser = new Parser({
                ...DefaultCsvOptions,
                transforms: defaultTransform,
                fields: [...camposMetaIniAtv, 'id', 'id_versao_anterior', 'projeto_atividade', 'criado_em', 'ano_referencia', 'custo_previsto', 'parte_dotacao', 'atualizado_em'],
            });
            const linhas = json2csvParser.parse(
                dados.linhas.map(r => {
                    return { ...r };
                }),
            );
            out.push({
                name: 'previsao-custo.csv',
                buffer: Buffer.from(linhas, 'utf8'),
            });
        }

        return [
            {
                name: 'info.json',
                buffer: Buffer.from(
                    JSON.stringify({
                        params: params,
                        horario: Date2YMD.tzSp2UTC(new Date()),
                    }),
                    'utf8',
                ),
            },
            ...out,
        ];
    }
}
