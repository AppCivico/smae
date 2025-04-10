import { IsString, MaxLength } from 'class-validator';

export class CreateProjetoTagDto {
    /**
     * nome
     */
    @IsString({ message: '$property| Descrição: Precisa ser alfanumérico' })
    @MaxLength(2048, { message: 'O campo "Descricao" deve ter no máximo 2048 caracteres' })
    descricao: string;
}
