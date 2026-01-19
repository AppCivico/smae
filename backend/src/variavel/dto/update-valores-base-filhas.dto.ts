import { PartialType, PickType } from '@nestjs/swagger';
import { UpdateVariavelDto } from './update-variavel.dto';

export class UpdateVariavelFilhasDto extends PartialType(PickType(UpdateVariavelDto, ['suspendida', 'valor_base'])) {}
