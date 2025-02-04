import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateGrupoPainelExternoDto } from './create-grupo-externo.dto';

export class UpdateGrupoPainelExternoDto extends PartialType(OmitType(CreateGrupoPainelExternoDto, [])) {}
