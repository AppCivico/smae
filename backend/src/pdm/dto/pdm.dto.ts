import { TipoPdm } from '@prisma/client';
import { IdSiglaDescricao } from '../../common/dto/IdSigla.dto';
import { RetornoPSEquipeAdminCPDto, RetornoPSEquipePontoFocalDto, RetornoPSEquipeTecnicoCPDto } from './create-pdm.dto';

export class PdmDto {
    nome: string;
    descricao: string | null;
    prefeito: string;
    equipe_tecnica: string | null;
    data_inicio: string | null;
    data_fim: string | null;
    data_publicacao: string | null;
    periodo_do_ciclo_participativo_inicio: string | null;
    periodo_do_ciclo_participativo_fim: string | null;
    rotulo_macro_tema: string;
    rotulo_tema: string;
    rotulo_sub_tema: string;
    rotulo_contexto_meta: string;
    rotulo_complementacao_meta: string;
    possui_macro_tema: boolean;
    possui_tema: boolean;
    possui_sub_tema: boolean;
    possui_contexto_meta: boolean;
    possui_complementacao_meta: boolean;
    logo: string | null;
    ativo: boolean;
    rotulo_iniciativa: string;
    rotulo_atividade: string;
    possui_iniciativa: boolean;
    possui_atividade: boolean;
    nivel_orcamento: string;
    id: number;
    pode_editar: boolean;
    tipo: TipoPdm;
}

export class PlanoSetorialAnteriorDto {
    id: number;
    nome: string;
    orgao_admin: IdSiglaDescricao | null;
}

export class PlanoSetorialDto extends PdmDto {
    ps_tecnico_cp: RetornoPSEquipeAdminCPDto;
    ps_admin_cp: RetornoPSEquipeTecnicoCPDto;
    ps_ponto_focal: RetornoPSEquipePontoFocalDto;

    legislacao_de_instituicao: string | null;
    monitoramento_orcamento: boolean;
    orgao_admin: IdSiglaDescricao | null;
    pdm_anteriores: PlanoSetorialAnteriorDto[];
}
