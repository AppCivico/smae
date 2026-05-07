import { OmitType } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';
import { MAX_LENGTH_DEFAULT } from 'src/common/consts';
import { UpdateDistribuicaoRecursoDto } from './update-distribuicao-recurso.dto';

// Campos que podem ser solicitados via ajuste.
// Para adicionar mais omissões, inclua o nome do campo no array abaixo.
export class DistribuicaoSolicitacaoAjusteCamposDto extends OmitType(UpdateDistribuicaoRecursoDto, [
    'parlamentares',
    'registros_sei',
    'orgao_gestor_id',
    'valor',
    'valor_total',
    'valor_contrapartida',
    'custeio',
    'investimento',
] as const) {}

export class CreateDistribuicaoSolicitacaoAjusteDto extends DistribuicaoSolicitacaoAjusteCamposDto {
    @IsInt()
    @IsPositive()
    distribuicao_recurso_id: number;

    @IsOptional()
    @IsString()
    @MaxLength(MAX_LENGTH_DEFAULT)
    informacoes_complementares?: string;
}
