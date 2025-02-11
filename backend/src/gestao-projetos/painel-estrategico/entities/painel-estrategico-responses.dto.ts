import { PickType } from '@nestjs/swagger';
import { IdCodNomeDto } from '../../../common/dto/IdCodNome.dto';
import { GeolocalizacaoDto, RetornoCreateEnderecoDto } from '../../../geo-loc/entities/geo-loc.entity';

export class PainelEstrategicoResponseDto {
    grandes_numeros: PainelEstrategicoGrandesNumeros;
    projeto_status: PainelEstrategicoProjetoStatus[];
    projeto_etapas: PainelEstrategicoProjetoEtapa[];
    projeto_orgao_responsavel: PainelEstrategicoOrgaoResponsavel[];
    projetos_concluidos_mes: PainelEstrategicoProjetosMesAno[];
    projetos_planejados_mes: PainelEstrategicoProjetosMesAno[];
    projetos_concluidos_ano: PainelEstrategicoProjetosAno[];
    projetos_planejados_ano: PainelEstrategicoProjetosAno[];
    anos_mapa_calor_planejados: number[];
    anos_mapa_calor_concluidos: number[];
    quantidades_projeto: PainelEstrategicoQuantidadesAnoCorrente;
    resumo_orcamentario: PainelEstrategicoResumoOrcamentario;
    execucao_orcamentaria_ano: PainelEstrategicoExecucaoOrcamentariaAno[];
}

export class PainelEstrategicoGrandesNumeros {
    total_projetos: number;
    total_orgaos: number;
    total_metas: number;
}

export class PainelEstrategicoProjetoStatus {
    status: string;
    quantidade: number;
}

export class PainelEstrategicoProjetoEtapa {
    etapa: string;
    quantidade: number;
}
export class PainelEstrategicoOrgaoResponsavel {
    orgao_sigla: string;
    orgao_descricao: string;
    quantidade: number;
}
export class PainelEstrategicoProjetosMesAno {
    ano: number;
    mes: number;
    coluna: number;
    linha: number;
    quantidade: number;
}
export class PainelEstrategicoProjetosAno {
    ano: number;
    quantidade: number;
}
export class PainelEstrategicoQuantidadesAnoCorrente {
    quantidade_planejada: number;
    quantidade_concluida: number;
    ano: number;
}
export class PainelEstrategicoResumoOrcamentario {
    custo_planejado_total: number;
    valor_empenhado_total: number;
    valor_liquidado_total: number;
}
export class PainelEstrategicoProjeto {
    nome_projeto: string;
    secretaria: IdCodNomeDto;
    meta: IdCodNomeDto;
    status: string;
    etapa_atual: string;
    termino_projetado: string;
    riscos_abertos: number;
    percentual_atraso: number;
    projeto_codigo: string;
    id: number;
}
export class PainelEstrategicoExecucaoOrcamentariaAno {
    ano: number;
    valor_planejado_total: number;
    valor_liquidado_total: number;
    valor_empenhado_total: number;
}
export class PainelEstrategicoExecucaoOrcamentariaLista {
    nome_projeto: string;
    valor_custo_planejado_total: number;
    valor_custo_planejado_hoje: number;
    valor_empenhado_total: number;
    valor_liquidado_total: number;
    codigo_projeto: string;
    id: number;
    ha_anos_nulos: boolean;
}

export class PainelEstrategicoGeoLocalizacao {
    projeto_nome: string;
    projeto_id: number;
    projeto_codigo: string;
    projeto_status: string;
    projeto_etapa: string;
    geolocalizacao: GeolocalizacaoDto[];
}

export class PainelEstrategicoGeoLocalizacaoDto {
    linhas: PainelEstrategicoGeoLocalizacao[];
}

export class GeolocalizacaoSummaryDto extends PickType(RetornoCreateEnderecoDto, ['endereco_exibicao', 'tipo']) {
    camadas: number[];
}

export class PainelEstrategicoGeoLocalizacaoV2 {
    projeto_id: number;
    projeto_status: string;
    projeto_etapa: string;
    orgao_resp_sigla: string;
    geolocalizacao_sumario: GeolocalizacaoSummaryDto;
}

export class PainelEstrategicoGeoLocalizacaoDtoV2 {
    linhas: PainelEstrategicoGeoLocalizacaoV2[];
}
