import { PartialType } from '@nestjs/swagger';
import { CreateTipoOrgaoDto } from './create-tipo-orgao.dto';

export class UpdateTipoOrgaoDto extends PartialType(CreateTipoOrgaoDto) {}
