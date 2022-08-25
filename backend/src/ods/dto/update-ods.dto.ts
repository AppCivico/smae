import { PartialType } from '@nestjs/swagger';
import { CreateOdsDto } from './create-ods.dto';

export class UpdateOdsDto extends PartialType(CreateOdsDto) {}
