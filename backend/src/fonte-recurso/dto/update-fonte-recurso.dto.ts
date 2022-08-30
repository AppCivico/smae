import { PartialType } from '@nestjs/swagger';
import { CreateFonteRecursoDto } from './create-fonte-recurso.dto';

export class UpdateFonteRecursoDto extends PartialType(CreateFonteRecursoDto) {}
