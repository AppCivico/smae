import { PartialType } from '@nestjs/swagger';
import { CreateGrupoTematicoDto } from './create-grupo-tematico.dto';

export class UpdateGrupoTematicoDto extends PartialType(CreateGrupoTematicoDto) {}
