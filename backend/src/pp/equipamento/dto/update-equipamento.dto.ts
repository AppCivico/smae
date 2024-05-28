import { PartialType } from '@nestjs/swagger';
import { CreateEquipamentoDto } from './create-equipamento.dto';

export class UpdateEquipamentoDto extends PartialType(CreateEquipamentoDto) {}
