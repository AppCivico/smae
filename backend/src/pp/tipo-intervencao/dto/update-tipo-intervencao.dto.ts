import { PartialType } from '@nestjs/swagger';
import { CreateTipoIntervencaoDto } from './create-tipo-intervencao.dto';

export class UpdateTipoIntervencaoDto extends PartialType(CreateTipoIntervencaoDto) {}
