import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateRegiaoDto } from './create-regiao.dto';

export class UpdateRegiaoDto extends OmitType(PartialType(CreateRegiaoDto), ['nivel'] as const) {}
