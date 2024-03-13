import { PartialType } from '@nestjs/swagger';
import { CreateTransferenciaTipoDto } from './create-transferencia-tipo.dto';

export class UpdateTransferenciaTipoDto extends PartialType(CreateTransferenciaTipoDto) {}
