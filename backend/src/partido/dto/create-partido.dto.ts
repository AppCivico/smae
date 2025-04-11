import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Max, MaxLength } from 'class-validator';
import { IsOnlyDate } from 'src/common/decorators/IsDateOnly';
import { DateTransform } from '../../auth/transforms/date.transform';

export class CreatePartidoDto {
    @IsNumber()
    @Max(99)
    numero: number;

    @IsString({ message: '$property| sigla: Precisa ser alfanumérico' })
    @MaxLength(20, { message: '$property| sigla: Máximo 20 caracteres' })
    sigla: string;

    @IsString({ message: '$property| nome: Precisa ser alfanumérico' })
    @MaxLength(250, { message: '$property| nome: Máximo 250 caracteres' })
    nome: string;

    @IsOptional()
    @IsString({ message: '$property| observação: Precisa ser alfanumérico' })
    @MaxLength(250, { message: '$property| observação: Máximo 250 caracteres' })
    observacao?: string;

    /**
     * fundação do partido
     * @example YYYY-MM-DD
     */
    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    fundacao?: Date;

    /**
     * encerramento do partido
     * @example YYYY-MM-DD
     */
    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    encerramento?: Date;
}
