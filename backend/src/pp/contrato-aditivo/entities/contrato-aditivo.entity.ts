import { Decimal } from '@prisma/client/runtime/library';
import { ProjetoTipoAditivoDto } from 'src/tipo-aditivo/dto/tipo-aditivo.dto';
import { IsDateYMD } from '../../../auth/decorators/date.decorator';

export class ContratoAditivoItemDto {
    id: number;
    numero: string;
    tipo: ProjetoTipoAditivoDto;
    @IsDateYMD({ nullable: true })
    data: string | null;
    @IsDateYMD({ nullable: true })
    data_termino_atualizada: string | null;
    valor: Decimal | null;
    percentual_medido: Decimal | null;
}

export class ListContratoAditivoDto {
    linhas: ContratoAditivoItemDto[];
}
