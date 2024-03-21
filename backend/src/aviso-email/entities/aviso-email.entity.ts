import { AvisoPeriodo, TipoAviso } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';
import { IdDesc } from '../../atividade/entities/atividade.entity';
import { NumberTransform } from '../../auth/transforms/number.transform';
import { IdNomeDto } from '../../common/dto/IdNome.dto';

export class AvisoEmailItemDto {
    id: number;
    tipo: TipoAviso;
    projeto: IdNomeDto | null;
    tarefa: IdDesc | null;
    com_copia: string[];
    numero: number;
    numero_periodo: AvisoPeriodo;
    recorrencia_dias: number;
    ativo: boolean;
}

export class ListAvisoEmailDto {
    linhas: AvisoEmailItemDto[];
}

export class FilterAvisoEamilDto {
    @IsOptional()
    @IsInt()
    @Transform(NumberTransform)
    id?: number;

    @IsOptional()
    @IsInt()
    @Transform(NumberTransform)
    projeto_id?: number;

    @IsOptional()
    @IsInt()
    @Transform(NumberTransform)
    transferencia_id?: number;

    @IsOptional()
    @IsInt()
    @Transform(NumberTransform)
    tarefa_cronograma_id?: number;
}
