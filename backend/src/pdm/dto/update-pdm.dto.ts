import { PartialType } from '@nestjs/swagger';
import { CreatePdmDto } from './create-pdm.dto';

export class UpdatePdmDto extends PartialType(CreatePdmDto) {}
