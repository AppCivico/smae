import { PartialType } from '@nestjs/swagger';
import { CreateBancadaDto } from './create-bancada.dto';

export class UpdateBancadaDto extends PartialType(CreateBancadaDto) {}
