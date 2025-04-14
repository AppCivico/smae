import { Transform } from 'class-transformer';
import { IsArray, IsInt, IsNumber, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';
import { IsOnlyDate } from 'src/common/decorators/IsDateOnly';
import { DateTransform } from '../../../auth/transforms/date.transform';
import { MAX_LENGTH_DEFAULT, MAX_LENGTH_MEDIO } from 'src/common/consts';

export class CreateRiscoDto {
    @IsOnlyDate()
    @Transform(DateTransform)
    @ValidateIf((object, value) => value !== null)
    registrado_em: Date;

    @IsNumber()
    @IsOptional()
    probabilidade: number;

    @IsNumber()
    @IsOptional()
    impacto: number;

    @IsString()
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Título' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    titulo: string;

    @IsOptional()
    @IsString()
    @MaxLength(MAX_LENGTH_MEDIO, { message: `O campo "Descrição" pode ser no máximo ${MAX_LENGTH_MEDIO} caracteres` })
    descricao: string;

    @IsOptional()
    @IsString()
    @MaxLength(MAX_LENGTH_MEDIO, { message: `O campo "Causa" pode ser no máximo ${MAX_LENGTH_MEDIO} caracteres` })
    causa: string;

    @IsOptional()
    @IsString()
    @MaxLength(MAX_LENGTH_MEDIO, {
        message: `O campo "Consequência" pode ser no máximo ${MAX_LENGTH_MEDIO} caracteres`,
    })
    consequencia: string;

    @IsArray()
    @IsInt({ each: true, message: 'Cada item precisa ser um número inteiro' })
    @IsOptional()
    tarefa_id?: number[];

    @IsOptional()
    @IsString()
    @MaxLength(MAX_LENGTH_DEFAULT, {
        message: `O campo 'Risco tarefa' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres`,
    })
    risco_tarefa_outros?: string;
}

export class CreateProjetoRiscoTarefaDto {
    @IsArray()
    @IsInt({ each: true, message: 'Cada item precisa ser um número inteiro' })
    tarefa_id: number[];
}
