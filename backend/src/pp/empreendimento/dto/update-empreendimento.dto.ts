import { PartialType } from '@nestjs/swagger';
import { CreateEmpreendimentoDto } from './create-empreendimento.dto';

export class UpdateEmpreendimentoDto extends PartialType(CreateEmpreendimentoDto) {}
