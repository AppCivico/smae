import { HttpException, Injectable } from '@nestjs/common';
import { PessoaAcessoPdm, Prisma } from '@prisma/client';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { CicloAtivoDto } from './metas/dto/mf-meta.dto';
import { PrismaService } from '../prisma/prisma.service';

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

    extraiResponsaveis(
        responsaveis: {
            coordenador_responsavel_cp: boolean,
            orgao: {
                sigla: string | null
            },
            pessoa: {
                nome_exibicao: string
            },
        }[]
    ): {
        orgaos_responsaveis: string[],
        orgaos_participantes: string[],
        responsaveis_na_cp: string[]
    } {
        let orgaos_responsaveis: string[] = [];
        let orgaos_participantes: string[] = [];
        let responsaveis_na_cp: string[] = [];

        for (const r of responsaveis) {
            const sigla = r.orgao.sigla || '';

            if (r.coordenador_responsavel_cp) {
                if (orgaos_responsaveis.includes(sigla) == false) {
                    orgaos_responsaveis.push(sigla)
                }

                if (responsaveis_na_cp.includes(r.pessoa.nome_exibicao) == false) {
                    responsaveis_na_cp.push(r.pessoa.nome_exibicao)
                }
            }

            if (orgaos_participantes.includes(sigla) == false) {
                orgaos_participantes.push(sigla)
            }
        }

        return {
            orgaos_responsaveis,
            orgaos_participantes,
            responsaveis_na_cp,
        }
    }
}
