import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PosicaoLogotipo } from '@prisma/client';

export class TermoEncerramentoIconeDto {
    id: number;
    download_token: string;
}

export class TermoEncerramentoJustificativaDto {
    id: number;
    descricao: string;
    habilitar_info_adicional: boolean;
}

export class TermoEncerramentoDetalheDto {
    @ApiPropertyOptional({ description: 'ID do registro salvo. Null se não houver rascunho.' })
    id: number | null;

    projeto_id: number;

    @ApiProperty({ description: 'True se os dados vêm de um rascunho salvo no banco' })
    em_rascunho: boolean;

    @ApiProperty({ description: 'True se o usuário pode excluir/resetar o rascunho atual' })
    pode_excluir: boolean;

    // --- Snapshot (Dados do Projeto - somente leitura) ---
    nome_projeto: string;
    orgao_responsavel_nome: string;
    portfolios_nomes: string;
    @ApiProperty({ description: 'HTML do objeto do projeto' })
    objeto: string;

    status_final: string;

    etapa_nome: string;

    // --- Campos Editáveis ---

    previsao_inicio: Date | null;
    previsao_termino: Date | null;
    data_inicio_real: Date | null;
    data_termino_real: Date | null;
    previsao_custo: number | null;
    valor_executado_total: number | null;
    justificativa_id: number | null;
    justificativa_complemento: string | null;
    responsavel_encerramento_nome: string | null;
    data_encerramento: Date | null;
    assinatura: string | null;

    @ApiProperty({ enum: PosicaoLogotipo, enumName: 'PosicaoLogotipo' })
    posicao_logotipo: PosicaoLogotipo;

    // --- Relacionamentos expandidos ---

    @ApiPropertyOptional({ type: () => TermoEncerramentoIconeDto })
    icone: TermoEncerramentoIconeDto | null;

    @ApiPropertyOptional({ type: () => TermoEncerramentoJustificativaDto })
    justificativa: TermoEncerramentoJustificativaDto | null;
}
