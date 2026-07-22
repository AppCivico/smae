import { ApiProperty } from '@nestjs/swagger';

export class RecalcEquipePessoaAfetadaDto {
    @ApiProperty({ description: 'ID da pessoa que teve alguma correção aplicada' })
    pessoa_id: number;

    @ApiProperty({ description: 'Quantidade de vínculos de equipe adicionados para esta pessoa' })
    equipes_adicionadas: number;

    @ApiProperty({ description: 'Quantidade de vínculos de equipe removidos para esta pessoa' })
    equipes_removidas: number;

    @ApiProperty({ description: 'Indica se os perfis (perfis_equipe_pdm/perfis_equipe_ps) foram alterados' })
    perfil_alterado: boolean;
}

export class RecalcEquipeResumoDto {
    @ApiProperty({ description: 'Total de pessoas consideradas no recálculo (inclusive desativadas)' })
    total_pessoas: number;

    @ApiProperty({ description: 'Total de pessoas efetivamente processadas (com órgão)' })
    pessoas_processadas: number;

    @ApiProperty({ description: 'Pessoas ignoradas por não possuírem órgão' })
    pessoas_puladas_sem_orgao: number;

    @ApiProperty({ description: 'Pessoas que tiveram alguma correção (equipe e/ou perfil)' })
    pessoas_com_correcao: number;

    @ApiProperty({ description: 'Pessoas que tiveram vínculos de equipe corrigidos (adição/remoção)' })
    pessoas_com_correcao_equipe: number;

    @ApiProperty({ description: 'Pessoas que tiveram os perfis recalculados/alterados' })
    pessoas_com_correcao_perfil: number;

    @ApiProperty({ description: 'Total de vínculos de equipe adicionados em todas as pessoas' })
    equipes_adicionadas: number;

    @ApiProperty({ description: 'Total de vínculos de equipe removidos em todas as pessoas' })
    equipes_removidas: number;

    @ApiProperty({
        type: [RecalcEquipePessoaAfetadaDto],
        description: 'Detalhamento por pessoa que teve alguma correção aplicada',
    })
    pessoas_afetadas: RecalcEquipePessoaAfetadaDto[];
}
