import { Injectable } from '@nestjs/common';
import { Date2YMD } from '../../common/date2ymd';
import { ProjetoService } from '../../pp/projeto/projeto.service';
import { PrismaService } from '../../prisma/prisma.service';

import { DefaultCsvOptions, FileOutput, ReportableService } from '../utils/utils.service';
import { CreateRelProjetoDto } from './dto/create-previsao-custo.dto';
import { PPProjetoRelatorioDto } from './entities/previsao-custo.entity';

const {
    Parser,
    transforms: { flatten },
} = require('json2csv');
const defaultTransform = [flatten({ paths: [] })];

@Injectable()
export class PPProjetoService implements ReportableService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly projetoService: ProjetoService,

    ) { }

    async create(dto: CreateRelProjetoDto): Promise<PPProjetoRelatorioDto> {
        const detail = await this.projetoService.findOne(dto.projeto_id, undefined, false);

        return {
            detail: detail
        };
    }


    async getFiles(myInput: any, pdm_id: number, params: any): Promise<FileOutput[]> {
        const dados = myInput as PPProjetoRelatorioDto;

        const out: FileOutput[] = [];


        const json2csvParser = new Parser({
            ...DefaultCsvOptions,
            transforms: defaultTransform,
        });
        const linhas = json2csvParser.parse([dados.detail]);
        out.push({
            name: 'detalhes-do-projeto.csv',
            buffer: Buffer.from(linhas, 'utf8'),
        });

        const uploads = await this.prisma.projetoDocumento.findMany({
            where: {
                removido_em: null,
                projeto_id: dados.detail.id,
            },
            include: {
                arquivo: {
                    select: { id: true, nome_original: true, caminho: true, descricao: true }
                },
                criador: {
                    select: { id: true, nome_exibicao: true }
                }
            },
            orderBy: { criado_em: 'asc' }
        });

        if (uploads.length) {
            const json2csvParser = new Parser({
                ...DefaultCsvOptions,
                transforms: defaultTransform,
                fields: [
                    { value: 'arquivo.nome_original', label: 'Nome Original' },
                    {
                        label: 'Criado em',
                        value: (r: typeof uploads[0]) => {
                            return r.criado_em.toISOString();
                        },
                    },
                    { value: 'criador.id', label: 'Criador (ID)' },
                    { value: 'criador.nome_exibicao', label: 'Criador (Nome de Exibição)' },
                    { value: 'arquivo.caminho', label: 'Caminho no Object Storage' },
                    { value: 'arquivo.descricao', label: 'descricao do Arquivo' },
                    { value: 'arquivo.id', label: 'ID do arquivo', },

                ],
            });

            const linhas = json2csvParser.parse(uploads);
            out.push({
                name: 'arquivos.csv',
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
                        uploads: uploads,
                    }),
                    'utf8',
                ),
            },
            ...out,
        ];
    }
}
