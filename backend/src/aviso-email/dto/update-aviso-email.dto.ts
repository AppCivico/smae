import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateAvisoEmailDto } from './create-aviso-email.dto';

export class UpdateAvisoEmailDto extends PartialType(
    OmitType(CreateAvisoEmailDto, ['tarefa_cronograma_id', 'tarefa_id', 'projeto_id', 'transferencia_id'])
) {}
