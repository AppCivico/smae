import { OmitType, PartialType } from '@nestjs/swagger';
import { CreatePortfolioDto } from './create-portfolio.dto';

export class UpdatePortfolioDto extends PartialType(OmitType(CreatePortfolioDto, ['modelo_clonagem'])) {}
