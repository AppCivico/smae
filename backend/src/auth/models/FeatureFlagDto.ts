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
}
