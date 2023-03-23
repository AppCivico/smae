import { HttpException, Injectable } from '@nestjs/common';

import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjetoSeiDto } from './dto/create-projeto.dto';
import { UpdateProjetoRegistroSeiDto } from './dto/update-projeto.dto';
import { ProjetoDetailDto, ProjetoSeiDto } from './entities/projeto.entity';


@Injectable()
export class ProjetoSeiService {
    constructor(private readonly prisma: PrismaService) { }

    async append_sei(projeto: ProjetoDetailDto, dto: CreateProjetoSeiDto, user: PessoaFromJwt) {

        dto.processo_sei = dto.processo_sei.replace(/[^0-9]/g, '');

        const existenteProjetoSei = await this.prisma.projetoRegistroSei.count({
            where: {
                projeto_id: projeto.id,
                processo_sei: dto.processo_sei,
                removido_em: null,
            }
        });

        if (existenteProjetoSei > 0)
            throw new HttpException(`processo_sei| Já existe um registro do processo SEI ${dto.processo_sei} para este projeto`, 400);

        const projetoSei = await this.prisma.projetoRegistroSei.create({
            data: {
                projeto_id: projeto.id,
                ...dto,
                registro_sei_info: '{}',
                criado_em: new Date(Date.now()),
                criado_por: user.id,
                categoria: 'Manual',
            },
            select: { id: true }
        });

        return { id: projetoSei.id }
    }

    async list_sei(projeto: ProjetoDetailDto, user: PessoaFromJwt): Promise<ProjetoSeiDto[]> {

        const projetosSei = await this.prisma.projetoRegistroSei.findMany({
            where: {
                projeto_id: projeto.id,
                removido_em: null,
            },
            select: {
                id: true,
                categoria: true,
                processo_sei: true,
                descricao: true,
                link: true,
                criador: { select: { id: true, nome_exibicao: true } },
            },
            orderBy: [
                { criado_em: 'desc' }
            ]
        })

        return projetosSei
    }

    async update_sei(projeto: ProjetoDetailDto, seiID: number, dto: UpdateProjetoRegistroSeiDto, user: PessoaFromJwt) {
        if (dto.processo_sei) {
            dto.processo_sei = dto.processo_sei.replace(/[^0-9]/g, '');

            const existenteProjetoSei = await this.prisma.projetoRegistroSei.count({
                where: {
                    projeto_id: projeto.id,
                    processo_sei: dto.processo_sei,
                    removido_em: null,
                    id: {
                        not: seiID
                    }
                }
            });

            if (existenteProjetoSei > 0)
                throw new HttpException(`processo_sei| Já existe um registro do processo SEI ${dto.processo_sei} para este projeto`, 400);
        }

        const self = await this.prisma.projetoRegistroSei.findFirstOrThrow({
            where: {
                projeto_id: projeto.id,
                id: seiID,
                removido_em: null
            }
        });
        if (self.categoria !== 'Manual')
            throw new HttpException(`processo_sei| Processo SEI não pode ser alterado, pois foi criado pelo sistema.`, 400);


        await this.prisma.projetoRegistroSei.updateMany({
            where: {
                projeto_id: projeto.id,
                id: seiID
            },
            data: {
                ...dto,
                atualizado_em: new Date(),
                atualizado_por: user.id,
            }
        });

        return { id: seiID }
    }


    async remove_sei(projeto: ProjetoDetailDto, seiID: number, user: PessoaFromJwt) {
        const self = await this.prisma.projetoRegistroSei.findFirstOrThrow({
            where: {
                projeto_id: projeto.id,
                id: seiID,
                removido_em: null
            }
        });
        if (self.categoria !== 'Manual')
            throw new HttpException(`processo_sei| Processo SEI não pode ser removido, pois foi criado pelo sistema.`, 400);

        await this.prisma.projetoRegistroSei.update({
            where: {
                id: seiID
            },
            data: {
                removido_em: new Date(),
                removido_por: user.id
            }
        });
    }


}
