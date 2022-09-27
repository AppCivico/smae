import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateCronogramaDto } from './create-cronograma.dto';

export class UpdateCronogramaDto extends PartialType(OmitType(CreateCronogramaDto, [
    'iniciativa_id',
    'meta_id',
    'atividade_id'
])) { }
