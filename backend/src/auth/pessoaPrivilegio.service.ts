import { Injectable } from '@nestjs/common';
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

                PessoaPerfil: {
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
                },
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
}
