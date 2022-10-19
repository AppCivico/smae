import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateCicloFisicoDto } from './create-ciclo-fisico.dto';

export class UpdateCicloFisicoDto extends PartialType(OmitType(CreateCicloFisicoDto, [
    'pdm_id'
])) { }
