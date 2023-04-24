import { Injectable } from '@nestjs/common';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { DashboardItemDto } from './entities/dashboard.entity';

import { sign } from 'jsonwebtoken';

@Injectable()
export class DashboardService {

    constructor(
        private readonly prisma: PrismaService
    ) { }

    async findAll(user: PessoaFromJwt): Promise<DashboardItemDto[]> {

        const liberados: DashboardItemDto[] = [];

        const rows = await this.prisma.metabasePermissao.findMany({
            orderBy: [{ ordem: 'asc' }]
        });

        for (const r of rows) {
            if (!user.hasSomeRoles([r.permissao as any])) continue;

            const config = (r.configuracao && typeof r.configuracao == 'object' ? r.configuracao.valueOf() : false);
            if (config === false) continue;

            const jwt = sign(
                {
                    ...config,
                },
                r.metabase_token,
                { algorithm: 'HS256', expiresIn: 86400, }
            );

            const url = new URL(r.metabase_url);
            url.searchParams.append('token', jwt);


            liberados.push({
                id: r.id,
                titulo: r.titulo,
                url: url.toString(),
            });
        }

        return liberados;
    }

}
