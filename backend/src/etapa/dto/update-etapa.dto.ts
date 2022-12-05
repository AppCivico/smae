import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateEtapaDto } from './create-etapa.dto';

export class UpdateEtapaDto extends PartialType(OmitType(CreateEtapaDto, [
    'etapa_pai_id',
    'ordem'
])) {

}
