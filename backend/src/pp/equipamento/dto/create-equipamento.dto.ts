import { IsString, MaxLength } from 'class-validator';

export class CreateEquipamentoDto {
    @IsString({ message: '$property| descricao: Precisa ser alfanumérico' })
    @MaxLength(250, { message: '$property| descricao: Máximo 250 caracteres' })
    nome: string;
}
