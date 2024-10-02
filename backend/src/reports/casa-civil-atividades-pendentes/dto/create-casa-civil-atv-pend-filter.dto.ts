import { IsArray, IsString } from 'class-validator';

export class CreateCasaCivilAtividadesPendentesFilter {

    @IsArray({ message: '$property| tipo_transferencia_id: precisa ser uma array.' })
    tipos_transferencias:number[];

    @IsString()
    data_inicio: string;

    @IsString()
    data_termino: string;

    @IsArray({ message: '$property| tipo_transferencia_id: precisa ser uma array.' })
    orgao_id:number[];
}
