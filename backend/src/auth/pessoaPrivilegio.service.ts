import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ListaDePrivilegios } from '../common/ListaDePrivilegios';
import { PrismaService } from '../prisma/prisma.service';

type PessoaOrgaoDto = {
    pessoa_id: number;
    orgao_id: number;
};

@Injectable()
export class PessoaPrivilegioService {
    constructor(private readonly prisma: PrismaService) {}

    async pessoasComPriv(privileges: ListaDePrivilegios[], pessoaIds: number[]): Promise<PessoaOrgaoDto[]> {
        const results = await this.prisma.pessoa.findMany({
            where: {
                id: {
                    in: pessoaIds,
                },
                desativado: false,
                NOT: { pessoa_fisica_id: null },

                PessoaPerfil: privileges.length
                    ? {
                          some: {
                              perfil_acesso: {
                                  perfil_privilegio: {
                                      some: {
                                          privilegio: {
                                              codigo: {
                                                  in: privileges,
                                              },
                                          },
                                      },
                                  },
                              },
                          },
                      }
                    : undefined,
            },
            select: {
                id: true,
                pessoa_fisica: {
                    select: {
                        orgao_id: true,
                    },
                },
            },
            distinct: ['id'],
        });

        return results.map((result) => ({
            pessoa_id: result.id,
            orgao_id: result.pessoa_fisica!.orgao_id,
        }));
    }

    async adicionaPerfilAcesso(pessoaId: number, perfil: string, prismaTx: Prisma.TransactionClient): Promise<void> {
        const perfilAcesso = await prismaTx.perfilAcesso.findFirst({
            where: {
                nome: perfil,
                removido_em: null,
            },
        });
        if (!perfilAcesso) {
            throw new InternalServerErrorException({
                error: `Perfil de acesso não encontrado: ${perfil}, para adicionar em pessoa-id ${pessoaId}`,
                stack: new Error().stack,
            });
        }

        await prismaTx.pessoaPerfil.create({
            data: {
                pessoa_id: pessoaId,
                perfil_acesso_id: perfilAcesso.id,
            },
        });
    }
}
