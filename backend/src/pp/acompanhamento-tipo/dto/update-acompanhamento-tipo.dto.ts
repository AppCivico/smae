import { PartialType } from '@nestjs/swagger';
import { CreateTipoAcompanhamentoDto } from './create-acompanhamento-tipo.dto';

export class UpdateAcompanhamentoTipoDto extends PartialType(CreateTipoAcompanhamentoDto) {}
