import { IsString, MaxLength } from 'class-validator';

export class CreateEquipamentoDto {
    @IsString({ message: '$property| descricao: Precisa ser alfanumérico' })
    @MaxLength(255, { message: 'O campo "Nome" deve ter no máximo 255 caracteres' })
    nome: string;
}
