import { HttpException, Injectable } from '@nestjs/common';
import { PessoaAcessoPdm, Prisma } from '@prisma/client';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { CicloAtivoDto } from 'src/mf/metas/dto/mf-meta.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MfService {

    constructor(private readonly prisma: PrismaService) { }

    async pessoaAcessoPdm(user: PessoaFromJwt): Promise<PessoaAcessoPdm> {
        const perfil = await this.prisma.pessoaAcessoPdm.findUnique({ where: { pessoa_id: user.id } });
        if (!perfil)
            throw new HttpException('Faltando pessoaAcessoPdm', 404)

        // apenas pra ter certeza, mas eu acredito que o Prisma já faz isso sozinho
        perfil.cronogramas_etapas = perfil.cronogramas_etapas.map(n => +n);
        perfil.metas_cronograma = perfil.metas_cronograma.map(n => +n);
        perfil.metas_variaveis = perfil.metas_variaveis.map(n => +n);

        // TODO conferir se o ciclo é o mesmo do pdm-ativo, se n for, tem algo ruim

        return perfil;
    }

    async cicloFisicoAtivo(): Promise<CicloAtivoDto> {
        const cicloAtivo = await this.prisma.cicloFisico.findFirst({
            where: {
                ativo: true,
                pdm: {
                    ativo: true
                }
            },
            select: {
                id: true,
                data_ciclo: true,
                pdm: { select: { id: true } }
            }
        });
        if (!cicloAtivo)
            throw new HttpException('Faltando ciclo ativo', 404)

        return cicloAtivo;
    }

    // foi movido pra cá, pq pode ser que uma ação (risco, fechamento, analise) possa mudar o status
    // mas por enquanto as únicas coisas que mudam os status são as ações dentro dentro da coleta mesmo
    // e quando tiver o cronograma aqui tbm será usado
    async invalidaStatusIndicador(prismaTxn: Prisma.TransactionClient, ciclo_fisico_id: number, meta_id: number) {
        await prismaTxn.statusMetaCicloFisico.deleteMany({
            where: {
                ciclo_fisico_id: ciclo_fisico_id,
                meta_id: meta_id,
            }
        });
    }

}
