import { BadRequestException, Injectable } from '@nestjs/common';
import { DateYMD } from '../common/date2ymd';
import { PrismaService } from '../prisma/prisma.service';
import { FilterPeriodoDto } from './entities/variavel.entity';

@Injectable()
export class VariavelUtilService {
    constructor(private readonly prisma: PrismaService) {}

    async gerarPeriodoVariavelEntreDatas(
        variavelId: number,
        indicadorId: number | null,
        filtros?: FilterPeriodoDto
    ): Promise<DateYMD[]> {
        if (isNaN(variavelId)) throw new BadRequestException('Variável inválida');

        let unsafeCicloCorrente = '';
        if (filtros?.ate_ciclo_corrente) {
            const data = await this.ultimoMesComAtraso(variavelId);
            unsafeCicloCorrente = `and p.p < ( '${data.toISOString()}'::date )`;
        }

        const dados: Record<string, string>[] = await this.prisma.$queryRawUnsafe(`
            select to_char(p.p, 'yyyy-mm-dd') as dt
            from busca_periodos_variavel(${variavelId}::int ${indicadorId ? `, ${indicadorId}::int` : ''}) as g(p, inicio, fim),
            generate_series(inicio, fim, p) p
            where true
            ${filtros && filtros.data_inicio ? `and p.p >= '${filtros.data_inicio.toISOString()}'::date` : ''}
            ${filtros && filtros.data_fim ? `and p.p <= '${filtros.data_fim.toISOString()}'::date` : ''}
            ${filtros && filtros.data_valor ? `and p.p = '${filtros.data_valor.toISOString()}'::date` : ''}
            ${unsafeCicloCorrente}
        `);

        return dados.map((e) => e.dt);
    }

    async ultimoMesComAtraso(variavel_id: number) {
        const r: { data: Date }[] = await this.prisma.$queryRaw`
            select
                date_trunc('month', now() at time zone  'America/Sao_Paulo')::date
                    +
                ((v.atraso_meses * -1)) as data
            from variavel v
            where v.id = ${variavel_id}`;
        return r[0].data;
    }

    async ultimoPeriodoValido(variavel_id: number) {
        const r: { ultimo_periodo_valido: Date }[] = await this.prisma.$queryRaw`
            select ultimo_periodo_valido(v.periodicidade, v.atraso_meses, v.inicio_medicao) as ultimo_periodo_valido
            from variavel v
            where v.id = ${variavel_id} and v.inicio_medicao is not null
            `;
        if (r.length === 0)
            throw new BadRequestException(
                'Opção de ate_ciclo_corrente apenas para variáveis com data de início de medição'
            );
        return r[0].ultimo_periodo_valido;
    }
}
