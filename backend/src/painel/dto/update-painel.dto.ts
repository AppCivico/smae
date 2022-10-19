import { OmitType, PartialType } from '@nestjs/swagger';
import { CreatePainelDto } from './create-painel.dto';

export class UpdatePainelDto extends PartialType(OmitType(CreatePainelDto, [
])) { }
