import { IsString, MaxLength } from 'class-validator';

export class CreateTipoAcompanhamentoDto {
    @IsString()
    @MaxLength(1024)
    nome: string;
}
