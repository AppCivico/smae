import { HttpException, Injectable } from '@nestjs/common';
import { PessoaFromJwt } from '../../../auth/models/PessoaFromJwt';
import { PrismaService } from '../../../prisma/prisma.service';
import { DemandaService } from '../demanda.service';
import { CreateDemandaAcaoDto } from './dto/acao.dto';

@Injectable()
export class DemandaAcaoService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly demandaService: DemandaService
    ) {}

    async create(dto: CreateDemandaAcaoDto, user: PessoaFromJwt) {
        try {
            dto.validaDependencias();
        } catch (error: any) {
            throw new HttpException(error.message, 400);
        }

        // Apenas testa se pode ler, pois a ação será testado abaixo
        const demanda = await this.demandaService.findOne(dto.demanda_id, user, 'ReadOnly');

        if (!dto.podeExecutar(demanda.permissoes)) {
            throw new HttpException(`Não é possível executar ação ${dto.acao} no momento`, 400);
        }

        const transition = dto.fsmState(demanda.status);
        if (!transition)
            throw new HttpException(`Ação ${dto.acao} não pode ser executada no status atual: ${demanda.status}`, 400);

        return this.demandaService.changeStatus(
            dto.demanda_id,
            user,
            transition.from,
            transition.to,
            dto.motivo || null,
            dto.situacao_encerramento
        );
    }
}
