import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateProjetoEtapaDto } from './create-projeto-etapa.dto';

export class UpdateProjetoEtapaDto extends OmitType(PartialType(CreateProjetoEtapaDto), []) {}
