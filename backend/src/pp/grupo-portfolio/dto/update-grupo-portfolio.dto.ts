import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateGrupoPortfolioDto } from './create-grupo-portfolio.dto';

export class UpdateGrupoPortfolioDto extends PartialType(OmitType(CreateGrupoPortfolioDto, ['orgao_id'])) {}
