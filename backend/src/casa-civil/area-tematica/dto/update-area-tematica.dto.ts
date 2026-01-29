import { PartialType } from '@nestjs/swagger';
import { CreateAreaTematicaDto } from './create-area-tematica.dto';

export class UpdateAreaTematicaDto extends PartialType(CreateAreaTematicaDto) {}
