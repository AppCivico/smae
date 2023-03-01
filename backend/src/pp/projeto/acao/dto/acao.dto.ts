import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEnum, IsInt } from "class-validator";

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
};

export type ProjetoAcao = (typeof ProjetoAcao)[keyof typeof ProjetoAcao];

export class CreateAcaoDto {
    @ApiProperty({ enum: ProjetoAcao, enumName: 'ProjetoAcao' })
    @IsEnum(ProjetoAcao, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(ProjetoAcao).join(', '),
    })
    acao: ProjetoAcao

    @IsInt()
    @Transform(({ value }: any) => +value)
    projeto_id: number
}
