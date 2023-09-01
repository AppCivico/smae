import { PartialType } from '@nestjs/swagger';
import { CreateProjetoAcompanhamentoDto } from './create-acompanhamento.dto';

export class UpdateProjetoAcompanhamentoDto extends PartialType(CreateProjetoAcompanhamentoDto) {}
