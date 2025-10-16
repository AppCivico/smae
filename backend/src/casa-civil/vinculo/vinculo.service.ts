import { HttpException, Injectable } from '@nestjs/common';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { CreateVinculoDto } from './dto/create-vinculo.dto';
import { UpdateVinculoDto } from './dto/update-vinculo.dto';

@Injectable()
export class VinculoService {
    constructor(private readonly prisma: PrismaService) {}

    async upsert(dto: CreateVinculoDto, user: PessoaFromJwt, id?: number): Promise<RecordWithId> {
        let updateDto: UpdateVinculoDto = {
            tipo_vinculo_id: undefined,
            observacao: undefined,
        } as UpdateVinculoDto;
        if (id) {
            const self = await this.prisma.distribuicaoRecursoVinculo.findFirst({
                where: { id, removido_em: null },
                select: {
                    id: true,
                },
            });
            if (!self) throw new HttpException('Vínculo não encontrado', 404);

            updateDto = dto as UpdateVinculoDto;
        } else {
            // Verificações de criação

            // Precisa ter meta ou projeto.
            if (!dto.meta_id && !dto.projeto_id)
                throw new HttpException('É necessário informar uma meta ou um projeto', 400);

            // Ao mesmo tempo, só pode ter um dos dois.
            if (dto.meta_id && dto.projeto_id)
                throw new HttpException('Só é possível informar uma meta ou um projeto, não ambos', 400);
        }

        const created = await this.prisma.distribuicaoRecursoVinculo.upsert({
            where: { id: id || 0 },
            create: {
                tipo_vinculo_id: dto.tipo_vinculo_id,
                distribuicao_id: dto.distribuicao_id,
                meta_id: dto.meta_id,
                projeto_id: dto.projeto_id,
                campo_vinculo: dto.campo_vinculo,
                valor_vinculo: dto.valor_vinculo,
                observacao: dto.observacao,
                criado_por: user.id,
                criado_em: new Date(Date.now()),
            },
            update: {
                tipo_vinculo_id: updateDto.tipo_vinculo_id,
                observacao: updateDto.observacao,
                atualizado_por: user ? user.id : undefined,
                atualizado_em: new Date(Date.now()),
            },
            select: { id: true },
        });

        return created;
    }
}
