import { ModuloSistema, TipoPdm } from 'src/generated/prisma/client';
import { IdSiglaDescricao } from '../../common/dto/IdSigla.dto';
import { PdmPermissionLevel, RetornoPSEquipeAdminCPDto, RetornoPSEquipePontoFocalDto, RetornoPSEquipeTecnicoCPDto } from './create-pdm.dto';
import { IsDateYMD } from '../../auth/decorators/date.decorator';
import { ApiProperty, PickType } from '@nestjs/swagger';

export class PdmDto {
    nome: string;
    descricao: string | null;
    prefeito: string;
    equipe_tecnica: string | null;
    @IsDateYMD({ nullable: true })
    data_inicio: string | null;
    @IsDateYMD({ nullable: true })
    data_fim: string | null;
    @IsDateYMD({ nullable: true })
    data_publicacao: string | null;
    @IsDateYMD({ nullable: true })
    periodo_do_ciclo_participativo_inicio: string | null;
    @IsDateYMD({ nullable: true })
    periodo_do_ciclo_participativo_fim: string | null;
    @IsDateYMD({ nullable: true })
    considerar_atraso_apos: string | null;
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
    @ApiProperty({
        description:
            'CONFIG_WRITE = 2, CONTENT_WRITE = 1, CONFIG_NONE = 0; Respectivamente escreve nos níveis de: PDM, Metas, Nenhum',
        enum: PdmPermissionLevel,
        enumName: 'PdmPermissionLevel',
    })
    perm_level: number;
    tipo: TipoPdm;
    sistema: ModuloSistema;
    meses: number[];
}

export class PdmRotuloInfoDto extends PickType(PdmDto, [
    'rotulo_macro_tema',
    'rotulo_tema',
    'rotulo_sub_tema',
    'rotulo_contexto_meta',
    'rotulo_complementacao_meta',
    'rotulo_iniciativa',
    'rotulo_atividade',
]) {}

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
