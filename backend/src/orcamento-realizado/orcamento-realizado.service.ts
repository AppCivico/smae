import { Injectable } from '@nestjs/common';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { OrcamentoPlanejadoService } from '../orcamento-planejado/orcamento-planejado.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrcamentoRealizadoDto } from './dto/create-orcamento-realizado.dto';

@Injectable()
export class OrcamentoRealizadoService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly orcamentoPlanejado: OrcamentoPlanejadoService,
    ) { }

    async create(dto: CreateOrcamentoRealizadoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const { meta_id, iniciativa_id, atividade_id } = await this.orcamentoPlanejado.validaMetaIniAtv(dto);


        throw 'not implemented'
    }


}
