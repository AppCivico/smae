import { Injectable } from '@nestjs/common';
import { PerfilAcessoPrivilegios } from '../pessoa/dto/perifl-acesso-privilegios.dto';
import { PessoaService } from '../pessoa/pessoa.service';
import { PrismaService } from '../prisma/prisma.service';
import { PessoaFromJwt } from './models/PessoaFromJwt';
import { FilterPrivDto, RetornoListaPrivDto } from './models/Privilegios.dto';

@Injectable()
export class PrivService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly pessoaService: PessoaService
    ) {}

    async listaPerfilAcesso(user: PessoaFromJwt): Promise<PerfilAcessoPrivilegios[]> {
        return await this.pessoaService.listaPerfilAcessoParaPessoas(user);
    }

    async listaPrivilegios(filter: FilterPrivDto): Promise<RetornoListaPrivDto> {
        const listPriv = await this.prisma.privilegio.findMany({
            where: {
                modulo: filter.sistemas
                    ? {
                          modulo_sistema: { hasSome: filter.sistemas },
                      }
                    : undefined,
            },
            select: {
                codigo: true,
                nome: true,
                modulo_id: true,
            },
        });

        const listMod = await this.prisma.privilegioModulo.findMany({
            where: {
                modulo_sistema: filter.sistemas ? { hasSome: filter.sistemas } : undefined,
            },
            select: {
                codigo: true,
                modulo_sistema: true,
                descricao: true,
                id: true,
            },
        });

        return {
            linhas: listPriv,
            modulos: listMod.flatMap((mod) =>
                mod.modulo_sistema.map((modulo) => ({
                    id: mod.id,
                    codigo: mod.codigo,
                    descricao: mod.descricao,
                    modulo_sistema: modulo,
                }))
            ),
        };
    }
}
