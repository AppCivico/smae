import { Injectable } from '@nestjs/common';
import { Date2YMD } from '../../common/date2ymd';
import { PrismaService } from '../../prisma/prisma.service';
import { DefaultCsvOptions, FileOutput, ReportableService } from '../utils/utils.service';
import { CreateRelParlamentaresDto } from './dto/create-parlamentares.dto';
import { ParlamentaresRelatorioDto, RelParlamentaresDto } from './entities/parlamentares.entity';
import { ParlamentarService } from 'src/parlamentar/parlamentar.service';

const {
    Parser,
    transforms: { flatten },
} = require('json2csv');
const defaultTransform = [flatten({ paths: [] })];

@Injectable()
export class ParlamentaresService implements ReportableService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly parlamentarService: ParlamentarService
    ) {}

    async create(dto: CreateRelParlamentaresDto): Promise<ParlamentaresRelatorioDto> {
        const parlamentares = await this.prisma.parlamentar.findMany({
            where: {
                removido_em: null,
                mandatos: {
                    every: {
                        removido_em: null,
                        partido_atual_id: dto.partido_id,
                        cargo: dto.cargo,
                        eleicao: {
                            id: dto.eleicao_id,
                        },
                    },
                },
            },
            select: {
                id: true,
                nascimento: true,
                nome: true,
                nome_popular: true,
                mandatos: {
                    select: {
                        id: true,
                        cargo: true,
                        endereco: true,
                        gabinete: true,
                        telefone: true,
                        email: true,
                        suplencia: true,
                        uf: true,
                        partido_atual: {
                            select: {
                                sigla: true,
                            },
                        },
                        eleicao: {
                            select: {
                                ano: true,
                                tipo: true,
                            },
                        },
                    },
                },
            },
        });

        const parlamentaresOut: RelParlamentaresDto[] = [];
        for (const parlamentar of parlamentares) {
            for (const mandato of parlamentar.mandatos) {
                parlamentaresOut.push({
                    id: parlamentar.id,
                    nome_civil: parlamentar.nome,
                    nome_parlamentar: parlamentar.nome_popular,
                    partido_sigla: mandato.partido_atual.sigla,
                    cargo: mandato.cargo,
                    uf: mandato.uf,
                    titular_suplente: mandato.suplencia ? 'S' : 'T',
                    endereco: mandato.endereco,
                    gabinete: mandato.gabinete,
                    telefone: mandato.telefone,
                    dia_aniversario: parlamentar.nascimento ? parlamentar.nascimento.getDate() : null,
                    mes_aniversario: parlamentar.nascimento ? parlamentar.nascimento.getMonth() : null,
                    email: mandato.email,
                    ano_eleicao: mandato.eleicao.ano,
                });
            }
        }
        return {
            linhas: parlamentaresOut,
        };
    }

    async getFiles(myInput: any, params: any): Promise<FileOutput[]> {
        const dados = myInput as ParlamentaresRelatorioDto;

        const out: FileOutput[] = [];

        if (dados.linhas.length) {
            const json2csvParser = new Parser({
                ...DefaultCsvOptions,
                transforms: defaultTransform,
                fields: [
                    { value: 'id', label: 'ID do Parlamentar' },
                    { value: 'nome_civil', label: 'Nome Civil' },
                    { value: 'nome_parlamentar', label: 'Nome Parlamentar' },
                    { value: 'partido_sigla', label: 'Sigla do Partido' },
                    { value: 'ano_eleicao', label: 'Ano da Eleição' },
                    { value: 'cargo', label: 'Cargo' },
                    { value: 'uf', label: 'UF' },
                    { value: 'titular_suplente', label: 'Titular/Suplente/Efetivado' },
                    { value: 'endereco', label: 'Endereço' },
                    { value: 'gabinete', label: 'Gabinete' },
                    { value: 'telefone', label: 'Telefone' },
                    { value: 'dia_aniversario', label: 'Dia Aniversário' },
                    { value: 'mes_aniversario', label: 'Mês Aniversário' },
                    { value: 'email', label: 'E-mail' },
                ],
            });
            const linhas = json2csvParser.parse(
                dados.linhas.map((r) => {
                    return { ...r };
                })
            );
            out.push({
                name: 'parlamentares.csv',
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
                    'utf8'
                ),
            },
            ...out,
        ];
    }
}
