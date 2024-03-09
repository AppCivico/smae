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
        let parlamentares = await this.parlamentarService.findAll(undefined);

        parlamentares = parlamentares.filter((p) => p.cargo != null);

        if (dto.cargo != undefined) {
            parlamentares = parlamentares.filter((p) => {
                p.cargo == dto.cargo;
            });
        }

        if (dto.partido_id != undefined) {
            parlamentares = parlamentares.filter((p) => {
                p.partido!.id == dto.partido_id;
            });
        }

        const parlamentaresOut: RelParlamentaresDto[] = [];

        for (const parlamentar of parlamentares) {
            const row = await this.parlamentarService.findOne(parlamentar.id, undefined);

            if (!row.mandato_atual) continue;

            parlamentaresOut.push({
                id: row.id,
                nome_civil: row.nome,
                nome_parlamentar: row.nome_popular,
                partido_sigla: row.mandato_atual!.partido_atual.sigla,
                uf: row.mandato_atual.uf,
                titular_suplente: row.mandato_atual.suplencia ? 'S' : 'T',
                endereco: row.mandato_atual.endereco ? row.mandato_atual.endereco : null,
                gabinete: row.mandato_atual.gabinete ? row.mandato_atual.gabinete : null,
                telefone: row.mandato_atual.telefone ? row.mandato_atual.telefone : null,
                nascimento: row.nascimento ? row.nascimento : null,
                email: row.mandato_atual.email ? row.mandato_atual.email : null,
            });
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
