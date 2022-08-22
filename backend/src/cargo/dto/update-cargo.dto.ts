import { PartialType } from '@nestjs/swagger';
import { CreateCargoDto } from './create-cargo.dto';

export class UpdateCargoDto extends PartialType(CreateCargoDto) {}
