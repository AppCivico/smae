import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Periodicidade, Serie } from '@prisma/client';
import { IdTituloDto } from '../../common/dto/IdTitulo.dto';
import { SeriesAgrupadas, VariavelItemDto } from '../../variavel/entities/variavel.entity';
import { VariaveisPeriodosDto } from './create-variavel.dto';
import { IdNomeDto } from '../../common/dto/IdNome.dto';
import { OrgaoResumo } from '../../orgao/entities/orgao.entity';
import { Decimal } from '@prisma/client/runtime/library';
import { IdSiglaDescricao } from '../../common/dto/IdSigla.dto';

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
export class VariavelDetailComAuxiliaresDto extends VariavelDetailDto {
    variavel_categorica: IdTituloDto | null;
    medicao_grupo: IdTituloDto[];
    validacao_grupo: IdTituloDto[];
    liberacao_grupo: IdTituloDto[];
}

export class VariavelGlobalDetailDto extends OmitType(VariavelDetailDto, ['responsaveis']) {
    orgao_proprietario: OrgaoResumo | null;
    medicao_grupo_ids: number[] | null;
    validacao_grupo_ids: number[] | null;
    liberacao_grupo_ids: number[] | null;
}

export class VariavelResumoInput {
    id: number;
    suspendida_em: Date | null;
    variavel_categorica_id: number | null;
    casas_decimais: number;
    periodicidade: Periodicidade;
    acumulativa: boolean;
    codigo: string;
    titulo: string;
    valor_base: Decimal;
    unidade_medida: IdSiglaDescricao;
    recalculando: boolean;
    recalculo_erro: string | null;
    recalculo_tempo: Decimal | null;
}

export class VariavelResumo {
    /***
     * qual o ID do variavel está associada
     * @example "1"
     */
    id: number;
    suspendida: boolean;
    variavel_categorica_id: number | null;
    unidade_medida: IdSiglaDescricao;

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
    valor_base: string;

    recalculando: boolean;
    recalculo_erro: string | null;
    recalculo_tempo: Decimal | null;
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
