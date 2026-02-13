import { DemandaFinalidade, DemandaSituacao, DemandaStatus } from '@prisma/client';
import { IdNomeDto } from 'src/common/dto/IdNome.dto';
import { IdNomeExibicaoDto } from 'src/common/dto/IdNomeExibicao.dto';
import { GeolocalizacaoDto } from 'src/geo-loc/entities/geo-loc.entity';
import { ArquivoBaseDto } from 'src/upload/dto/create-upload.dto';

export class DemandaArquivoDto {
    id: number;
    autoriza_divulgacao: boolean;
    descricao: string | null;
    arquivo: ArquivoBaseDto;
}

export class DemandaAcaoDto {
    id: number;
    nome: string;
}

export class DemandaPermissoesDto {
    pode_editar: boolean;
    pode_enviar: boolean;
    pode_validar: boolean;
    pode_devolver: boolean;
    pode_cancelar: boolean;
    pode_remover: boolean;
}

export class DemandaDto {
    id: number;
    versao: number;
    orgao: IdNomeExibicaoDto;
    unidade_responsavel: string;
    nome_responsavel: string;
    cargo_responsavel: string;
    email_responsavel: string;
    telefone_responsavel: string;
    nome_projeto: string;
    descricao: string;
    justificativa: string;
    valor: string;
    finalidade: DemandaFinalidade;
    observacao: string | null;
    area_tematica: IdNomeDto;
    status: DemandaStatus;
    data_status_atual: string;
    criado_em: string;
    situacao_encerramento: DemandaSituacao | null;
    localizacao?: string;
    permissoes: DemandaPermissoesDto;
}

export class DemandaDetailDto extends DemandaDto {
    acoes: DemandaAcaoDto[];
    geolocalizacao: GeolocalizacaoDto[];
    arquivos: DemandaArquivoDto[];
    dias_em_registro: number;
    dias_em_validacao: number;
    dias_em_publicado: number;
    dias_em_encerrado: number;
    ultimo_historico: DemandaHistoricoDto | null;
}

export class ListDemandaDto {
    linhas: DemandaDto[];
}

export class DemandaHistoricoDto {
    id: number;
    status_anterior: DemandaStatus | null;
    status_novo: DemandaStatus;
    motivo: string | null;
    criado_por: IdNomeExibicaoDto;
    criado_em: string;
}
