import { ApiProperty } from '@nestjs/swagger';
import { RelatorioVisibilidade } from 'src/generated/prisma/client';
import { IsEnum } from 'class-validator';

export class RelatorioParamDto {
    filtro: string;
    valor: string | string[];
}

export class RelatorioDto {
    id: number;
    criado_em: Date;
    criador: { nome_exibicao: string };
    fonte: string;
    arquivo: string | null;
    parametros: any;
    progresso: number | null;
    // TODO: Remover isso aqui e mandar só enum de visibilidade.
    eh_publico: boolean;
    @IsEnum(RelatorioVisibilidade)
    visibilidade: RelatorioVisibilidade;
    processamento: RelatorioProcessamentoDto | null;
    @ApiProperty({
        type: RelatorioParamDto,
        isArray: true,
        description: 'Lista de parâmetros processados do relatório',
    })
    parametros_processados: RelatorioParamDto[] | null;
    resumo_saida: object[] | null;
    pdm_id: number | null;
}

export class RelatorioProcessamentoDto {
    @ApiProperty({
        deprecated: true,
    })
    id: number;
    congelado_em: Date | null;
    executado_em: Date | null;
    err_msg: string | null;
}
