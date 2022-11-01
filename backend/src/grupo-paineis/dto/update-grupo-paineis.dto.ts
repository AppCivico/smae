import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateGrupoPaineisDto } from './create-grupo-paineis.dto';

export class UpdateGrupoPaineisDto extends PartialType(OmitType(CreateGrupoPaineisDto, [])) { }
