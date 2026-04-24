import { OmitType } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';
import { UpdateDistribuicaoRecursoDto } from './update-distribuicao-recurso.dto';

// Campos que podem ser solicitados via ajuste.
// Para adicionar mais omissões, inclua o nome do campo no array abaixo.
export class DistribuicaoSolicitacaoAjusteCamposDto extends OmitType(UpdateDistribuicaoRecursoDto, [
    'justificativa_aditamento',
    'parlamentares',
    'registros_sei',
    'orgao_gestor_id',
] as const) {}

export class CreateDistribuicaoSolicitacaoAjusteDto extends DistribuicaoSolicitacaoAjusteCamposDto {
    @IsInt()
    @IsPositive()
    distribuicao_recurso_id: number;
}
