import { Injectable } from '@nestjs/common';
import { CreateOrcamentoExecutadoDto } from './dto/create-orcamento-executado.dto';
import { ListOrcamentoExecutadoDto } from './entities/orcamento-executado.entity';

@Injectable()
export class OrcamentoExecutadoService {
    create(dto: CreateOrcamentoExecutadoDto): Promise<ListOrcamentoExecutadoDto> {
        throw '';
    }

}
