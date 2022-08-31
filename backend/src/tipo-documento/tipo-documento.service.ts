import { Injectable, Logger } from '@nestjs/common';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTipoDocumentoDto } from './dto/create-tipo-documento.dto';
import { UpdateTipoDocumentoDto } from './dto/update-tipo-documento.dto';

@Injectable()
export class TipoDocumentoService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createTipoDocumentoDto: CreateTipoDocumentoDto, user: PessoaFromJwt) {

        const created = await this.prisma.tipoDocumento.create({
            data: {
                criado_por: user.id,
                criado_em: new Date(Date.now()),
                ...createTipoDocumentoDto,
            },
            select: { id: true }
        });

        return created;
    }

    async findAll() {
        let listActive = await this.prisma.tipoDocumento.findMany({
            where: {
                removido_em: null,
            },
            select: {
                id: true,
                descricao: true,
                extensoes: true,
                titulo: true,
                codigo: true,
            }
        });
        return listActive;
    }

    async update(id: number, updateTipoDocumentoDto: UpdateTipoDocumentoDto, user: PessoaFromJwt) {

        await this.prisma.tipoDocumento.update({
            where: { id: id },
            data: {
                atualizado_por: user.id,
                atualizado_em: new Date(Date.now()),
                ...updateTipoDocumentoDto,
            },
        });

        return { id };
    }

    async remove(id: number, user: PessoaFromJwt) {
        const created = await this.prisma.tipoDocumento.updateMany({
            where: { id: id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            }
        });

        return created;
    }
}
