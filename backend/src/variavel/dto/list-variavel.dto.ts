import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Periodicidade, Serie, TipoPdm } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { IdNomeDto } from '../../common/dto/IdNome.dto';
import { IdSigla, IdSiglaDescricao } from '../../common/dto/IdSigla.dto';
import { IdTituloDto } from '../../common/dto/IdTitulo.dto';
import { OrgaoResumo } from '../../orgao/entities/orgao.entity';
import { SeriesAgrupadas, VariavelItemDto } from '../../variavel/entities/variavel.entity';
import { VariaveisPeriodosDto } from './create-variavel.dto';
import { MaxLength } from 'class-validator';

export class ListVariavelDto {
    linhas: VariavelItemDto[];
}

export class PdmSimplesDto extends IdNomeDto {
    tipo: TipoPdm;
}

export class ListPdmSimplesDto {
    linhas: PdmSimplesDto[];
}

export class VariavelDetailDto extends VariavelItemDto {
    assuntos: VariavelAssuntoDto[];
    periodos: VariaveisPeriodosDto;
    dado_aberto: boolean;
    @MaxLength(255, { message: 'O campo "Metodologia" deve ter no máximo 255 caracteres' })
    metodologia: string | null;
    @MaxLength(2048, { message: 'O campo "Descrição" precisa ter no máximo 2048 caracteres' })
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

    medicao_orgao: IdSigla | null;
    validacao_orgao: IdSigla | null;
    liberacao_orgao: IdSigla | null;

    medicao_orgao_id: number | null;
    validacao_orgao_id: number | null;
    liberacao_orgao_id: number | null;
}

export class VariavelResumoInput {
    id: number;
    suspendida_em: Date | null;
    variavel_categorica_id: number | null;
    casas_decimais: number;
    periodicidade: Periodicidade;
    acumulativa: boolean;
    @MaxLength(255, { message: 'O campo "Código" deve ter no máximo 255 caracteres' })
    codigo: string;
    @MaxLength(255, { message: 'O campo "Título" deve ter no máximo 255 caracteres' })
    titulo: string;
    valor_base: Decimal;
    unidade_medida: IdSiglaDescricao;
    recalculando: boolean;
    @MaxLength(255, { message: 'O campo "Recálculo erro" deve ter no máximo 255 caracteres' })
    recalculo_erro: string | null;
    recalculo_tempo: Decimal | null;
    variavel_mae_id: number | null;
}

export class VariavelAssuntoDto {
    id: number;
    @MaxLength(255, { message: 'O campo "Nome" deve ter no máximo 255 caracteres' })
    nome: string;
    categoria_assunto_variavel_id?: number | null;
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

    @MaxLength(255, { message: 'O campo "Código" deve ter no máximo 255 caracteres' })
    codigo: string;
    @MaxLength(255, { message: 'O campo "Título" deve ter no máximo 255 caracteres' })
    titulo: string;
    @MaxLength(255, { message: 'O campo "Valor base" deve ter no máximo 255 caracteres' })
    valor_base: string;
    recalculando: boolean;
    @MaxLength(255, { message: 'O campo "Recálculo erro" deve ter no máximo 255 caracteres' })
    recalculo_erro: string | null;
    recalculo_tempo: Decimal | null;
    variavel_mae_id: number | null;
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

    dados_auxiliares?: VariavelAuxiliarDto;
}

export class VariavelAuxiliarDto {
    categoricas: Record<string, string> | null;
}
