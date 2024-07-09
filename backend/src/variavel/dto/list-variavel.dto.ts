import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Periodicidade, Serie } from '@prisma/client';
import { IdTituloDto } from '../../common/dto/IdTitulo.dto';
import { SeriesAgrupadas, VariavelItemDto } from '../../variavel/entities/variavel.entity';
import { VariaveisPeriodosDto } from './create-variavel.dto';
import { IdNomeDto } from '../../common/dto/IdNome.dto';

export class ListVariavelDto {
    linhas: VariavelItemDto[];
}

export class VariavelDetailDto extends VariavelItemDto {
    assuntos: IdNomeDto[];
    periodos: VariaveisPeriodosDto;
    dado_aberto: boolean;
    metodologia: string | null;
    descricao: string | null;
    fonte: IdNomeDto | null;
}

export class VariavelGlobalDetailDto extends OmitType(VariavelDetailDto, ['responsaveis']) {
    orgao_proprietario_id: number | null;
    medicao_grupo_ids: number[] | null;
    validacao_grupo_ids: number[] | null;
    liberacao_grupo_ids: number[] | null;
}

export class VariavelResumo {
    /***
     * qual o ID do variavel está associada
     * @example "1"
     */
    id: number;
    suspendida: boolean;
    /***
     * quantas cadas decimais são esperadas no envio/retorno
     * @example "11"
     */
    casas_decimais: number;
    /**
     * @example "Mensal"
     */
    @ApiProperty({ type: String })
    periodicidade: Periodicidade;

    acumulativa: boolean;

    codigo: string;
    titulo: string;
}

export class ListSeriesAgrupadas {
    linhas: SeriesAgrupadas[];
    /**
     * opcional - nao volta na serie de indicadores
     */
    variavel?: VariavelResumo;

    /**
     * opcional - volta apenas na formula composta
     */
    formula_composta?: IdTituloDto;

    /**
     * contextualiza qual a ordem que as séries serão apresentadas dentro de SeriesAgrupadas
     * @example "["Previsto", "PrevistoAcumulado", "Realizado", "RealizadoAcumulado"]"
     */
    ordem_series: Serie[];
}
