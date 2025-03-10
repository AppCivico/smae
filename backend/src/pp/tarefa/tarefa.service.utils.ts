import { HttpException, Injectable } from '@nestjs/common';
import { Prisma, ProjetoStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TarefaUtilsService {
    constructor(private readonly prisma: PrismaService) {}

    async recalcNivel(prismaTx: Prisma.TransactionClient, tarefa_cronograma_id: number) {
        // depois de mover os parents, as tarefas filhas ficam os os níveis errados
        // essa função ajusta os de todos os filhos do cronograma de acordo com o parent_id
        await prismaTx.$queryRaw`SELECT f_tarefa_recalc_nivel(${tarefa_cronograma_id}::int)::text`;
    }

    async decrementaNumero(
        dto: {
            id: number;
            tarefa_pai_id: number | null;
            numero: number;
        },
        prismaTx: Prisma.TransactionClient,
        tarefa_cronograma_id: number,
        maiorNumero: number | null
    ) {
        if (maiorNumero == null || dto.numero >= maiorNumero) return; // já está no final

        await prismaTx.$executeRaw`
            UPDATE tarefa
            SET numero = numero - 1
            WHERE removido_em IS NULL
              AND tarefa_cronograma_id = ${tarefa_cronograma_id}::int
              AND id != ${dto.id}
              AND (
                CASE WHEN (${dto.tarefa_pai_id !== null ? 1 : 0}::int = 1::int)
                     THEN tarefa_pai_id = ${dto.tarefa_pai_id}::int
                     ELSE tarefa_pai_id IS NULL
                END
              )
              AND numero >= ${dto.numero}::int
        `;
    }

    async incrementaNumero(
        dto: {
            tarefa_pai_id: number | null;
            numero: number;
        },
        prismaTx: Prisma.TransactionClient,
        tarefa_cronograma_id: number,
        tarefa_update_id: number | null = null,
        maiorNumero: number | null
    ): Promise<number> {
        // se não tem nenhuma tarefa, o numero é 1
        if (maiorNumero == null) {
            return 1;
        }

        // não deixa passar do máximo, nunca!
        const novoNumero = Math.min(dto.numero, maiorNumero);
        console.log(`Incrementing: requested ${dto.numero}, assigned ${novoNumero}`);

        const emUso = await prismaTx.tarefa.findFirst({
            where: {
                removido_em: null,
                tarefa_pai_id: dto.tarefa_pai_id,
                tarefa_cronograma_id: tarefa_cronograma_id,
                numero: novoNumero,
                id: tarefa_update_id ? { not: tarefa_update_id } : undefined,
            },
        });

        // Só numera se houver conflito
        if (emUso) {
            await prismaTx.$executeRaw`
              UPDATE tarefa
              SET numero = numero + 1
              WHERE removido_em IS NULL
                AND tarefa_cronograma_id = ${tarefa_cronograma_id}::int
                AND id != ${tarefa_update_id}
                AND (
                  CASE WHEN (${dto.tarefa_pai_id !== null ? 1 : 0}::int = 1::int)
                    THEN tarefa_pai_id = ${dto.tarefa_pai_id}::int
                    ELSE tarefa_pai_id IS NULL
                  END
                )
                AND numero >= ${novoNumero}::int
            `;
        }

        return novoNumero;
    }

    async maiorNumeroDoNivel(
        prismaTx: Prisma.TransactionClient,
        tarefa_pai_id: number | null,
        tarefa_cronograma_id: number
    ): Promise<number | null> {
        const lookup = await prismaTx.tarefa.aggregate({
            _max: { numero: true },
            where: {
                removido_em: null,
                tarefa_pai_id: tarefa_pai_id,
                tarefa_cronograma_id: tarefa_cronograma_id,
            },
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
