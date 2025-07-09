import { HttpException, Injectable, Logger } from '@nestjs/common';
import { PessoaAcessoPdm, Prisma } from 'src/generated/prisma/client';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { Date2YMD } from '../common/date2ymd';
import { PrismaService } from '../prisma/prisma.service';
import { CicloAtivoDto, MfPerfilDto } from './metas/dto/mf-meta.dto';
import { sleepFor } from '../common/sleepFor';

const erroSemPerfil = (logger: Logger) => {
    logger.verbose(`nenhum perfil encontrado`);
    return new HttpException(
        'Você não possui um perfil de acesso para monitoramento no momento ou o perfil está sendo modificado. Por favor, tente novamente em alguns segundos.',
        404
    );
};

export type MfPessoaAcessoPdm = PessoaAcessoPdm & { perfil: MfPerfilDto };

@Injectable()
export class MfService {
    private readonly logger = new Logger(MfService.name);

    constructor(private readonly prisma: PrismaService) {}

    async pessoaAcessoPdm(user: PessoaFromJwt): Promise<MfPessoaAcessoPdm> {
        let perfil = await this.prisma.pessoaAcessoPdm.findUnique({ where: { pessoa_id: user.id } });
        if (!perfil) {
            let isValid = await this.prisma.pessoaAcessoPdmValido.findUnique({ where: { pessoa_id: user.id } });
            this.logger.verbose(
                `Perfil não encontrado para usuário ${user.id}, informação é ${isValid ? 'valida' : 'não válida'}`
            );
            if (isValid) throw erroSemPerfil(this.logger);

            const maxAttempts = 4; // tenta calcular 4x, se continuar sem perfil, não difícil ser transação apagando a linha em sequencia
            let attempts: number = maxAttempts;

            while (attempts > 0) {
                this.logger.verbose(`recalcando perfil para ${user.id}, tentativa ${attempts} de ${maxAttempts}...`);
                attempts--;
                try {
                    await this.prisma.$queryRaw`select pessoa_acesso_pdm(${user.id}::int);`;

                    isValid = await this.prisma.pessoaAcessoPdmValido.findUnique({ where: { pessoa_id: user.id } });

                    // se ta valido, carrega o perfil
                    if (isValid) {
                        perfil = await this.prisma.pessoaAcessoPdm.findUnique({ where: { pessoa_id: user.id } });
                        if (perfil) this.logger.verbose(`perfil calculado em ${maxAttempts - attempts} tentativa(s)`);
                    }

                    // se encontrou perfil, para o loop
                    if (isValid && perfil) break;
                } catch (error) {
                    this.logger.error(`Erro durante calculo do perfil: ${error}`);

                    // joga o erro pra cima, pra dar erro 500 e alguém ficar sabendo
                    if (attempts == 0) throw error;
                }

                if (attempts > 0) {
                    const sleepDuration = Math.pow(2, maxAttempts - attempts) * 1000; // Exponential backoff
                    await sleepFor(sleepDuration);
                }
            }

            // se não tem perfil ainda, já esgotou todas as tentativas, da erro
            if (isValid && !perfil) throw erroSemPerfil(this.logger);
        }

        if (!perfil) throw erroSemPerfil(this.logger);

        // apenas pra ter certeza, mas eu acredito que o Prisma já faz isso sozinho
        perfil.cronogramas_etapas = perfil.cronogramas_etapas.map((n) => +n);
        perfil.metas_cronograma = perfil.metas_cronograma.map((n) => +n);
        perfil.metas_variaveis = perfil.metas_variaveis.map((n) => +n);

        // TODO conferir se o ciclo é o mesmo do pdm-ativo, se n for, tem algo ruim

        return {
            ...perfil,
            perfil: perfil.perfil as MfPerfilDto,
        };
    }

    async cicloFisicoAtivo(): Promise<CicloAtivoDto> {
        const cicloAtivo = await this.prisma.cicloFisico.findFirst({
            where: {
                ativo: true,
                pdm: {
                    ativo: true,
                },
            },
            select: {
                id: true,
                data_ciclo: true,
                pdm: { select: { id: true } },
            },
        });
        if (!cicloAtivo) {
            let detail = '';
            const pdmAtivo = await this.prisma.pdm.findFirst({ where: { ativo: true } });
            if (pdmAtivo) {
                const ultimaFase = await this.prisma.cicloFisicoFase.findFirst({
                    where: {
                        ciclo_fisico: { pdm_id: pdmAtivo.id },
                    },
                    orderBy: { data_inicio: 'desc' },
                    take: 1,
                });
                if (ultimaFase) detail += ` Última fase do ciclo acabou em ${Date2YMD.toString(ultimaFase.data_fim)}.`;
            } else {
                detail += ' Não há Programa de Metas ativo no momento.';
            }

            throw new HttpException('Não há ciclo ativo no momento.' + detail, 404);
        }

        return {
            ...cicloAtivo,
            data_ciclo: Date2YMD.toString(cicloAtivo.data_ciclo),
        };
    }

    // foi movido pra cá, pq pode ser que uma ação (risco, fechamento, analise) possa mudar o status
    // mas por enquanto as únicas coisas que mudam os status são as ações dentro dentro da coleta mesmo
    // e quando tiver o cronograma aqui tbm será usado
    async invalidaStatusIndicador(prismaTxn: Prisma.TransactionClient, ciclo_fisico_id: number, meta_id: number) {
        await prismaTxn.statusMetaCicloFisico.deleteMany({
            where: {
                ciclo_fisico_id: ciclo_fisico_id,
                meta_id: meta_id,
            },
        });
    }

    extraiResponsaveis(
        responsaveis: {
            coordenador_responsavel_cp: boolean;
            orgao: {
                sigla: string | null;
            };
            pessoa: {
                nome_exibicao: string;
            };
        }[]
    ): {
        orgaos_responsaveis: string[];
        orgaos_participantes: string[];
        responsaveis_na_cp: string[];
    } {
        const orgaos_responsaveis: string[] = [];
        const orgaos_participantes: string[] = [];
        const responsaveis_na_cp: string[] = [];

        for (const r of responsaveis) {
            const sigla = r.orgao.sigla || '';

            if (r.coordenador_responsavel_cp) {
                if (orgaos_responsaveis.includes(sigla) == false) {
                    orgaos_responsaveis.push(sigla);
                }

                if (responsaveis_na_cp.includes(r.pessoa.nome_exibicao) == false) {
                    responsaveis_na_cp.push(r.pessoa.nome_exibicao);
                }
            }

            if (orgaos_participantes.includes(sigla) == false) {
                orgaos_participantes.push(sigla);
            }
        }

        return {
            orgaos_responsaveis,
            orgaos_participantes,
            responsaveis_na_cp,
        };
    }
}
