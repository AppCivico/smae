import { TransferenciaTipo } from '@prisma/client';
import { IsString, MaxLength } from 'class-validator';

export class CreateClassificacaoDto {

    @IsString({ message: '$property| Nome: Precisa ser alfanumérico' })
    @MaxLength(250, { message: '$property| Nome: Máximo 250 caracteres' })
    nome: string;
    transferenciaTipo: TransferenciaTipo;

}
