import { ApiProperty } from '@nestjs/swagger';

export class FeatureFlagDto {
    @ApiProperty({ description: 'Sempre true, usada no PDM, habilita home ter o panorama com stats de metas' })
    panorama: boolean;
    @ApiProperty({ description: 'Sempre true, usada no PDM, menu "Monitoramento" remodelado, já não pode ser false' })
    mf_v2: boolean;
    @ApiProperty({ description: 'Habilita dashboard interno de projetos' })
    pp_pe: boolean;
    @ApiProperty({ description: 'Habilita o PDM antigo' })
    mostrar_pdm_antigo: boolean;
    @ApiProperty({
        description:
            'Se true, o perfil CP (Técnico) em Planos Setoriais terá permissão de escrita apenas em Metas e abaixo (readonly na config do PDM/PS). Se false, ele tem permissões de admin.',
    })
    ps_cp_readonly_pdm_config: boolean;
}
