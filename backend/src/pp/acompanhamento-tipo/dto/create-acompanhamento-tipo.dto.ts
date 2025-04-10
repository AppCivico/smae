import { IsString, MaxLength } from 'class-validator';

export class CreateTipoAcompanhamentoDto {
    @IsString()
    @MaxLength(255, { message: 'O campo "Nome" deve ter no máximo 255 caracteres' })
    nome: string;
}
