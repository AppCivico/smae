import { ApiProperty } from '@nestjs/swagger';
import { CicloFase } from '@prisma/client';
import { Transform, TransformFnParams } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional } from 'class-validator';
import { IsDateYMD } from '../../../auth/decorators/date.decorator';
import { NumberArrayTransformOrUndef } from '../../../auth/transforms/number-array.transform';
import { NumberTransform } from '../../../auth/transforms/number.transform';

export class PSMFFiltroDashboardQuadroDto {
    @IsInt()
    @Transform(NumberTransform)
    pdm_id: number;

    @IsOptional()
    @IsInt({ each: true })
    @Transform(NumberArrayTransformOrUndef)
    orgao_id?: number[];

    @IsOptional()
    @IsInt({ each: true })
    @Transform(NumberArrayTransformOrUndef)
    equipes?: number[];

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }: any) => value === 'true')
    visao_pessoal?: boolean; // Flag para visão pessoal

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }: any) => value === 'true')
    apenas_pendentes?: boolean; // Mostrar apenas itens com pendências

    @IsOptional()
    @IsInt()
    @Transform((a: TransformFnParams) => (a.value === '' ? undefined : +a.value))
    pagina?: number = 1; // Para paginação

    @IsOptional()
    @IsInt()
    @Transform((a: TransformFnParams) => (a.value === '' ? undefined : +a.value))
    ipp?: number = 20; // Para paginação
}

export class PSMFSituacaoVariavelDto {
    @ApiProperty({ description: 'Variáveis a coletar que estão atrasadas' })
    a_coletar_atrasadas: number;

    @ApiProperty({ description: 'Variáveis a coletar dentro do prazo' })
    a_coletar_prazo: number;

    @ApiProperty({ description: 'Variáveis coletadas que precisam ser conferidas (atrasadas ou não)' })
    coletadas_a_conferir: number;

    @ApiProperty({ description: 'Variáveis conferidas aguardando liberação (atrasadas ou não)' })
    conferidas_a_liberar: number;

    @ApiProperty({ description: 'Variáveis já liberadas' })
    liberadas: number;

    @ApiProperty({ description: 'Total de variáveis' })
    total: number;
}

export class PSMFQuadroVariaveisDto {
    @ApiProperty({ description: 'Quadro 1: Variáveis associadas ao PDM/PS selecionado (visao pessoal)' })
    associadas_plano_atual: PSMFSituacaoVariavelDto;

    @ApiProperty({
        description:
            'Quadro 2: Variáveis da equipe que ele faz parte não associadas ao PDM/PS que passou e nem a nenhum outro ativo (visão pessoal)',
    })
    nao_associadas_plano_atual: PSMFSituacaoVariavelDto;

    @ApiProperty({ description: 'Quadro 3: Total de variáveis por situação usadas no PDM/PS (visão geral)' })
    total_por_situacao: PSMFSituacaoVariavelDto;

    @ApiProperty({
        description:
            'Quadro 4: todas variaveis ativas que estão sem pdm, [considerar permissão do órgão] (visão geral)',
    })
    nao_associadas: PSMFSituacaoVariavelDto;
}

export class PSMFEstatisticasMetasDto {
    @ApiProperty({ description: 'Quantidade de metas com alguma pendência' })
    com_pendencia: number;

    @ApiProperty({ description: 'Quantidade de metas sem pendência' })
    sem_pendencia: number;

    @ApiProperty({ description: 'Quantidade de metas com todas as variáveis liberadas' })
    variaveis_liberadas: number;

    @ApiProperty({ description: 'Quantidade de metas com alguma variável a liberar' })
    variaveis_a_liberar: number;

    @ApiProperty({ description: 'Quantidade de metas com cronograma preenchido' })
    cronograma_preenchido: number;

    @ApiProperty({ description: 'Quantidade de metas com cronograma a preencher' })
    cronograma_a_preencher: number;

    @ApiProperty({ description: 'Quantidade de metas com orçamento preenchido' })
    orcamento_preenchido: number;

    @ApiProperty({ description: 'Quantidade de metas com orçamento a preencher' })
    orcamento_a_preencher: number;

    @ApiProperty({ description: 'Quantidade de metas com qualificação preenchida' })
    qualificacao_preenchida: number;

    @ApiProperty({ description: 'Quantidade de metas com qualificação a preencher' })
    qualificacao_a_preencher: number;

    @ApiProperty({ description: 'Quantidade de metas com risco preenchido' })
    risco_preenchido: number;

    @ApiProperty({ description: 'Quantidade de metas com risco a preencher' })
    risco_a_preencher: number;

    @ApiProperty({ description: 'Quantidade de metas fechadas' })
    fechadas: number;

    @ApiProperty({ description: 'Quantidade de metas a fechar' })
    a_fechar: number;
}

export class PSMFStatusVariaveisMetaDto {
    @ApiProperty({ description: 'Total de variáveis da meta/iniciativa/atividade' })
    total: number;

    @ApiProperty({ description: 'Total a coletar no ciclo' })
    a_coletar_total: number;

    @ApiProperty({ description: 'Variáveis a coletar' })
    a_coletar: number;

    @ApiProperty({ description: 'Variáveis coletadas não conferidas' })
    coletadas_nao_conferidas: number;

    @ApiProperty({ description: 'Variáveis conferidas não liberadas' })
    conferidas_nao_liberadas: number;

    @ApiProperty({ description: 'Variáveis liberadas' })
    liberadas: number;
}

export class PSMFCicloDto {
    @ApiProperty()
    id: number;

    @ApiProperty({ description: 'Fase atual', enum: CicloFase, example: 'Analise' })
    fase: CicloFase; // 'Analise', 'Risco', 'Fechamento'

    @IsDateYMD()
    data_ciclo: Date;
}

export class PSMFCountDto {
    total: number;
    preenchido: number;
}

export class PSMFSituacaoCicloDto {
    fase: CicloFase;
    preenchido: boolean;
}

export class PSMFItemMetaDto {
    @ApiProperty({ description: 'ID da meta/iniciativa/atividade' })
    id: number;

    @ApiProperty({ description: 'Código' })
    codigo: string;

    @ApiProperty({ description: 'Título' })
    titulo: string;

    @ApiProperty({ description: 'Tipo do item' })
    tipo: 'meta' | 'iniciativa' | 'atividade';

    @ApiProperty({ description: 'Contadores de pendência de orçamento (se existir orçamento terá total 1)' })
    pendencia_orcamento: PSMFCountDto;

    @ApiProperty({
        description: 'Contadores de pendência de cronograma (ou cronogramas, se existirem no futuro vários)',
    })
    pendencia_cronograma: PSMFCountDto;

    @ApiProperty({ description: 'Situação das fases do monitoramento da meta' })
    monitoramento_ciclo: PSMFSituacaoCicloDto[];

    @ApiProperty({ description: 'Estatísticas de variáveis' })
    variaveis: PSMFStatusVariaveisMetaDto;

    @ApiProperty({ description: 'ID da meta pai (para iniciativas e atividades)', required: false })
    meta_id?: number;

    @ApiProperty({ description: 'ID da iniciativa pai (para atividades)', required: false })
    iniciativa_id?: number;
}

export class PSMFListaMetasDto {
    @ApiProperty({ description: 'Lista de metas/iniciativas/atividades' })
    itens: PSMFItemMetaDto[];

    @ApiProperty({ description: 'Informações do ciclo atual' })
    ciclo_atual?: PSMFCicloDto;

    @ApiProperty({ description: 'Número total de itens' })
    total: number;

    @ApiProperty({ description: 'Página atual' })
    pagina: number;
}

export class PSMFRespostaDashboardDto {
    @ApiProperty({ description: 'Dados dos quadros de variáveis' })
    variaveis: PSMFQuadroVariaveisDto;

    @ApiProperty({ description: 'Estatísticas das metas' })
    estatisticas_metas: PSMFEstatisticasMetasDto;

    @ApiProperty({ description: 'Lista de metas/iniciativas/atividades' })
    lista_metas: PSMFListaMetasDto;
}
