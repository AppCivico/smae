import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { DateTime } from 'luxon';
import { TarefaCronogramaDto } from 'src/common/dto/TarefaCronograma.dto';
import { DateTransform } from '../../../auth/transforms/date.transform';
import { IdSiglaDescricao } from '../../../common/dto/IdSigla.dto';
import { IdTituloNivelMaxRegDto, ProjetoDetailDto } from '../../projeto/entities/projeto.entity';
import { TarefaDependenciaDto } from '../dto/create-tarefa.dto';
import { IsDateYMD } from '../../../auth/decorators/date.decorator';

export class TarefaItemDto {
    id: number;
    orgao: IdSiglaDescricao | null;
    nivel: number;
    numero: number;
    tarefa_pai_id: number | null;
    tarefa: string;

    @IsDateYMD({ nullable: true })
    inicio_planejado: Date | null;

    @IsDateYMD({ nullable: true })
    termino_planejado: Date | null;

    duracao_planejado: number | null;

    @IsDateYMD({ nullable: true })
    inicio_real: Date | null;

    @IsDateYMD({ nullable: true })
    termino_real: Date | null;

    duracao_real: number | null;

    custo_estimado: number | null;
    custo_real: number | null;

    n_filhos_imediatos: number;
    n_dep_inicio_planejado: number;
    n_dep_termino_planejado: number;

    percentual_concluido: number | null;

    eh_marco: boolean;

    atraso: number | null;

    dependencias: TarefaDependenciaDto[];

    recursos: string;

    pode_editar: boolean;
    pode_editar_realizado: boolean;
}

export class TarefaItemDbDto extends TarefaItemDto {
    db_projecao_inicio: Date | null;
    db_projecao_termino: Date | null;
    db_projecao_atraso: number | null;
}

export class TarefaItemProjetadoDto extends TarefaItemDto {
    @ApiProperty({ type: String, format: 'date' })
    projecao_inicio: DateTime | undefined;
    @ApiProperty({ type: String, format: 'date' })
    projecao_termino: DateTime | undefined;
    projecao_atraso: number | undefined;
}

export class TarefaDetailDto extends TarefaItemDto {
    inicio_planejado_calculado: boolean;
    termino_planejado_calculado: boolean;
    duracao_planejado_calculado: boolean;

    descricao: string;

    projeto: ProjetoDetailDto | null;
}

export class ListApenasTarefaListDto {
    linhas: TarefaItemProjetadoDto[];
}

export class ListTarefaProjetoDto extends ListApenasTarefaListDto {
    projeto: ProjetoDetailDto;
    portfolio: IdTituloNivelMaxRegDto;
}

export class ListTarefaGenericoDto extends ListApenasTarefaListDto {
    projeto: ProjetoDetailDto | null;

    cabecalho: TarefaCronogramaDto | null;
}

export class DependenciasDatasDto {
    inicio_planejado_calculado: boolean;
    termino_planejado_calculado: boolean;
    duracao_planejado_calculado: boolean;

    @Transform(DateTransform)
    inicio_planejado: Date | null;

    @Transform(DateTransform)
    termino_planejado: Date | null;
    /**
     * Duração em dias da tarefa
     **/
    @Type(() => Number)
    duracao_planejado: number | null;
}
