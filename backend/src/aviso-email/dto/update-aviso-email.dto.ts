import { PartialType } from '@nestjs/swagger';
import { CreateAvisoEmailDto } from './create-aviso-email.dto';

export class UpdateAvisoEmailDto extends PartialType(CreateAvisoEmailDto) {}
