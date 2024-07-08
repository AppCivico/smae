import { Decimal } from '@prisma/client/runtime/library';
import { ProjetoTipoAditivoDto } from 'src/tipo-aditivo/dto/tipo-aditivo.dto';

export class ContratoAditivoItemDto {
    id: number;
    numero: number;
    tipo: ProjetoTipoAditivoDto;
    data: Date;
    data_termino_atualizada: Date | null;
    valor: Decimal;
    percentual_medido: Decimal;
}

export class ListContratoAditivoDto {
    linhas: ContratoAditivoItemDto[];
}
