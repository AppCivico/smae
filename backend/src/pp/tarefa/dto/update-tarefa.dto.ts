import { PartialType, PickType } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
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
    atualizacao_do_realizado?: boolean;
}

// fica duplicado o nome dos campos, uma é pro swagger
// e outra é pro @Expose funcionar na hora de usar o excludeExtraneousValues
export class UpdateTarefaRealizadoDto extends PickType(CreateTarefaDto, [
    'custo_real',
    'inicio_real',
    'duracao_real',
    'termino_real',
    'percentual_concluido',
] as const) {
    @Expose()
    custo_real: any;
    @Expose()
    inicio_real: any;
    @Expose()
    duracao_real: any;
    @Expose()
    termino_real: any;
    @Expose()
    percentual_concluido: any;
}
