import { OmitType, PartialType } from '@nestjs/swagger';
import { CreatePainelExternoDto } from './create-painel-externo.dto';

export class UpdatePainelExternoDto extends PartialType(OmitType(CreatePainelExternoDto, [])) {}
