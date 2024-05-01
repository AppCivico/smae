import { Transform } from 'class-transformer';
import { IsArray, IsInt, IsNumber, IsOptional, IsString, ValidateIf } from 'class-validator';
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
    titulo: string;

    @IsOptional()
    @IsString()
    descricao: string;

    @IsOptional()
    @IsString()
    causa: string;

    @IsOptional()
    @IsString()
    consequencia: string;

    @IsArray()
    @IsInt({ each: true, message: '$property| Cada item precisa ser um número inteiro' })
    @IsOptional()
    tarefa_id?: number[];

    @IsOptional()
    @IsString()
    risco_tarefa_outros?: string;
}

export class CreateProjetoRiscoTarefaDto {
    @IsArray()
    @IsInt({ each: true, message: '$property| Cada item precisa ser um número inteiro' })
    tarefa_id: number[];
}
