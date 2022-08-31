import { PartialType } from '@nestjs/swagger';
import { CreateRegiaoDto } from './create-regiao.dto';

export class UpdateRegiaoDto extends PartialType(CreateRegiaoDto) {}
