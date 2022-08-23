import { PartialType } from '@nestjs/swagger';
import { CreateOrgaoDto } from './create-orgao.dto';

export class UpdateOrgaoDto extends PartialType(CreateOrgaoDto) {}
