import { HttpException, Injectable, Logger } from '@nestjs/common';
import { Date2YMD } from 'src/common/date2ymd';
import { PrismaService } from 'src/prisma/prisma.service';
import { FileOutput, ReportableService, UtilsService } from '../utils/utils.service';
import { CreateRelIndicadorDto } from './dto/create-indicadore.dto';
import { ListIndicadoresDto } from './entities/indicadores.entity';


class RetornoDb {
    data: string
    valor: string | null
    serie: string

    indicador_id: number
    indicador_codigo: string
    indicador_titulo: string
    meta_id: number | null
    iniciativa_id: number | null
    atividade_id: number | null

}

@Injectable()
export class IndicadoresService implements ReportableService {
    private readonly logger = new Logger(IndicadoresService.name);
    constructor(
        private readonly prisma: PrismaService,
        private readonly utils: UtilsService,
    ) { }

    async create(dto: CreateRelIndicadorDto): Promise<ListIndicadoresDto> {
        if (dto.periodo == 'Semestral' && !dto.semestre) {
            throw new HttpException('Necessário enviar semestre para o periodo Semestral', 400);
        }

        const { metas, iniciativas, atividades } = await this.utils.applyFilter(dto, { iniciativas: true, atividades: true });

        const indicadores = await this.prisma.indicador.findMany({
            where: {
                removido_em: null,
                'OR': [
                    { meta_id: { 'in': metas.map(r => r.id) } },
                    { iniciativa_id: { 'in': iniciativas.map(r => r.id) } },
                    { atividade_id: { 'in': atividades.map(r => r.id) } },
                ]
            },
            select: { id: true }
        });

        console.log(indicadores);

        let sql = `SELECT
        i.id as indicador_id,
        i.codigo as indicador_codigo,
        i.titulo as indicador_titulo,
        i.meta_id,
        i.iniciativa_id,
        i.atividade_id,
        :DATA: as "data",
        series.serie,
        round(
            valor_indicador_em(
                i.id,
                series.serie,
                dt.dt::date,
                :JANELA:
            ),
            i.casas_decimais
        )::text as valor
        from generate_series($1::date, $2::date, $3::interval) dt
        cross join (select 'Realizado'::"Serie" as serie ) series
        join indicador i ON i.id IN (${indicadores.map(r => r.id).join(',')})
        `;

        if (dto.periodo == 'Anual' && dto.tipo == 'Analitico') {
            const data: RetornoDb[] = await this.prisma.$queryRawUnsafe(
                sql.replace(':JANELA:', "extract('month' from periodicidade_intervalo(i.periodicidade))::int")
                    .replace(':DATA:', "dt.dt::date::text"),
                dto.ano + '-01-01',
                (dto.ano + 1) + '-01-01',
                '1 month'
            );

            console.log(data);
        } else if (dto.periodo == 'Anual' && dto.tipo == 'Consolidado') {

            const data: RetornoDb[] = await this.prisma.$queryRawUnsafe(
                sql.replace(':JANELA:', "12")
                    .replace(':DATA:', "dt.dt::date::text"),
                (dto.ano) + '-12-01',
                (dto.ano + 1) + '-12-01',
                '1 year'
            );

            console.log(data);
        } else if (dto.periodo == 'Semestral' && dto.tipo == 'Consolidado') {

            const base_ano = dto.semestre == 'Primeiro' ? dto.ano : dto.ano - 1;
            const base_mes = dto.semestre == 'Primeiro' ? base_ano + '-06-01' : base_ano + '-12-01';

            const base_data: RetornoDb[] = await this.prisma.$queryRawUnsafe(
                sql.replace(':JANELA:', "6")
                    .replace(':DATA:', "(dt.dt::date - '5 months'::interval)::date::text || '/' || (dt.dt::date)"),
                base_mes,
                base_mes,
                '1 decade'
            );

            const complemento_ano = dto.semestre == 'Primeiro' ? dto.ano : dto.ano + 1;
            const complemento_mes = dto.semestre == 'Primeiro' ? complemento_ano + '-12-01' : complemento_ano + '-06-01';

            const complemento_data: RetornoDb[] = await this.prisma.$queryRawUnsafe(
                sql.replace(':JANELA:', "6")
                    .replace(':DATA:', "(dt.dt::date - '5 months'::interval)::date::text || '/' || (dt.dt::date)"),
                complemento_mes,
                complemento_mes,
                '1 decade'
            );

            console.log([...base_data, ...complemento_data]);
        }else if (dto.periodo == 'Semestral' && dto.tipo == 'Analitico') {


        }

        throw 'not implemented';
    }

    async getFiles(myInput: any, pdm_id: number, params: any): Promise<FileOutput[]> {
        const dados = myInput as ListIndicadoresDto;
        const pdm = await this.prisma.pdm.findUniqueOrThrow({ where: { id: pdm_id } });
        const out: FileOutput[] = [];


        return [
            {
                name: 'info.json',
                buffer: Buffer.from(JSON.stringify({
                    params: params,
                    "horario": Date2YMD.tzSp2UTC(new Date())
                }), "utf8")
            },

        ]
    }
}
