import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { DateTime } from 'luxon';
import { IdSiglaDescricao } from '../../../common/dto/IdSigla.dto';
import { IdTituloNivelMaxDto, ProjetoDetailDto } from '../../projeto/entities/projeto.entity';
import { TarefaDependenciaDto } from '../dto/create-tarefa.dto';

export class TarefaItemDto {
    id: number;
    orgao: IdSiglaDescricao | null;
    nivel: number;
    numero: number;
    tarefa_pai_id: number | null;
    tarefa: string;

    @Type(() => Date)
    inicio_planejado: Date | null;
    @Type(() => Date)
    termino_planejado: Date | null;

    duracao_planejado: number | null;

    @Type(() => Date)
    inicio_real: Date | null;

    @Type(() => Date)
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
}

export class TarefaItemDbDto extends TarefaItemDto {
    db_projecao_inicio: Date | null;
    db_projecao_termino: Date | null;
    db_projecao_atraso: number | null;
}

export class TarefaItemProjetadoDto extends TarefaItemDto {
    @ApiProperty({ type: Date })
    projecao_inicio: DateTime | undefined;
    @ApiProperty({ type: Date })
    projecao_termino: DateTime | undefined;
    projecao_atraso: number | undefined;
}

export class TarefaDetailDto extends TarefaItemDto {
    inicio_planejado_calculado: boolean;
    termino_planejado_calculado: boolean;
    duracao_planejado_calculado: boolean;

    descricao: string;
    recursos: string;

    dependencias: TarefaDependenciaDto[];
    projeto: ProjetoDetailDto;
}

export class ListTarefaDto {
    linhas: TarefaItemProjetadoDto[];
    projeto: ProjetoDetailDto;
    portfolio: IdTituloNivelMaxDto;
}

export class ListTarefaListDto {
    linhas: TarefaItemProjetadoDto[];
    projeto: ProjetoDetailDto;
}

export class DependenciasDatasDto {
    inicio_planejado_calculado: boolean;
    termino_planejado_calculado: boolean;
    duracao_planejado_calculado: boolean;

    @Type(() => Date)
    inicio_planejado: Date | null;

    @Type(() => Date)
    termino_planejado: Date | null;
    /**
     * Duração em dias da tarefa
     **/
    @Type(() => Number)
    duracao_planejado: number | null;
}
