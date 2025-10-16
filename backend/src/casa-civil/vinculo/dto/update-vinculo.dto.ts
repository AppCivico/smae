import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateVinculoDto } from './create-vinculo.dto';

export class UpdateVinculoDto extends PartialType(
    OmitType(CreateVinculoDto, ['meta_id', 'projeto_id', 'campo_vinculo', 'valor_vinculo'])
) {}
