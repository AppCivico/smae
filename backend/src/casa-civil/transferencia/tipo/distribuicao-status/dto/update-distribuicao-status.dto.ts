import { PartialType } from '@nestjs/swagger';
import { CreateDistribuicaoStatusDto } from './create-distribuicao-status.dto';

export class UpdateDistribuicaoStatusDto extends PartialType(CreateDistribuicaoStatusDto) {}
