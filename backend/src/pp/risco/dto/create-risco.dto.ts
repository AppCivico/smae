import { Transform } from 'class-transformer';
import { IsArray, IsInt, IsNumber, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';
import { IsOnlyDate } from 'src/common/decorators/IsDateOnly';
import { DateTransform } from '../../../auth/transforms/date.transform';

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
    @MaxLength(255, { message: 'O campo "Título" deve ter no máximo 255 caracteres' })
    titulo: string;

    @IsOptional()
    @IsString()
    @MaxLength(2048, { message: 'O campo "Descrição" deve ter no máximo 2048 caracteres' })
    descricao: string;

    @IsOptional()
    @IsString()
    @MaxLength(255, { message: 'O campo "Causa" deve ter no máximo 255 caracteres' })
    causa: string;

    @IsOptional()
    @IsString()
    @MaxLength(255, { message: 'O campo "Consequência" deve ter no máximo 255 caracteres' })
    consequencia: string;

    @IsArray()
    @IsInt({ each: true, message: 'Cada item precisa ser um número inteiro' })
    @IsOptional()
    tarefa_id?: number[];

    @IsOptional()
    @IsString()
    @MaxLength(255, { message: 'O campo "Risco Tarefa" deve ter no máximo 255 caracteres' })
    risco_tarefa_outros?: string;
}

export class CreateProjetoRiscoTarefaDto {
    @IsArray()
    @IsInt({ each: true, message: 'Cada item precisa ser um número inteiro' })
    tarefa_id: number[];
}
