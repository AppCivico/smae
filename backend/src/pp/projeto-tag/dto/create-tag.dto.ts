import { IsString, MaxLength } from 'class-validator';

export class CreateProjetoTagDto {
    /**
     * nome
     */
    @IsString({ message: '$property| Descrição: Precisa ser alfanumérico' })
    @MaxLength(250, { message: '$property| Descrição: Máximo 250 caracteres' })
    descricao: string;
}
