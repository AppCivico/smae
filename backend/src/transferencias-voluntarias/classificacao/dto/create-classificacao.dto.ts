import { IsString, MaxLength } from 'class-validator';

export class CreateClassificacaoDto {

    @IsString({ message: '$property| Nome: Precisa ser alfanumérico' })
    @MaxLength(250, { message: '$property| Nome: Máximo 250 caracteres' })
    nome: string;
    transferencia_tipo_id: number;

}
