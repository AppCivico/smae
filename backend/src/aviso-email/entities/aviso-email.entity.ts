import { AvisoPeriodo, TipoAviso } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';
import { NumberTransform } from '../../auth/transforms/number.transform';
import { IdNomeDto } from '../../common/dto/IdNome.dto';
import { IdTituloDto } from '../../common/dto/IdTitulo.dto';

export class AvisoEmailItemDto {
    id: number;
    tipo: TipoAviso;
    projeto: IdNomeDto | null;
    tarefa: IdTituloDto | null;
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
