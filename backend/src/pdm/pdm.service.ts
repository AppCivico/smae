import { HttpException, Injectable, Logger } from '@nestjs/common';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePdmDto } from './dto/create-pdm.dto';
import { UpdatePdmDto } from './dto/update-pdm.dto';

@Injectable()
export class PdmService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createPdmDto: CreatePdmDto, user: PessoaFromJwt) {
        const created = await this.prisma.pdm.create({
            data: {
                criado_por: user.id,
                criado_em: new Date(Date.now()),
                ...createPdmDto,
            },
            select: { id: true }
        });

        return created;
    }

    async findAll() {
        const listActive = await this.prisma.pdm.findMany({
            select: {
                id: true,
                nome: true,
                descricao: true,
                ativo: true,
                data_inicio: true,
                data_fim: true,
                equipe_tecnica: true,
            }
        });

        /*
         conversar com o erico se ele realmente precisa receber de volta em yyyy-mm-dd
        const nListActive = listActive.map((r: any) => {
            r.data_fim = r.data_fim.toISOString().substring(0, 10)
            return r
        });
        return nListActive;
        */
        return listActive;
    }

    async getDetail(id: number, user: PessoaFromJwt) {
        let pdm = await this.prisma.pdm.findFirst({
            where: {
                id: id
            }
        });
        if (!pdm) throw new HttpException('PDM não encontrado', 404)

        return pdm;
    }

    async update(id: number, updatePdmDto: UpdatePdmDto, user: PessoaFromJwt) {

        const created = await this.prisma.pdm.update({
            where: { id: id },
            data: {
                atualizado_por: user.id,
                atualizado_em: new Date(Date.now()),
                ...updatePdmDto,
            },
            select: { id: true }
        });

        return created;
    }


}
