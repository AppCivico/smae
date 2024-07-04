import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateGrupoRespVariavelDto } from './create-grupo-resp-variavel.dto';

export class UpdateGrupoRespVariavelDto extends PartialType(OmitType(CreateGrupoRespVariavelDto, ['orgao_id'])) {}
