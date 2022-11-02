import { HttpException, Injectable } from '@nestjs/common';
import { PessoaAcessoPdm } from '@prisma/client';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { CicloAtivoDto } from 'src/mf/metas/dto/mf-meta.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MfService {

    constructor(private readonly prisma: PrismaService) { }

    async pessoaAcessoPdm(user: PessoaFromJwt) : Promise<PessoaAcessoPdm>{
        const perfil = await this.prisma.pessoaAcessoPdm.findUnique({ where: { pessoa_id: user.id } });
        if (!perfil)
            throw new HttpException('Faltando pessoaAcessoPdm', 404)


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



}
