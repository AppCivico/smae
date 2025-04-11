import { IsString, MaxLength } from 'class-validator';

export class CreateProjetoEtapaDto {
    /**
     * Descrição
     */
    @IsString({ message: '$property| descrição: Precisa ser alfanumérico' })
    @MaxLength(1000, { message: '$property| descrição: Máximo 1000 caracteres' })
    descricao: string;
}
