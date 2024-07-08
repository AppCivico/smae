import { Decimal } from '@prisma/client/runtime/library';
import { ProjetoTipoAditivoDto } from 'src/tipo-aditivo/dto/tipo-aditivo.dto';

export class ContratoAditivoItemDto {
    id: number;
    numero: number;
    tipo: ProjetoTipoAditivoDto;
    data: Date | null;
    data_termino_atualizada: Date | null;
    valor: Decimal | null;
    percentual_medido: Decimal | null;
}

export class ListContratoAditivoDto {
    linhas: ContratoAditivoItemDto[];
}
