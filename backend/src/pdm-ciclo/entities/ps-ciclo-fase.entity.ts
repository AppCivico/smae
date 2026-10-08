import { IsDateYMD } from '../../auth/decorators/date.decorator';
import { DateYMD } from '../../common/date2ymd';
import { IdNomeExibicaoDto } from '../../common/dto/IdNomeExibicao.dto';
import { ArquivoBaseDto } from '../../upload/dto/create-upload.dto';
import { MapeamentoMonitoramentoLegadoDto } from '../dto/ps-ciclo-fase.dto';

export class PsCicloFaseBlocoConfigDto {
    id: number;
    ordem: number;
    rotulo: string;
}

export class PsCicloFaseConfigDto {
    id: number;
    ordem: number;
    rotulo: string;
    aceita_tags: boolean;
    aceita_anexos: boolean;
    fecha_ciclo: boolean;
    blocos: PsCicloFaseBlocoConfigDto[];
}

export class PsCicloFaseConteudoBlocoDto {
    bloco_id: number;
    rotulo: string;
    conteudo: string;
    conteudo_texto: string;
}

export class PsCicloFaseTagDto {
    id: number;
    descricao: string;
    ods_id: number | null;
    removido: boolean;
}

export class PsCicloFaseRevisaoDto {
    id: number;
    fase_id: number;
    fase_rotulo: string;
    ultima_revisao: boolean;
    fecha_ciclo: boolean;
    automatico: boolean;
    comentario_sistema: string | null;
    @IsDateYMD()
    referencia_data: DateYMD;
    criado_em: Date;
    criador: IdNomeExibicaoDto;
    reaberto_em: Date | null;
    reaberto_por: IdNomeExibicaoDto | null;
    blocos: PsCicloFaseConteudoBlocoDto[];
    tags: PsCicloFaseTagDto[];
}

export class PsCicloFaseDocumentoDto {
    id: number;
    fase_id: number;
    descricao: string | null;
    criado_em: Date;
    criador: IdNomeExibicaoDto;
    arquivo: ArquivoBaseDto;
}

export class PsCicloFaseEstadoDto {
    config: PsCicloFaseConfigDto;
    preenchida: boolean;
    editavel: boolean;
    atual: PsCicloFaseRevisaoDto | null;
    historico: PsCicloFaseRevisaoDto[];
    /**
     * Última revisão desta fase no ciclo anterior (para "repetir anterior")
     */
    anterior: PsCicloFaseRevisaoDto | null;
    documentos: PsCicloFaseDocumentoDto[];
}

export class PsCicloFaseCicloDto {
    id: number;
    @IsDateYMD()
    data_ciclo: DateYMD;
    ativo: boolean;
}

export class PsCicloFasesDto {
    ciclo: PsCicloFaseCicloDto;
    ciclo_anterior: PsCicloFaseCicloDto | null;
    fechado: boolean;
    reaberto: boolean;
    pode_editar: boolean;
    pode_reabrir: boolean;
    fases_editaveis: number[];
    /**
     * Apenas fases e blocos habilitados; dados de fase ou bloco desabilitado deixam de ser exibidos
     */
    fases: PsCicloFaseEstadoDto[];
    historico_fechamentos: PsCicloFaseRevisaoDto[];
}

export class MonitoramentoMigracaoContagemDto {
    metas: number;
    ciclos: number;
    analises: number;
    riscos: number;
    fechamentos: number;
    fechamentos_automaticos: number;
    documentos: number;
}

export class MonitoramentoMigracaoPreviaDto {
    ja_migrado: boolean;
    mapeamento: MapeamentoMonitoramentoLegadoDto;
    contagem: MonitoramentoMigracaoContagemDto;
    /**
     * Conteúdo legado sem destino; a migração é recusada enquanto houver pendências
     */
    pendencias: string[];
    avisos: string[];
}
