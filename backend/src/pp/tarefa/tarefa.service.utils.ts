import { HttpException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TarefaUtilsService {
    constructor(private readonly prisma: PrismaService) {}

    async decrementaNumero(
        dto: {
            tarefa_pai_id: number | null;
            numero: number;
        },
        prismaTx: Prisma.TransactionClient,
        projetoId: number
    ) {
        const numeroMaximo = await this.maxNumeroNivel(prismaTx, dto);

        // não faz sentido, já que sempre existe pelo menos a própria task que estava sendo removida
        if (numeroMaximo == null) return;

        // se o numero é maior ou igual, ele já era o ultimo nível, então não precisa mexer em nada
        if (dto.numero >= numeroMaximo) return;

        await prismaTx.$executeRaw`update tarefa
            set numero = numero - 1
            where removido_em is null and
            projeto_id = ${projetoId}::int and
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
        projetoId: number
    ): Promise<number> {
        let numero = dto.numero;
        const numeroMaximo = await this.maxNumeroNivel(prismaTx, dto);

        if (numeroMaximo == null) {
            // se não há registros, o nível é o primeiro sempre
            numero = 1;
        } else if (dto.numero <= numeroMaximo) {
            // se há uma tarefa com o número desejado, todas elas serão empurradas para o proximo número
            await prismaTx.$executeRaw`update tarefa
                    set numero = numero + 1
                    where removido_em is null and
                    projeto_id = ${projetoId}::int and
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

    async maxNumeroNivel(
        prismaTx: Prisma.TransactionClient,
        dto: { tarefa_pai_id: number | null }
    ): Promise<number | null> {
        const lookup = await prismaTx.tarefa.aggregate({
            _max: { numero: true },
            where: { removido_em: null, tarefa_pai_id: dto.tarefa_pai_id },
        });
        return lookup._max.numero;
    }

    async lockProjeto(prismaTx: Prisma.TransactionClient, projetoId: number) {
        await prismaTx.$executeRaw`select id from projeto where id = ${projetoId}::int FOR UPDATE`;
    }

    async verifica_nivel_maximo(projetoId: number, nivel: number) {
        const portConfig = await this.prisma.projeto.findFirstOrThrow({
            where: { id: projetoId },
            select: { portfolio: { select: { nivel_maximo_tarefa: true } } },
        });
        if (nivel > portConfig.portfolio.nivel_maximo_tarefa)
            throw new HttpException(
                `Nível da tarefa não pode ser maior que o configurado no portfólio (${portConfig.portfolio.nivel_maximo_tarefa})`,
                400
            );
    }

    async verifica_orgao(orgao_id: number) {
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
