import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { Date2YMD } from '../common/date2ymd';
import { PrismaService } from '../prisma/prisma.service';
import { ListSeriesAgrupadas } from './dto/list-variavel.dto';
import { FilterPeriodoFormulaCompostaDto, PeriodoFormulaCompostaDto } from './dto/variavel.formula-composta.dto';
import { SerieValorNomimal } from './entities/variavel.entity';
import { ORDEM_SERIES_RETORNO, VariavelService } from './variavel.service';

@Injectable()
export class VariavelFormulaCompostaService {
    private readonly logger = new Logger(VariavelFormulaCompostaService.name);
    constructor(
        private readonly variavelService: VariavelService,
        private readonly prisma: PrismaService
    ) {}

    async getFormulaCompostaPeriodos(formula_composta_id: number): Promise<PeriodoFormulaCompostaDto[]> {
        const { formula_composta, variaveis } = await this.buscaVariaveisDaFormulaComposta(formula_composta_id);

        console.log(formula_composta);

        const dados: Record<string, string>[] = await this.prisma.$queryRaw`select to_char(p.p, 'yyyy-mm-dd') as dt,
                cast(count(distinct n.variavel_id) as int) as variaveis
        from (SELECT unnest(${variaveis}::int[]) AS variavel_id) n
        cross join busca_periodos_variavel(n.variavel_id) as g(p, inicio, fim) ,
        generate_series(inicio, fim, p) p
        group by 1`;

        return plainToInstance(PeriodoFormulaCompostaDto, dados);
    }

    private async buscaVariaveisDaFormulaComposta(formula_composta_id: number) {
        const formula_composta = await this.prisma.formulaComposta.findFirst({
            where: { removido_em: null, id: formula_composta_id },
            select: { id: true, titulo: true },
        });
        if (!formula_composta) throw new BadRequestException('Formula composta não encontrada');

        const fc_variaveis = await this.prisma.formulaCompostaVariavel.groupBy({
            by: ['variavel_id'],
            where: {
                formula_composta_id: formula_composta_id,
            },
        });

        const variaveis = fc_variaveis.map((r) => r.variavel_id);
        return { formula_composta, variaveis };
    }
    async getFormulaCompostaSeries(
        formula_composta_id: number,
        filter: FilterPeriodoFormulaCompostaDto
    ): Promise<ListSeriesAgrupadas> {
        // TODO: Implementar verificação de permissão, não deve ser retornado o token de acesso
        // para os usuários que não possuem permissão de escrita na variável (quem não está na meta e etc)
        // talvez invertendo a lógica, verificar se o usuário tem permissão na hora da escrita
        // e não na hora da leitura ajude a simplificar o código
        const { formula_composta, variaveis } = await this.buscaVariaveisDaFormulaComposta(formula_composta_id);

        const result: ListSeriesAgrupadas = {
            linhas: [],
            formula_composta: { id: formula_composta.id, titulo: formula_composta.titulo },
            ordem_series: ORDEM_SERIES_RETORNO,
        };

        const periodoYMD = Date2YMD.toString(filter.periodo);

        const listaVariaveis = await this.prisma.variavel.findMany({
            where: { id: { in: variaveis }, removido_em: null },
            select: {
                id: true,
                acumulativa: true,
                casas_decimais: true,
                periodicidade: true,
                codigo: true,
                titulo: true,
                suspendida_em: true,
            },
        });

        const promises = variaveis.map(async (variavelId) => {
            const variavel = listaVariaveis.filter((r) => r.id == variavelId)[0];
            if (!variavel) return;

            const valoresExistentes = await this.variavelService.getValorSerieExistente(
                variavelId,
                ORDEM_SERIES_RETORNO,
                filter.periodo
            );
            const porPeriodo = this.variavelService.getValorSerieExistentePorPeriodo(valoresExistentes, variavelId);
            const seriesExistentes: SerieValorNomimal[] = this.variavelService.populaSeriesExistentes(
                porPeriodo,
                periodoYMD,
                variavelId,
                variavel
            );

            result.linhas.push({
                periodo: periodoYMD.substring(0, 4 + 2 + 1),
                agrupador: periodoYMD.substring(0, 4),
                series: seriesExistentes,
                variavel: {
                    ...{ ...variavel, suspendida_em: undefined },
                    suspendida: variavel.suspendida_em ? true : false,
                },
            });
        });

        await Promise.all(promises);

        result.linhas.sort((a, b) => {
            if (a.variavel && b.variavel) {
                return a.variavel.titulo.localeCompare(b.variavel.titulo);
            }
            return a.periodo.localeCompare(b.periodo);
        });

        return result;
    }
}
