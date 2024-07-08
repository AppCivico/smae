import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateContratoAditivoDto } from './create-contrato-aditivo.dto';

export class UpdateContratoAditivoDto extends PartialType(OmitType(CreateContratoAditivoDto, [])) {}
