import { MaxLength } from 'class-validator';
import { IsDateYMD } from '../../auth/decorators/date.decorator';

export class TarefaCronogramaDto {
    id: number;
    @IsDateYMD({ nullable: true })
    previsao_inicio: string | null;
    previsao_custo: number | null;
    previsao_duracao: number | null;
    @IsDateYMD({ nullable: true })
    previsao_termino: string | null;
    atraso: number | null;
    em_atraso: boolean;
    @IsDateYMD({ nullable: true })
    projecao_termino: string | null;
    realizado_duracao: number | null;
    percentual_concluido: number | null;
    @IsDateYMD({ nullable: true })
    realizado_inicio: string | null;
    @IsDateYMD({ nullable: true })
    realizado_termino: string | null;
    realizado_custo: number | null;
    tolerancia_atraso: number | null;
    percentual_atraso: number | null;

    @MaxLength(255, { message: 'O campo "Status Cronograma" deve ter no máximo 255 caracteres' })
    status_cronograma: string | null;

    nivel_maximo_tarefa?: number;
}
