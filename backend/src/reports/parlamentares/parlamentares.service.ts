import { Injectable } from '@nestjs/common';
import { Date2YMD } from '../../common/date2ymd';
import { PrismaService } from '../../prisma/prisma.service';
import { DefaultCsvOptions, FileOutput, ReportContext, ReportableService } from '../utils/utils.service';
import { CreateRelParlamentaresDto } from './dto/create-parlamentares.dto';
import { ParlamentaresRelatorioDto, RelParlamentaresDto } from './entities/parlamentares.entity';
import { ParlamentarService } from 'src/parlamentar/parlamentar.service';
import { Prisma } from '@prisma/client';

import { StreamParser } from '@json2csv/plainjs';
import { flatten } from '@json2csv/transforms';
import { createWriteStream } from 'fs';
import { resolve } from 'path';

const defaultTransform = flatten({});

@Injectable()
export class ParlamentaresService implements ReportableService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly parlamentarService: ParlamentarService
    ) {}

    async asJSON(dto: CreateRelParlamentaresDto): Promise<ParlamentaresRelatorioDto> {
        this.ajustaParams(dto);

        // a base tende a ser grande, então aqui provavelmente tbm seria bom ter o streaming
        const parlamentaresOut: RelParlamentaresDto[] = await this.buscaParlamentar(dto);

        return {
            linhas: parlamentaresOut,
        };
    }

    private async buscaParlamentar(
        dto: CreateRelParlamentaresDto,
        prismaCtx?: PrismaService | Prisma.TransactionClient
    ): Promise<RelParlamentaresDto[]> {
        const prismaTx = prismaCtx || this.prisma;

        const parlamentares = await prismaTx.view_parlamentares_mandatos_part_atual.findMany({
            where: {
                eleicao_id: dto.eleicao_id,
                partido_atual_id: dto.partido_id,
                cargo: dto.cargo,
            },
            orderBy: {
                id: 'asc',
            },
        });

        const parlamentaresOut: RelParlamentaresDto[] = [];
        for (const r of parlamentares) {
            parlamentaresOut.push({
                id: r.id,
                nome_civil: r.nome_civil,
                nome_parlamentar: r.nome_parlamentar,
                partido_sigla: r.partido_sigla,
                cargo: r.cargo,
                uf: r.uf,
                titular_suplente: r.titular_suplente,
                endereco: r.endereco,
                gabinete: r.gabinete,
                telefone: r.telefone,
                dia_aniversario: r.dia_aniversario,
                mes_aniversario: r.mes_aniversario,
                email: r.email,
                ano_eleicao: r.ano_eleicao,
            });
        }
        return parlamentaresOut;
    }

    private ajustaParams(dto: CreateRelParlamentaresDto) {
        if (dto.cargo === null) dto.cargo = undefined;
        if (dto.partido_id == 0) dto.partido_id = undefined;
        if (dto.eleicao_id == 0) dto.eleicao_id = undefined;
    }

    async toFileOutput(params: CreateRelParlamentaresDto, ctx: ReportContext): Promise<FileOutput[]> {
        this.ajustaParams(params);

        // a base tende a ser grande, então aqui provavelmente tbm seria bom ter o streaming
        // ai usa o tx+cursor pra paginar sobre o set todo
        const linhas: RelParlamentaresDto[] = await this.buscaParlamentar(params);
        await ctx.progress(50);

        const out: FileOutput[] = [];

        if (linhas.length) {
            const csvFilePath = resolve('/tmp', 'parlamentares.csv');
            const fileStream = createWriteStream(csvFilePath); // Create a writable file stream

            const json2csvParser = new StreamParser({
                transforms: [defaultTransform],
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
                ...DefaultCsvOptions,
            });

            json2csvParser.onHeader = (header) => console.log(header);
            json2csvParser.onLine = (line) => console.log(line);

            await new Promise<void>((resolve, reject) => {
                try {
                    // Listen to data and end events
                    json2csvParser.onData = (chunk: string) => {
                        // Write each chunk to the file stream
                        fileStream.write(chunk);
                    };

                    json2csvParser.onEnd = () => {
                        // Close the file stream after all data is written
                        fileStream.end(() => {
                            resolve();
                            console.log('CSV file written successfully!');
                        });
                    };

                    json2csvParser.onError = (err: any) => {
                        // Handle errors
                        console.error('Error writing CSV:', err);
                        // Consider rejecting the promise or other error handling
                    };
                    json2csvParser.write('[');
                    // Start writing data to the parser
                    linhas.forEach((item) => {
                        console.log(item);
                        json2csvParser.write(JSON.stringify(item));
                        // if it's not the last item, write a comma
                        if (linhas.indexOf(item) !== linhas.length - 1) {
                            json2csvParser.write(',');
                        }
                    });
                    json2csvParser.write(']');
                    json2csvParser.end(); // Signal the end of the data
                } catch (error) {
                    reject(error);
                }
            });
            out.push({
                name: 'parlamentares.csv',
                localFile: csvFilePath, // Return the path to the tmp file
            });
        }
        await ctx.progress(99);

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
