import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateEquipeDto, CreateMandatoDto, CreateMandatoRepresentatividadeDto, CreateParlamentarDto } from './create-parlamentar.dto';

export class UpdateParlamentarDto extends PartialType(CreateParlamentarDto) {}

export class UpdateEquipeDto extends PartialType(CreateEquipeDto) {}

export class UpdateMandatoDto extends PartialType(OmitType(CreateMandatoDto, ['eleicao_id'])) {}

export class UpdateRepresentatividadeDto extends PartialType(OmitType(CreateMandatoRepresentatividadeDto, ['mandato_id', 'municipio_tipo', 'nivel', 'regiao_id'])) {}