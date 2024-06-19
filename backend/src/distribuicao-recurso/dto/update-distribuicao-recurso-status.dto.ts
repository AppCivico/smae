import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateDistribuicaoRecursoStatusDto } from './create-distribuicao-recurso-status.dto';

export class UpdateDistribuicaoRecursoStatusDto extends PartialType(
    OmitType(CreateDistribuicaoRecursoStatusDto, ['status_id', 'status_base_id'])
) {}
