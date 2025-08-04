import { HttpException, Injectable, Logger } from '@nestjs/common';
import { Prisma, ProjetoStatus } from 'src/generated/prisma/client';
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
            numero: number; // Assume-se validado >= 1 pela validação do DTO
        },
        prismaTx: Prisma.TransactionClient,
        tarefa_cronograma_id: number,
        tarefa_update_id: number | null = null,
        maiorNumero: number | null
    ): Promise<number> {
        // Determina a posição máxima permitida (máximo atual + 1, ou 1 se estiver vazio)
        const maxPossibleTarget = maiorNumero === null ? 1 : maiorNumero + 1;

        // Garante que o número solicitado não ultrapasse o máximo permitido + 1
        // Se o usuário solicitar 10 e o máximo for 5, o alvo se torna 6.
        // Se o usuário solicitar 3 e o máximo for 5, o alvo permanece 3.
        // Se o usuário solicitar 1 e o máximo for null, o alvo se torna 1.
        const numeroAlvo = Math.min(dto.numero, maxPossibleTarget);

        Logger.debug(`Incrementando: solicitado ${dto.numero}, alvo ${numeroAlvo}, máximo atual ${maiorNumero}`);

        // Verifica se a posição alvo calculada já está ocupada por outra tarefa
        const emUso = await prismaTx.tarefa.findFirst({
            where: {
                removido_em: null,
                tarefa_pai_id: dto.tarefa_pai_id,
                tarefa_cronograma_id: tarefa_cronograma_id,
                numero: numeroAlvo,
                // Exclui a própria tarefa sendo atualizada da verificação de colisão
                id: tarefa_update_id ? { not: tarefa_update_id } : undefined,
            },
            select: { id: true }, // Só precisa saber se existe
        });

        // Apenas desloca os números para cima se a posição alvo estiver ocupada
        if (emUso) {
            Logger.debug(
                `Posição ${numeroAlvo} está em uso pela tarefa ${emUso.id}. Deslocando tarefas >= ${numeroAlvo} para cima.`
            );
            await prismaTx.$executeRaw`
                UPDATE tarefa
                SET numero = numero + 1
                WHERE removido_em IS NULL
                  AND tarefa_cronograma_id = ${tarefa_cronograma_id}::int
                  -- IMPORTANTE: Exclui a tarefa sendo atualizada da verificação de colisão
                  AND (${tarefa_update_id === null}::boolean OR id != ${tarefa_update_id})
                  AND (
                    CASE WHEN (${dto.tarefa_pai_id !== null ? 1 : 0}::int = 1::int)
                      THEN tarefa_pai_id = ${dto.tarefa_pai_id}::int
                      ELSE tarefa_pai_id IS NULL
                    END
                  )
                  AND numero >= ${numeroAlvo}::int -- Desloca itens a partir da posição alvo
            `;
        } else {
            Logger.debug(`Posição ${numeroAlvo} está livre.`);
        }

        // Retorna o número alvo calculado, que a função de chamada irá atribuir
        return numeroAlvo;
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
