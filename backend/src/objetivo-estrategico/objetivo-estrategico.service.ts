import { Injectable, Logger } from '@nestjs/common';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateObjetivoEstrategicoDto } from './dto/create-objetivo-estrategico.dto';
import { UpdateObjetivoEstrategicoDto } from './dto/update-objetivo-estrategico.dto';

@Injectable()
export class ObjetivoEstrategicoService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createObjetivoEstrategicoDto: CreateObjetivoEstrategicoDto, user: PessoaFromJwt) {

        const created = await this.prisma.objetivoEstrategico.create({
            data: {
                criado_por: user.id,
                criado_em: new Date(Date.now()),
                ...createObjetivoEstrategicoDto,
            },
            select: { id: true, descricao: true }
        });

        return created;
    }

    async findAll() {
        let listActive = await this.prisma.objetivoEstrategico.findMany({
            where: {
                removido_em: null,
            },
            select: {
                id: true,
                descricao: true,
                pdm_id: true,
            }
        });
        return listActive;
    }

    async update(id: number, updateObjetivoEstrategicoDto: UpdateObjetivoEstrategicoDto, user: PessoaFromJwt) {

        delete updateObjetivoEstrategicoDto.pdm_id; // nao deixa editar o PDM
        await this.prisma.objetivoEstrategico.update({
            where: { id: id },
            data: {
                atualizado_por: user.id,
                atualizado_em: new Date(Date.now()),
                ...updateObjetivoEstrategicoDto,
            }
        });

        return { id };
    }

    async remove(id: number, user: PessoaFromJwt) {
        const created = await this.prisma.objetivoEstrategico.updateMany({
            where: { id: id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            }
        });

        return created;
    }
}
