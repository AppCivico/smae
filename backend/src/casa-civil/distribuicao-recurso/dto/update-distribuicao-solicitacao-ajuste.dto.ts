import { IsOptional, IsString, MaxLength } from 'class-validator';
import { MAX_LENGTH_DEFAULT } from 'src/common/consts';
import { DistribuicaoSolicitacaoAjusteCamposDto } from './create-distribuicao-solicitacao-ajuste.dto';

export class UpdateDistribuicaoSolicitacaoAjusteDto extends DistribuicaoSolicitacaoAjusteCamposDto {
    @IsOptional()
    @IsString()
    @MaxLength(MAX_LENGTH_DEFAULT)
    informacoes_complementares?: string;
}
