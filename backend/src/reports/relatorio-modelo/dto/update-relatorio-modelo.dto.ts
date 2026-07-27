import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateRelatorioModeloDto } from './create-relatorio-modelo.dto';

/**
 * A `fonte` fica de fora: trocá-la invalidaria a `config` já validada contra o schema da fonte
 * original (e as execuções que apontam para o modelo). Para outra fonte, crie outro modelo.
 */
export class UpdateRelatorioModeloDto extends PartialType(OmitType(CreateRelatorioModeloDto, ['fonte'] as const)) {}
