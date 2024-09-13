import { BadRequestException, Injectable } from '@nestjs/common';
import { DateYMD } from '../common/date2ymd';
import { PrismaService } from '../prisma/prisma.service';

export type VariavelFiltroDataType = {
    data_inicio?: Date;
    data_fim?: Date;
    data_valor?: Date;
};

@Injectable()
export class VariavelUtilService {
    constructor(private readonly prisma: PrismaService) {}

    async gerarPeriodoVariavelEntreDatas(
        variavelId: number,
        indicadorId: number | null,
        filtros?: VariavelFiltroDataType
    ): Promise<DateYMD[]> {
        if (isNaN(variavelId)) throw new BadRequestException('Variável inválida');

        const dados: Record<string, string>[] = await this.prisma.$queryRawUnsafe(`
            select to_char(p.p, 'yyyy-mm-dd') as dt
            from busca_periodos_variavel(${variavelId}::int ${indicadorId ? `, ${indicadorId}::int` : ''}) as g(p, inicio, fim),
            generate_series(inicio, fim, p) p
            where true
            ${filtros && filtros.data_inicio ? `and p.p >= '${filtros.data_inicio.toISOString()}'::date` : ''}
            ${filtros && filtros.data_fim ? `and p.p <= '${filtros.data_fim.toISOString()}'::date` : ''}
            ${filtros && filtros.data_valor ? `and p.p = '${filtros.data_valor.toISOString()}'::date` : ''}
        `);

        return dados.map((e) => e.dt);
    }
}
