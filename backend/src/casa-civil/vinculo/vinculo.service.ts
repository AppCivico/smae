import { HttpException, Injectable } from '@nestjs/common';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { CreateVinculoDto } from './dto/create-vinculo.dto';
import { UpdateVinculoDto } from './dto/update-vinculo.dto';
import { CampoVinculo } from '@prisma/client';

@Injectable()
export class VinculoService {
    constructor(private readonly prisma: PrismaService) {}

    async upsert(dto: CreateVinculoDto | UpdateVinculoDto, user: PessoaFromJwt, id?: number): Promise<RecordWithId> {
        if (id) {
            const self = await this.prisma.distribuicaoRecursoVinculo.findFirst({
                where: { id, removido_em: null },
                select: { id: true },
            });
            if (!self) throw new HttpException('Vínculo não encontrado', 404);
        } else {
            // Verificações de criação
            const createDto = dto as CreateVinculoDto;

            // Precisa ter meta ou projeto.
            if (!createDto.meta_id && !createDto.projeto_id)
                throw new HttpException('É necessário informar uma meta ou um projeto', 400);

            // Ao mesmo tempo, só pode ter um dos dois.
            if (createDto.meta_id && createDto.projeto_id)
                throw new HttpException('Só é possível informar uma meta ou um projeto, não ambos', 400);
        }

        const created = await this.prisma.distribuicaoRecursoVinculo.upsert({
            where: { id: id || 0 },
            create: {
                // Estes placeholders nunca serão utilizados, mas o Prisma obriga a definir valores para os campos (no caso de update, mesmo que aqui seja create)
                // Isso ocorre pois o DTO de update não tem todos os campos obrigatórios do create.
                // Mas como no DTO de criação, estes campos são obrigatórios, eles sempre estarão presentes.
                tipo_vinculo_id: (dto as CreateVinculoDto).tipo_vinculo_id ?? 0,
                distribuicao_id: (dto as CreateVinculoDto).distribuicao_id ?? 0,
                meta_id: (dto as CreateVinculoDto).meta_id ?? undefined,
                projeto_id: (dto as CreateVinculoDto).projeto_id ?? undefined,
                campo_vinculo: (dto as CreateVinculoDto).campo_vinculo ?? CampoVinculo.Endereco,
                valor_vinculo: (dto as CreateVinculoDto).valor_vinculo ?? '',
                observacao: (dto as CreateVinculoDto).observacao,
                criado_por: user.id,
                criado_em: new Date(Date.now()),
            },
            update: {
                tipo_vinculo_id: (dto as UpdateVinculoDto).tipo_vinculo_id,
                observacao: (dto as UpdateVinculoDto).observacao,
                atualizado_por: user.id,
                atualizado_em: new Date(Date.now()),
            },
            select: { id: true },
        });

        return created;
    }
}
