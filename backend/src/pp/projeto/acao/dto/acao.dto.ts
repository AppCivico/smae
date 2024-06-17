import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt } from 'class-validator';

//nao iniciada -> Registro
//em andamento -> Acompanhamento
//paralisada -> Acompanhamento
//concluída -> Encerramento
export const ProjetoAcao = {
    'arquivar': 'arquivar',
    'restaurar': 'restaurar',
    'selecionar': 'selecionar',
    'iniciar_planejamento': 'iniciar_planejamento',
    'finalizar_planejamento': 'finalizar_planejamento',
    'validar': 'validar',
    'iniciar': 'iniciar',
    'suspender': 'suspender',
    'reiniciar': 'reiniciar',
    'cancelar': 'cancelar',
    'terminar': 'terminar',
    'iniciar_obra': 'iniciar_obra',
    'concluir_obra': 'concluir_obra',
    'paralisar_obra': 'paralisar_obra',
};

export type ProjetoAcao = (typeof ProjetoAcao)[keyof typeof ProjetoAcao];

export class CreateAcaoDto {
    @ApiProperty({ enum: ProjetoAcao, enumName: 'ProjetoAcao' })
    @IsEnum(ProjetoAcao, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(ProjetoAcao).join(', '),
    })
    acao: ProjetoAcao;

    @IsInt()
    @Transform(({ value }: any) => +value)
    projeto_id: number;
}
