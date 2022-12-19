import { Injectable } from '@nestjs/common';
import { OrcamentoExecutadoParams } from './dto/create-orcamento-executado.dto';
import { ListOrcamentoExecutadoDto } from './entities/orcamento-executado.entity';

@Injectable()
export class OrcamentoExecutadoService {
    create(dto: OrcamentoExecutadoParams): Promise<ListOrcamentoExecutadoDto> {
        console.log(dto);

        throw '';
    }

}
