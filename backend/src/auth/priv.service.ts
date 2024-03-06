import { Injectable } from '@nestjs/common';
import { PerfilAcessoPrivilegios } from '../pessoa/dto/perifl-acesso-privilegios.dto';
import { PessoaService } from '../pessoa/pessoa.service';
import { PrismaService } from '../prisma/prisma.service';
import { FilterPrivDto, RetornoListaPrivDto } from './models/Privilegios.dto';
import { PessoaFromJwt } from './models/PessoaFromJwt';

@Injectable()
export class PrivService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly pessoaService: PessoaService
    ) {}

    async listaPerfilAcesso(filter: FilterPrivDto, user: PessoaFromJwt): Promise<PerfilAcessoPrivilegios[]> {
        return await this.pessoaService.listaPerfilAcessoParaPessoas(filter, user);
    }

    async listaPrivilegios(filter: FilterPrivDto): Promise<RetornoListaPrivDto> {
        const listPriv = await this.prisma.privilegio.findMany({
            where: {
                modulo: filter.sistemas
                    ? {
                          modulo_sistema: { in: filter.sistemas },
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
                modulo_sistema: filter.sistemas ? { in: filter.sistemas } : undefined,
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
            modulos: listMod,
        };
    }
}
