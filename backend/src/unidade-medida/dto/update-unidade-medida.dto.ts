import { PartialType } from '@nestjs/swagger';
import { CreateUnidadeMedidaDto } from './create-unidade-medida.dto';

export class UpdateUnidadeMedidaDto extends PartialType(CreateUnidadeMedidaDto) {}
