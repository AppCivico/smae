import { HttpException, Injectable } from '@nestjs/common';
import { Prisma, ProjetoStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TarefaUtilsService {
    constructor(private readonly prisma: PrismaService) {}

    async recalcNivel(prismaTx: Prisma.TransactionClient, crongorama_id: number) {
        // depois de mover os parents, as tarefas filhas ficam os os níveis errados
        // essa função ajusta os de todos os filhos do cronograma de acordo com o parent_id
        await prismaTx.$queryRaw`SELECT f_tarefa_recalc_nivel(${crongorama_id}::int)::text`;
    }

    async decrementaNumero(
        dto: {
            tarefa_pai_id: number | null;
            numero: number;
        },
        prismaTx: Prisma.TransactionClient,
        tarefa_cronograma_id: number
    ) {
        const maiorNumero = await this.maiorNumeroDoNivel(prismaTx, dto);

        // não faz sentido, já que sempre existe pelo menos a própria task que estava sendo removida
        if (maiorNumero == null) return;

        // se o numero é maior ou igual, ele já era o ultimo nível, então não precisa mexer em nada
        if (dto.numero >= maiorNumero) return;

        await prismaTx.$executeRaw`update tarefa
            set numero = numero - 1
            where removido_em is null and
            tarefa_cronograma_id = ${tarefa_cronograma_id}::int and
            (CASE WHEN (${dto.tarefa_pai_id !== null ? 1 : 0}::int = 1::int)
                THEN tarefa_pai_id = ${dto.tarefa_pai_id}::int
                ELSE tarefa_pai_id IS NULL
            END) AND
            numero >= ${dto.numero}::int
        `;
    }

    async incrementaNumero(
        dto: {
            tarefa_pai_id: number | null;
            numero: number;
        },
        prismaTx: Prisma.TransactionClient,
        tarefa_cronograma_id: number
    ): Promise<number> {
        let numero = dto.numero;
        const numeroMaximo = await this.maiorNumeroDoNivel(prismaTx, dto);

        if (numeroMaximo == null) {
            // se não há registros, o nível é o primeiro sempre
            numero = 1;
        } else if (dto.numero <= numeroMaximo) {
            // se há uma tarefa com o número desejado, todas elas serão empurradas para o proximo número
            await prismaTx.$executeRaw`update tarefa
                    set numero = numero + 1
                    where removido_em is null and
                    tarefa_cronograma_id = ${tarefa_cronograma_id}::int and
                    (CASE WHEN (${dto.tarefa_pai_id !== null ? 1 : 0}::int = 1::int)
                        THEN tarefa_pai_id = ${dto.tarefa_pai_id}::int
                        ELSE tarefa_pai_id IS NULL
                    END) AND
                    numero >= ${dto.numero}::int
                `;
        } else {
            // por padrão, é o nível maior + 1
            numero = numeroMaximo + 1;
        }
        return numero;
    }

    private async maiorNumeroDoNivel(
        prismaTx: Prisma.TransactionClient,
        dto: { tarefa_pai_id: number | null }
    ): Promise<number | null> {
        const lookup = await prismaTx.tarefa.aggregate({
            _max: { numero: true },
            where: { removido_em: null, tarefa_pai_id: dto.tarefa_pai_id },
        });
        return lookup._max.numero;
    }

    async lockTarefaCrono(prismaTx: Prisma.TransactionClient, tarefa_cronograma_id: number) {
        await prismaTx.$executeRaw`select id from tarefa_cronograma where id = ${tarefa_cronograma_id}::int FOR UPDATE`;
    }

    async verifica_nivel_maximo_portfolio(projetoId: number, nivel: number) {
        const portConfig = await this.prisma.projeto.findFirstOrThrow({
            where: { id: projetoId },
            select: { status: true, portfolio: { select: { nivel_maximo_tarefa: true } } },
        });

        // Agora o cronograma sempre será liberado para uso. No entanto, se for projeto, e o projeto estiver em Registro.
        // Deve ser limitado ao nível 1.
        if (portConfig.status == ProjetoStatus.Registrado && nivel > 1)
            throw new HttpException(
                'Projeto está no status de Registrado, portanto só pode criar tarefas de nível 1.',
                400
            );

        if (nivel > portConfig.portfolio.nivel_maximo_tarefa)
            throw new HttpException(
                `Nível da tarefa não pode ser maior que o configurado no portfólio (${portConfig.portfolio.nivel_maximo_tarefa})`,
                400
            );
    }

    async verifica_orgao_existe(orgao_id: number) {
        const count = await this.prisma.orgao.count({
            where: { id: orgao_id, removido_em: null },
        });
        if (count == 0) throw new HttpException(`Órgão não foi encontrado.`, 400);
    }

    tarefaDependenteTipoSigla(tipo: string): string {
        let ret = '';

        switch (tipo) {
            case 'inicia_pro_inicio':
                ret = 'II';
                break;
            case 'inicia_pro_termino':
                ret = 'IT';
                break;
            case 'termina_pro_inicio':
                ret = 'TI';
                break;
            case 'termina_pro_termino':
                ret = 'TT';
        }

        return ret;
    }
}
