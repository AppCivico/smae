import { PartialType, PickType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateTarefaDto } from './create-tarefa.dto';

// nem precisa tirar o projeto, pq ele já ta fixo na url
export class UpdateTarefaDto extends PartialType(CreateTarefaDto) {
    /**
     * @example se é uma atualização do realizado, enviar como TRUE
     * (apenas para liberar edição para usuários responsável),
     * quando enviado, vai reduzir os campos que podem ser atualizados
     */
    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    atualizacao_do_realizado?: boolean
}

export class UpdateTarefaRealizadoDto extends PickType(CreateTarefaDto,
    [
        'custo_estimado',
        'custo_real',
        'inicio_real',
        'duracao_real',
        'termino_real',
        'percentual_concluido',
    ] as const
) { }
